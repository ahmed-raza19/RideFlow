// lib/socket.ts
// Socket.IO client integration for real-time driver features

// Note: Socket.IO client needs to be installed: npm install socket.io-client
// For now, we'll create a mock implementation that can be easily upgraded

// Mock Socket.IO implementation for development
// Replace with actual Socket.IO when dependency is installed
interface MockSocket {
  on(event: string, callback: (data: any) => void): void;
  emit(event: string, data: any): void;
  disconnect(): void;
  connected: boolean;
}

class MockSocketIO {
  private socket: MockSocket;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  
  constructor() {
    this.socket = {
      on: (event, callback) => {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
      },
      emit: (event, data) => {
        // Simulate some events for development
        setTimeout(() => {
          if (event === 'driver_online') {
            this.simulateEvent('status_updated', { status: 'Online' });
          }
        }, 500);
      },
      disconnect: () => {
        this.listeners.clear();
      },
      connected: true
    };
  }
  
  private simulateEvent(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
  
  connect() {
    return this.socket;
  }
}

const io = MockSocketIO;
import { toast } from '../components/ui/Toast';

class SocketService {
  private socket: MockSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  connect(token?: string) {
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      console.warn('No authentication token available for WebSocket connection');
      return;
    }

    this.socket = new io().connect();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      toast.success('Real-time connection established');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      toast.info('Real-time connection lost');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to establish real-time connection');
      } else {
        toast.info(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      toast.success('Real-time connection restored');
    });

    // Driver-specific events
    this.socket.on('new_ride_request', (data) => {
      console.log('New ride request received:', data);
      this.handleNewRideRequest(data);
    });

    this.socket.on('ride_taken', (data) => {
      console.log('Ride taken by another driver:', data);
      this.handleRideTaken(data);
    });

    this.socket.on('ride_status_update', (data) => {
      console.log('Ride status updated:', data);
      this.handleRideStatusUpdate(data);
    });

    this.socket.on('driver_location_update', (data) => {
      console.log('Driver location updated:', data);
      this.handleDriverLocationUpdate(data);
    });

    this.socket.on('emergency_nearby', (data) => {
      console.log('Emergency alert nearby:', data);
      this.handleEmergencyNearby(data);
    });

    this.socket.on('status_updated', (data) => {
      console.log('Driver status updated:', data);
      this.handleStatusUpdated(data);
    });

    this.socket.on('sos_sent', (data) => {
      console.log('SOS alert sent:', data);
      this.handleSOSSent(data);
    });

    this.socket.on('request_rating', (data) => {
      console.log('Rating requested:', data);
      this.handleRatingRequest(data);
    });

    // General events
    this.socket.on('notification', (data) => {
      console.log('Notification received:', data);
      this.handleNotification(data);
    });

    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
      toast.error(data.message || 'An error occurred');
    });
  }

  // Event handlers
  private handleNewRideRequest(data: any) {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('new_ride_request', { detail: data }));
    
    // Show toast notification
    toast.info(`New ride request: ${data.customerName} in ${data.pickupCity}`, 5000);
  }

  private handleRideTaken(data: any) {
    window.dispatchEvent(new CustomEvent('ride_taken', { detail: data }));
    toast.info('Ride was taken by another driver');
  }

  private handleRideStatusUpdate(data: any) {
    window.dispatchEvent(new CustomEvent('ride_status_update', { detail: data }));
    
    const statusMessages = {
      'Accepted': 'Ride accepted! Driver is on the way.',
      'InProgress': 'Ride has started.',
      'Completed': 'Ride completed successfully.'
    };
    
    const message = statusMessages[data.status] || `Ride status: ${data.status}`;
    toast.success(message);
  }

  private handleDriverLocationUpdate(data: any) {
    window.dispatchEvent(new CustomEvent('driver_location_update', { detail: data }));
  }

  private handleEmergencyNearby(data: any) {
    window.dispatchEvent(new CustomEvent('emergency_nearby', { detail: data }));
    toast.info(`Emergency nearby: ${data.message}`);
  }

  private handleStatusUpdated(data: any) {
    window.dispatchEvent(new CustomEvent('driver_status_updated', { detail: data }));
    
    const statusMessages = {
      'Online': 'You are now online and ready to receive rides',
      'Offline': 'You are now offline',
      'In-Ride': 'You are currently in a ride'
    };
    
    const message = statusMessages[data.status] || `Status updated to: ${data.status}`;
    toast.info(message);
  }

  private handleSOSSent(data: any) {
    window.dispatchEvent(new CustomEvent('sos_sent', { detail: data }));
    toast.success('SOS alert sent successfully');
  }

  private handleRatingRequest(data: any) {
    window.dispatchEvent(new CustomEvent('request_rating', { detail: data }));
    toast.info('Please rate your ride experience');
  }

  private handleNotification(data: any) {
    window.dispatchEvent(new CustomEvent('notification', { detail: data }));
    
    // Show toast notification for all notification types
    toast.info(data.title);
  }

  // Public methods for emitting events
  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Driver-specific methods
  goOnline(locationID?: number, vehicleID?: number) {
    this.emit('driver_online', { locationID, vehicleID });
  }

  goOffline() {
    this.emit('driver_offline');
  }

  updateLocation(latitude: number, longitude: number, locationID?: number) {
    this.emit('update_location', { latitude, longitude, locationID });
  }

  acceptRide(rideId: number, vehicleID: number) {
    this.emit('accept_ride', { rideId, vehicleID });
  }

  startRide(rideId: number) {
    this.emit('start_ride', { rideId });
  }

  completeRide(rideId: number) {
    this.emit('complete_ride', { rideId });
  }

  sendSOS(rideId?: number, location?: { latitude: number; longitude: number }) {
    this.emit('sos_alert', { rideId, location });
  }

  // Connection management
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  // Get socket instance for advanced usage
  getSocket(): MockSocket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

// Export types for TypeScript
export interface RideRequestData {
  rideId: number;
  customerName: string;
  pickupCity: string;
  pickupStreet: string;
  dropoffCity: string;
  fare: number;
  vehicleType: string;
  timestamp: string;
}

export interface RideStatusUpdateData {
  rideId: number;
  status: string;
  customerName?: string;
  driverName?: string;
  estimatedArrival?: string;
  timestamp: string;
}

export interface LocationUpdateData {
  rideId: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface EmergencyAlertData {
  driverId: number;
  rideId?: number;
  location: { latitude: number; longitude: number };
  timestamp: string;
  message: string;
}
