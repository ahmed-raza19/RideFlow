// Mock Socket.IO implementation for development
// Replace with actual Socket.IO when dependency is installed

// Simple toast implementation for socket service
const toast = {
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.error('ERROR:', message),
  info: (message: string) => console.info('INFO:', message)
};

interface MockSocket {
  on(event: string, callback: (data: any) => void): void;
  emit(event: string, data: any): void;
  disconnect(): void;
  connected: boolean;
}

class MockSocketIO {
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  
  constructor() {}
  
  connect(): MockSocket {
    return {
      on: (event, callback) => {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
      },
      emit: (event, _data) => {
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
      connected: true // Always connected for development
    };
  }
  
  private simulateEvent(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export class SocketService {
  private static instance: SocketService;
  private socket: MockSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {
    this.connect();
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(token?: string) {
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      console.warn('No authentication token available for WebSocket connection');
      return;
    }
    
    this.socket = new MockSocketIO().connect();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      toast.success('Connected to real-time updates');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      toast.error('Connection lost. Attempting to reconnect...');
      this.handleReconnect();
    });

    // Driver events
    this.socket.on('ride_request', (data) => {
      window.dispatchEvent(new CustomEvent('ride_request', { detail: data }));
      toast.info('New ride request received!');
    });

    this.socket.on('ride_status_update', (data) => {
      window.dispatchEvent(new CustomEvent('ride_status_update', { detail: data }));
    });

    this.socket.on('driver_status_updated', (data) => {
      window.dispatchEvent(new CustomEvent('driver_status_updated', { detail: data }));
      this.handleStatusUpdated(data);
    });

    this.socket.on('sos_sent', (data) => {
      window.dispatchEvent(new CustomEvent('sos_sent', { detail: data }));
      this.handleSOSSent(data);
    });

    this.socket.on('request_rating', (data) => {
      window.dispatchEvent(new CustomEvent('request_rating', { detail: data }));
      this.handleRatingRequest(data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      toast.error('Failed to reconnect. Please refresh the page.');
    }
  }

  // Driver actions
  goOnline(locationID?: number, vehicleID?: number) {
    this.emit('driver_online', { status: 'Online', locationID, vehicleID });
  }

  goOffline() {
    this.emit('driver_offline', { status: 'Offline' });
  }

  acceptRide(rideId: number, vehicleId: number) {
    this.emit('accept_ride', { rideId, vehicleId });
  }

  rejectRide(rideId: number, reason?: string) {
    this.emit('reject_ride', { rideId, reason });
  }

  updateLocation(latitude: number, longitude: number, locationID?: number) {
    this.emit('update_location', { latitude, longitude, locationID });
  }

  startRide(rideId: number) {
    this.emit('start_ride', { rideId });
  }

  completeRide(rideId: number) {
    this.emit('complete_ride', { rideId });
  }

  sendSOS(rideId?: number, location?: { lat: number; lng: number }) {
    this.emit('sos', { rideId, location });
  }

  submitRating(rideId: number, rating: number, feedback?: string) {
    this.emit('submit_rating', { rideId, rating, feedback });
  }

  // Utility methods
  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

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

  // Event handlers
  private handleStatusUpdated(data: { status?: string }) {
    window.dispatchEvent(new CustomEvent('driver_status_updated', { detail: data }));
    
    const statusMessages: { [key: string]: string } = {
      'Online': 'You are now online and ready to receive rides',
      'Offline': 'You are now offline',
      'In-Ride': 'You are currently in a ride'
    };
    
    const message = statusMessages[data.status || ''] || `Status updated to: ${data.status}`;
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
}

// Export singleton instance
export const socketService = SocketService.getInstance();

// Export types
export type { MockSocket };
