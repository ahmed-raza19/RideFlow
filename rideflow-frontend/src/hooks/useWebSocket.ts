// hooks/useWebSocket.ts
// React hook for WebSocket integration with driver dashboard

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../lib/socket';

interface UseWebSocketOptions {
  onNewRideRequest?: (data: any) => void;
  onRideStatusUpdate?: (data: any) => void;
  onDriverLocationUpdate?: (data: any) => void;
  onEmergencyNearby?: (data: any) => void;
  onStatusUpdated?: (data: any) => void;
  onNotification?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any; timestamp: Date } | null>(null);
  const eventListenersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map());

  // Update connection status
  useEffect(() => {
    const updateStatus = () => {
      setIsConnected(socketService.isConnected());
      setConnectionStatus(socketService.getConnectionStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Custom event listeners for window events
    const handleNewRideRequest = (event: CustomEvent) => {
      const data = event.detail;
      setLastEvent({ type: 'new_ride_request', data, timestamp: new Date() });
      options.onNewRideRequest?.(data);
    };

    const handleRideStatusUpdate = (event: CustomEvent) => {
      const data = event.detail;
      setLastEvent({ type: 'ride_status_update', data, timestamp: new Date() });
      options.onRideStatusUpdate?.(data);
    };

    const handleDriverLocationUpdate = (event: CustomEvent) => {
      const data = event.detail;
      setLastEvent({ type: 'driver_location_update', data, timestamp: new Date() });
      options.onDriverLocationUpdate?.(data);
    };

    const handleEmergencyNearby = (event: CustomEvent) => {
      const data = event.detail;
      setLastEvent({ type: 'emergency_nearby', data, timestamp: new Date() });
      options.onEmergencyNearby?.(data);
    };

    const handleStatusUpdated = (event: CustomEvent) => {
      const data = event.detail;
      setLastEvent({ type: 'driver_status_updated', data, timestamp: new Date() });
      options.onStatusUpdated?.(data);
    };

    const handleNotification = (event: CustomEvent) => {
      const data = event.detail;
      setLastEvent({ type: 'notification', data, timestamp: new Date() });
      options.onNotification?.(data);
    };

    const handleNavigateToLive = () => {
      setLastEvent({ type: 'navigate_to_live', data: {}, timestamp: new Date() });
    };

    // Add event listeners
    window.addEventListener('new_ride_request', handleNewRideRequest as EventListener);
    window.addEventListener('ride_status_update', handleRideStatusUpdate as EventListener);
    window.addEventListener('driver_location_update', handleDriverLocationUpdate as EventListener);
    window.addEventListener('emergency_nearby', handleEmergencyNearby as EventListener);
    window.addEventListener('driver_status_updated', handleStatusUpdated as EventListener);
    window.addEventListener('notification', handleNotification as EventListener);
    window.addEventListener('navigate_to_live', handleNavigateToLive as EventListener);

    return () => {
      window.removeEventListener('new_ride_request', handleNewRideRequest as EventListener);
      window.removeEventListener('ride_status_update', handleRideStatusUpdate as EventListener);
      window.removeEventListener('driver_location_update', handleDriverLocationUpdate as EventListener);
      window.removeEventListener('emergency_nearby', handleEmergencyNearby as EventListener);
      window.removeEventListener('driver_status_updated', handleStatusUpdated as EventListener);
      window.removeEventListener('notification', handleNotification as EventListener);
      window.removeEventListener('navigate_to_live', handleNavigateToLive as EventListener);
    };
  }, [options]);

  // WebSocket actions
  const goOnline = useCallback((locationID?: number, vehicleID?: number) => {
    socketService.goOnline(locationID, vehicleID);
  }, []);

  const goOffline = useCallback(() => {
    socketService.goOffline();
  }, []);

  const updateLocation = useCallback((latitude: number, longitude: number, locationID?: number) => {
    socketService.updateLocation(latitude, longitude, locationID);
  }, []);

  const acceptRide = useCallback((rideId: number, vehicleID: number) => {
    socketService.acceptRide(rideId, vehicleID);
  }, []);

  const rejectRide = useCallback((rideId: number, reason?: string) => {
    socketService.rejectRide(rideId, reason);
  }, []);

  const startRide = useCallback((rideId: number) => {
    socketService.startRide(rideId);
  }, []);

  const completeRide = useCallback((rideId: number) => {
    socketService.completeRide(rideId);
  }, []);

  const sendSOS = useCallback((rideId?: number, location?: { latitude: number; longitude: number }) => {
    const sosLocation = location ? { lat: location.latitude, lng: location.longitude } : location;
    socketService.sendSOS(rideId, sosLocation);
  }, []);

  const reconnect = useCallback(() => {
    socketService.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  // Custom event management
  const addEventListener = useCallback((event: string, callback: (data: any) => void) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, []);
    }
    eventListenersRef.current.get(event)!.push(callback);

    return () => {
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }, []);

  const emitEvent = useCallback((event: string, data: any) => {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }, []);

  return {
    // Connection status
    isConnected,
    connectionStatus,
    lastEvent,

    // WebSocket actions
    goOnline,
    goOffline,
    updateLocation,
    acceptRide,
    rejectRide,
    startRide,
    completeRide,
    sendSOS,
    reconnect,
    disconnect,

    // Event management
    addEventListener,
    emitEvent,

    // Utility
    clearLastEvent: () => setLastEvent(null)
  };
}

// Hook for geolocation tracking
export function useGeolocation(options: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
} = {}) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    const geoOptions = {
      enableHighAccuracy: options.enableHighAccuracy || true,
      timeout: options.timeout || 5000,
      maximumAge: options.maximumAge || 0
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setError(null);
        setIsLoading(false);
      },
      (error) => {
        setError(error.message);
        setIsLoading(false);
      },
      geoOptions
    );
  }, [options]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return Promise.reject(new Error('Geolocation not supported'));
    }

    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(location);
          resolve(location);
        },
        (error) => {
          setError(error.message);
          reject(error);
        },
        {
          enableHighAccuracy: options.enableHighAccuracy || true,
          timeout: options.timeout || 5000,
          maximumAge: options.maximumAge || 0
        }
      );
    });
  }, [options]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    error,
    isLoading,
    startTracking,
    stopTracking,
    getCurrentPosition
  };
}
