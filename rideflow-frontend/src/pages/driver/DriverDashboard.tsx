import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, User, MapPin, Settings, BarChart3, Activity } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Sidebar } from '../../components/layout/Sidebar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import { driverAPI } from '../../lib/driver';
import { fadeSlideUp } from '../../motion/presets';
import { ProfileEditModal } from '../../components/driver/ProfileEditModal';
import { VehicleForm } from '../../components/driver/VehicleForm';
import { ConnectionStatus } from '../../components/driver/ConnectionStatus';
import { useWebSocket } from '../../hooks/useWebSocket';
import { DynamicDashboard } from '../../components/driver/DynamicDashboard';
import { driverDashboardConfigs } from '../../config/driverDashboardConfigs';


interface RideRequest {
  id: number;
  customerName: string;
  pickupCity: string;
  dropoffCity: string;
  fare: number;
  vehicleType: string;
  timestamp: string;
}

export function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('live');
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  
  // WebSocket integration (for real-time updates)
  const {
    isConnected,
    connectionStatus,
    goOnline,
    goOffline,
    reconnect
  } = useWebSocket({
    onNewRideRequest: (data) => {
      console.log('New ride request via WebSocket:', data);
      toast.info(`New ride request: ${data.customerName} in ${data.pickupCity}`, 5000);
      // Refresh incoming rides when new request comes
      fetchIncomingRides();
    },
    onRideStatusUpdate: (data) => {
      console.log('Ride status update via WebSocket:', data);
      // Refresh data when ride status changes
      fetchIncomingRides();
      fetchActiveRide();
    },
    onStatusUpdated: (data) => {
      console.log('Driver status update via WebSocket:', data);
      // Refresh profile when status changes
      fetchProfile();
    }
  });

  
  // Real incoming ride requests
  const [incomingRides, setIncomingRides] = useState<RideRequest[]>([]);

  // Mock active ride
  const [activeRide, setActiveRide] = useState<any>(null);

  const navItems = [
    { id: 'live', label: 'Live', icon: <Activity size={20} /> },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  const fetchProfile = async () => {
    try {
      const response = await driverAPI.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchIncomingRides();
    fetchActiveRide();
    
    // Set up periodic data refresh
    const interval = setInterval(() => {
      fetchIncomingRides();
      fetchActiveRide();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchIncomingRides = async () => {
    try {
      const response = await driverAPI.getIncomingRides();
      const rides = response.data.data || [];
      const formattedRides = rides.map((ride: any) => ({
        id: ride.RideID,
        customerName: ride.RiderName || 'Customer',
        pickupCity: ride.PickupCity || 'Unknown',
        dropoffCity: ride.DropoffCity || 'Unknown',
        fare: ride.Fare || 0,
        vehicleType: ride.VehicleType || 'Economy',
        timestamp: ride.CreatedTime || new Date().toISOString(),
        rideStatus: ride.RideStatus || 'Requested'
      }));
      setIncomingRides(formattedRides);
    } catch (error) {
      console.error('Failed to fetch incoming rides:', error);
      setIncomingRides([]);
    }
  };

  const fetchActiveRide = async () => {
    try {
      const response = await driverAPI.getMyRides();
      const rides = response.data.data || [];
      const active = rides.find((r: any) => ['Accepted', 'InProgress'].includes(r.RideStatus));
      
      if (active) {
        setActiveRide({
          id: active.RideID,
          customerName: active.RiderName || 'Customer',
          pickupCity: active.PickupCity || 'Unknown',
          dropoffCity: active.DropoffCity || 'Unknown',
          fare: active.Fare || 0,
          vehicleType: active.VehicleType || 'Economy',
          status: active.RideStatus,
          startTime: active.StartTime,
          timestamp: active.CreatedTime || new Date().toISOString()
        });
      } else {
        setActiveRide(null);
      }
    } catch (error) {
      console.error('Failed to fetch active ride:', error);
      setActiveRide(null);
    }
  };

  
  const handleAcceptRide = async (rideId: number) => {
    try {
      // Call the actual API to accept the ride
      await driverAPI.acceptRide(rideId, 5); // Using vehicle ID 5 as default
      
      // Remove from incoming rides
      setIncomingRides((prev: any[]) => prev.filter((ride: any) => ride.id !== rideId));
      
      // Set as active ride with real data
      const acceptedRide = incomingRides.find((ride: any) => ride.id === rideId);
      if (acceptedRide) {
        setActiveRide({
          ...acceptedRide,
          status: 'Accepted',
          startTime: new Date().toISOString()
        });
      }
      
      toast.success('Ride accepted successfully!');
      
      // Refresh data
      fetchIncomingRides();
    } catch (error: any) {
      console.error('Failed to accept ride:', error);
      toast.error(error.response?.data?.message || 'Failed to accept ride');
    }
  };

  const handleRejectRide = async (rideId: number, reason: string) => {
    try {
      // Call the actual API to reject the ride
      await driverAPI.rejectRide(rideId, reason);
      
      // Remove from incoming rides
      setIncomingRides((prev: any[]) => prev.filter((ride: any) => ride.id !== rideId));
      
      toast.info('Ride rejected');
      
      // Refresh data
      fetchIncomingRides();
    } catch (error: any) {
      console.error('Failed to reject ride:', error);
      toast.error(error.response?.data?.message || 'Failed to reject ride');
    }
  };

  const handleStartRide = async (rideId: number) => {
    try {
      // Call the actual API to start the ride
      await driverAPI.startRide(rideId);
      
      // Update active ride status
      setActiveRide((prev: any) => ({ 
        ...prev, 
        status: 'InProgress', 
        startTime: new Date().toISOString() 
      }));
      
      toast.success('Ride started!');
    } catch (error: any) {
      console.error('Failed to start ride:', error);
      toast.error(error.response?.data?.message || 'Failed to start ride');
    }
  };

  const handleCompleteRide = async (rideId: number) => {
    try {
      // Call the actual API to complete the ride
      await driverAPI.completeRide(rideId);
      
      // Clear active ride
      setActiveRide(null);
      
      toast.success('Ride completed successfully!');
      
      // Refresh all data
      fetchIncomingRides();
      fetchActiveRide();
    } catch (error: any) {
      console.error('Failed to complete ride:', error);
      toast.error(error.response?.data?.message || 'Failed to complete ride');
    }
  };

  return (
    <DashboardLayout>
      <Sidebar items={navItems} activeId={activeTab} onSelect={setActiveTab} title="Driver Dashboard" />
      
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pb-24 lg:pb-8 w-full max-w-[1200px] mx-auto">
        {/* Header with Enhanced Connection Status */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display text-text-primary mb-2">Driver Dashboard</h1>
            <p className="text-text-muted">Manage your rides and earnings</p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus 
              connectionStatus={connectionStatus}
              onReconnect={reconnect}
            />
            <Button variant="glass" onClick={() => setProfileEditOpen(true)}>
              <Settings size={20} className="mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Dynamic Dashboard Components */}
        <DynamicDashboard 
          config={driverDashboardConfigs.overview} 
          pageType="overview" 
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={fadeSlideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full"
          >
            {activeTab === 'live' && <DynamicLiveTab incomingRides={incomingRides} activeRide={activeRide} isConnected={isConnected} reconnect={reconnect} goOnline={goOnline} handleAcceptRide={handleAcceptRide} handleRejectRide={handleRejectRide} handleStartRide={handleStartRide} handleCompleteRide={handleCompleteRide} goOffline={goOffline} />}

            {activeTab === 'earnings' && <DynamicEarningsTab />}
            {activeTab === 'analytics' && <DynamicAnalyticsTab />}
            {activeTab === 'profile' && (
              <ProfileTab 
                profile={profile}
                onEditProfile={() => setProfileEditOpen(true)}
                onAddVehicle={() => {
                  setEditingVehicle(null);
                  setVehicleFormOpen(true);
                }}
                onEditVehicle={(vehicle: any) => {
                  setEditingVehicle(vehicle);
                  setVehicleFormOpen(true);
                }}
                onUpdate={fetchProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <ProfileEditModal
        isOpen={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
        profile={profile}
        onUpdate={fetchProfile}
      />
      <VehicleForm
        isOpen={vehicleFormOpen}
        onClose={() => setVehicleFormOpen(false)}
        vehicle={editingVehicle}
        onUpdate={fetchProfile}
      />
    </DashboardLayout>
  );
}

// Dynamic Tab Components
function DynamicLiveTab({ incomingRides, activeRide, isConnected, reconnect, goOnline, handleAcceptRide, handleRejectRide, handleStartRide, handleCompleteRide, goOffline }: any) {
  return (
    <div className="space-y-6">
      {/* Enhanced Connection Status - Rider Theme */}
      <div className={`p-4 rounded-lg border backdrop-blur-xl ${isConnected ? 'bg-success/20 border-success/50' : 'bg-error/20 border-error/50'} shadow-glow`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`} />
            <div>
              <h3 className={`font-medium ${isConnected ? 'text-success' : 'text-error'}`}>
                {isConnected ? 'Connected' : 'Offline'}
              </h3>
              <p className="text-sm text-text-muted">
                {isConnected 
                  ? 'Real-time connection established. All features active.'
                  : 'Connection lost. Attempting to reconnect...'}
              </p>
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-text-muted ml-2">Live updates enabled</span>
            </div>
          )}
        </div>
        {!isConnected && (
          <Button variant="glass" size="sm" onClick={reconnect}>
            Reconnect
          </Button>
        )}
      </div>

      {/* Dynamic Dashboard for Live Data */}
      <DynamicDashboard 
        config={driverDashboardConfigs.live} 
        pageType="live" 
      />

      {/* Incoming Ride Requests - Rider Theme */}
      {incomingRides.length > 0 && !activeRide && (
        <div className="space-y-4">
          <h2 className="text-xl font-display bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold mb-4">Incoming Ride Requests</h2>
          <div className="grid gap-4">
            {incomingRides.map((ride: any) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg p-4 hover:border-soft-gold/30 transition-all duration-300 shadow-glow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge variant="success" className="mb-2">New Request</Badge>
                    <h3 className="text-lg font-display text-text-primary">{ride.customerName}</h3>
                    <p className="text-sm text-text-muted">
                      {ride.pickupCity} → {ride.dropoffCity}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-text-muted mb-1">Est. Earnings</div>
                    <div className="text-2xl font-display text-amber-600">PKR {Math.round(ride.fare * 0.8)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="glass" className="flex-1 text-error border-error/30 hover:border-error" onClick={() => handleRejectRide(ride.id, 'Driver unavailable')}>
                    Decline
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow-lg" onClick={() => handleAcceptRide(ride.id)}>
                    Accept
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Active Ride - Rider Theme */}
      {activeRide && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg p-4 hover:border-soft-gold/30 transition-all duration-300 shadow-glow"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <Badge variant="success" className="mb-2">
                Active Ride: {activeRide.status}
              </Badge>
              <h3 className="text-xl font-display text-text-primary">{activeRide.customerName}</h3>
            </div>
            <Button variant="glass" size="sm" onClick={() => goOffline()}>
              End Ride
            </Button>
          </div>
            
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-amber-600" />
              <span className="text-text-primary">{activeRide.pickupCity}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-success" />
              <span className="text-text-primary">{activeRide.dropoffCity}</span>
            </div>
          </div>
            
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-text-muted">
              <div>Fare: <span className="text-text-primary font-medium">PKR {activeRide.fare}</span></div>
              <div>Vehicle: <span className="text-text-primary">{activeRide.vehicleType}</span></div>
            </div>
              
            {activeRide.status === 'Accepted' && (
              <Button className="w-full bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow-lg" onClick={() => handleStartRide(activeRide.id)}>
                Start Ride
              </Button>
            )}
            
            {activeRide.status === 'InProgress' && (
              <Button variant="glass" className="w-full" onClick={() => handleCompleteRide(activeRide.id)}>
                Complete Ride
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State when no rides - Rider Theme */}
      {incomingRides.length === 0 && !activeRide && (
        <div className="p-8 text-center bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg shadow-glow">
          <Activity size={48} className="text-text-muted mb-4" />
          <h3 className="text-xl font-display text-text-primary mb-2">No Active Rides</h3>
          <p className="text-text-muted">
            You're currently online and ready to receive ride requests.
            Turn on availability to start accepting rides.
          </p>
          <Button className="bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow-lg" onClick={() => goOnline()}>
            Go Online
          </Button>
        </div>
      )}
    </div>
  );
}

function DynamicEarningsTab() {
  return (
    <div className="space-y-6">
      <DynamicDashboard 
        config={driverDashboardConfigs.earnings} 
        pageType="earnings" 
      />
    </div>
  );
}

function DynamicAnalyticsTab() {
  return (
    <div className="space-y-6">
      <DynamicDashboard 
        config={driverDashboardConfigs.analytics} 
        pageType="analytics" 
      />
    </div>
  );
}


function ProfileTab({ profile, onEditProfile, onAddVehicle, onUpdate }: any) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setVehiclesLoading(true);
        const response = await driverAPI.getVehicles();
        setVehicles(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setVehiclesLoading(false);
      }
    };
    
    fetchVehicles();
  }, [onUpdate]);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg shadow-glow">
        <h2 className="text-2xl font-display bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold mb-6">Profile Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Full Name</label>
              <input
                type="text"
                value={profile.FullName || ''}
                className="w-full px-3 py-2 bg-glass-bg-light border border-glass-border rounded-lg text-text-primary focus:border-soft-gold focus:outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Email</label>
              <input
                type="email"
                value={profile.Email || ''}
                className="w-full px-3 py-2 bg-glass-bg-light border border-glass-border rounded-lg text-text-primary focus:border-soft-gold focus:outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">License Number</label>
              <input
                type="text"
                value={profile.LicenseNumber || ''}
                className="w-full px-3 py-2 bg-glass-bg-light border border-glass-border rounded-lg text-text-primary focus:border-soft-gold focus:outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">CNIC</label>
              <input
                type="text"
                value={profile.CNIC || ''}
                className="w-full px-3 py-2 bg-glass-bg-light border border-glass-border rounded-lg text-text-primary focus:border-soft-gold focus:outline-none"
                readOnly
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Verification Status</label>
              <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                profile.VerificationStatus === 'Verified' 
                  ? 'bg-success/20 text-success border border-success/50' 
                  : profile.VerificationStatus === 'Pending'
                  ? 'bg-amber-600/20 text-amber-600 border border-amber-600/50'
                  : 'bg-error/20 text-error border border-error/50'
              }`}>
                {profile.VerificationStatus || 'Unknown'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Availability Status</label>
              <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                profile.AvailabilityStatus === 'Online' 
                  ? 'bg-success/20 text-success border border-success/50' 
                  : profile.AvailabilityStatus === 'In-Ride'
                  ? 'bg-blue-600/20 text-blue-600 border border-blue-600/50'
                  : 'bg-glass-bg-light text-text-muted border border-glass-border'
              }`}>
                {profile.AvailabilityStatus || 'Offline'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Account Status</label>
              <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                profile.AccountStatus === 'Active' 
                  ? 'bg-success/20 text-success border border-success/50' 
                  : 'bg-error/20 text-error border border-error/50'
              }`}>
                {profile.AccountStatus || 'Unknown'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-primary mb-3">Vehicle Management</h3>
            <div className="flex gap-4 mb-4">
              <Button variant="glass" onClick={onAddVehicle}>
                Add Vehicle
              </Button>
              <Button variant="glass" onClick={onEditProfile}>
                Edit Profile
              </Button>
            </div>
            
            {vehiclesLoading ? (
              <div className="text-text-muted">Loading vehicles...</div>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((vehicle: any) => (
                  <div key={vehicle.VehicleID} className="p-4 bg-glass-bg-light border border-glass-border rounded-lg hover:border-soft-gold/30 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-text-primary">{vehicle.Make} {vehicle.Model}</h4>
                        <p className="text-sm text-text-muted">{vehicle.Year} • {vehicle.Color}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        vehicle.VerificationStatus === 'Verified'
                          ? 'bg-success/20 text-success'
                          : vehicle.VerificationStatus === 'Pending'
                          ? 'bg-amber-600/20 text-amber-600'
                          : 'bg-error/20 text-error'
                      }`}>
                        {vehicle.VerificationStatus}
                      </div>
                    </div>
                    <div className="text-sm text-text-muted">
                      <p>Type: {vehicle.VehicleType}</p>
                      <p>Plate: {vehicle.LicensePlate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-text-muted py-8">
                <p>No vehicles registered</p>
                <Button variant="glass" onClick={onAddVehicle} className="mt-2">
                  Add Your First Vehicle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
