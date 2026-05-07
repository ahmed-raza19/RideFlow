import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, DollarSign, User, MapPin, Settings } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatCard } from '../../components/ui/StatCard';
import { Toggle } from '../../components/ui/Toggle';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import { driverAPI } from '../../lib/driver';
import { fadeSlideUp } from '../../motion/presets';
import { ProfileEditModal } from '../../components/driver/ProfileEditModal';
import { VehicleForm, VehicleCard } from '../../components/driver/VehicleForm';
import { SafetyPanel } from '../../components/driver/SafetyPanel';
import { NotificationCenter } from '../../components/driver/NotificationCenter';
import { ConnectionStatus } from '../../components/driver/ConnectionStatus';
import { useWebSocket, useGeolocation } from '../../hooks/useWebSocket';

export function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('live');
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});

  // WebSocket integration
  const {
    isConnected,
    connectionStatus,
    lastEvent,
    goOnline: wsGoOnline,
    goOffline: wsGoOffline,
    acceptRide: wsAcceptRide,
    startRide: wsStartRide,
    completeRide: wsCompleteRide,
    reconnect
  } = useWebSocket({
    onNewRideRequest: (data) => {
      // Handle new ride requests
      console.log('New ride request via WebSocket:', data);
    },
    onRideStatusUpdate: (data) => {
      // Handle ride status updates
      console.log('Ride status update via WebSocket:', data);
    },
    onStatusUpdated: (data) => {
      // Handle driver status updates
      console.log('Driver status update via WebSocket:', data);
    }
  });

  // Geolocation tracking
  const {
    location: currentLocation,
    error: locationError,
    getCurrentPosition
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 5000
  });

  const navItems = [
    { id: 'live', label: 'Live', icon: <Radio size={20} /> },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  const fetchProfile = async () => {
    try {
      const response = await driverAPI.getProfile();
      setProfile(response.data.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <DashboardLayout>
      <Sidebar items={navItems} activeId={activeTab} onSelect={setActiveTab} title="Driver" />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pb-24 lg:pb-8 w-full max-w-[1200px] mx-auto">
        {/* Header with Notifications and Connection Status */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display text-white mb-2">Driver Dashboard</h1>
            <p className="text-text-muted">Manage your rides and earnings</p>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus 
              isConnected={isConnected} 
              connectionStatus={connectionStatus}
              onReconnect={reconnect}
            />
            <NotificationCenter />
            <Button variant="glass" onClick={() => setProfileEditOpen(true)}>
              <Settings size={20} className="mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Connection Status Panel (when disconnected) */}
        {connectionStatus !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlassCard tier={1} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                  <div>
                    <h3 className="text-white font-medium">Real-time Features Limited</h3>
                    <p className="text-sm text-text-muted">
                      {connectionStatus === 'connecting' 
                        ? 'Establishing connection...'
                        : 'Real-time updates are unavailable. Some features may be delayed.'}
                    </p>
                  </div>
                </div>
                {connectionStatus === 'disconnected' && (
                  <Button variant="neon" size="sm" onClick={reconnect}>
                    Reconnect
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={fadeSlideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full"
          >
            {activeTab === 'live' && (
              <LiveTab 
                profile={profile} 
                onProfileUpdate={fetchProfile}
                isConnected={isConnected}
                wsGoOnline={wsGoOnline}
                wsGoOffline={wsGoOffline}
                wsAcceptRide={wsAcceptRide}
                wsStartRide={wsStartRide}
                wsCompleteRide={wsCompleteRide}
                currentLocation={currentLocation}
                getCurrentPosition={getCurrentPosition}
              />
            )}
            {activeTab === 'earnings' && <EarningsTab />}
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

function LiveTab({ 
  profile, 
  onProfileUpdate, 
  isConnected,
  wsGoOnline,
  wsGoOffline,
  wsAcceptRide,
  wsStartRide,
  wsCompleteRide,
  currentLocation,
  getCurrentPosition
}: { 
  profile: any; 
  onProfileUpdate: () => void;
  isConnected: boolean;
  wsGoOnline: (locationID?: number, vehicleID?: number) => void;
  wsGoOffline: () => void;
  wsAcceptRide: (rideId: number, vehicleID: number) => void;
  wsStartRide: (rideId: number) => void;
  wsCompleteRide: (rideId: number) => void;
  currentLocation: { latitude: number; longitude: number } | null;
  getCurrentPosition: () => Promise<{ latitude: number; longitude: number }>;
}) {
  const [isOnline, setIsOnline] = useState(false);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Fetch status and active rides on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [profRes, vehRes, myRidesRes] = await Promise.all([
          driverAPI.getProfile(),
          driverAPI.getVehicles(),
          driverAPI.getMyRides()
        ]);
        const prof = profRes.data.data;
        setIsOnline(prof.AvailabilityStatus === 'Online' || prof.AvailabilityStatus === 'In-Ride');
        setVehicles(vehRes.data.data);
        
        const myRides = myRidesRes.data.data;
        const active = myRides.find((r: any) => ['Accepted', 'InProgress'].includes(r.RideStatus));
        if (active) setActiveRide(active);
      } catch (err) {
        console.error('Failed to load live data', err);
      }
    };
    init();
  }, [onProfileUpdate]);

  // Polling for incoming rides if online and no active ride
  useEffect(() => {
    let interval: any;
    if (isOnline && !activeRide && !incomingRide) {
      interval = setInterval(async () => {
        try {
          const res = await driverAPI.getIncomingRides();
          if (res.data.data && res.data.data.length > 0) {
            setIncomingRide(res.data.data[0]); // Just take the first available
          }
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isOnline, activeRide, incomingRide]);

  const toggleOnline = async (checked: boolean) => {
    try {
      if (checked) {
        // Get current location before going online
        const location = currentLocation || await getCurrentPosition();
        
        // Use WebSocket to go online
        wsGoOnline();
        
        // Also update via API for consistency
        await driverAPI.setAvailability('Online');
        setIsOnline(checked);
        toast.info("You're online. Waiting for rides...");
      } else {
        // Use WebSocket to go offline
        wsGoOffline();
        
        // Also update via API for consistency
        await driverAPI.setAvailability('Offline');
        setIsOnline(checked);
        setIncomingRide(null);
        toast.info("You're now offline");
      }
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  const handleAccept = async () => {
    try {
      const v = vehicles.find(v => v.VerificationStatus === 'Verified');
      if (!v) return toast.error('You need a verified vehicle to accept rides');
      
      // Use WebSocket for real-time acceptance
      wsAcceptRide(incomingRide.RideID, v.VehicleID);
      
      // Also update via API for consistency
      await driverAPI.acceptRide(incomingRide.RideID, v.VehicleID);
      
      const res = await driverAPI.getMyRides();
      setActiveRide(res.data.data.find((r: any) => r.RideID === incomingRide.RideID));
      setIncomingRide(null);
      toast.success('Ride accepted!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept ride');
      setIncomingRide(null); // maybe someone else took it
    }
  };

  const handleStart = async () => {
    try {
      // Use WebSocket for real-time start
      wsStartRide(activeRide.RideID);
      
      // Also update via API for consistency
      await driverAPI.startRide(activeRide.RideID);
      
      setActiveRide({ ...activeRide, RideStatus: 'InProgress' });
      toast.success('Ride started');
    } catch (err) { 
      toast.error('Failed to start'); 
    }
  }

  const handleComplete = async () => {
    try {
      // Use WebSocket for real-time completion
      wsCompleteRide(activeRide.RideID);
      
      // Also update via API for consistency
      await driverAPI.completeRide(activeRide.RideID);
      
      setActiveRide(null);
      toast.success('Ride completed! Earnings added to wallet.');
    } catch (err) {
      toast.error('Failed to complete ride');
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <GlassCard tier={2} className="p-8 flex flex-col items-center justify-center text-center py-16">
        <div className="relative mb-8 scale-150">
          <Toggle checked={isOnline} onChange={toggleOnline} />
          {isOnline && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-success rounded-full border-2 border-bg-surface animate-pulse-glow" />
          )}
        </div>
        <h2 className="text-3xl font-display mb-2">{isOnline ? "You're Online" : "You're Offline"}</h2>
        <p className="text-text-muted">{isOnline ? 'Searching for nearby riders...' : 'Go online to start receiving ride requests'}</p>
      </GlassCard>

      <AnimatePresence>
        {incomingRide && !activeRide && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.5 } }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <GlassCard tier="amber" className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Badge variant="warning" className="mb-2">New Request</Badge>
                  <h3 className="text-2xl font-display text-white">{incomingRide.RiderName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-muted">Est. Earnings</div>
                  <div className="text-2xl font-medium text-amber-500">PKR {Math.round(incomingRide.Fare * 0.8)}</div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex items-center gap-3"><MapPin size={16} className="text-amber-500" /> <span className="text-white">{incomingRide.PickupCity} - {incomingRide.PickupStreet}</span></div>
                <div className="flex items-center gap-3"><MapPin size={16} className="text-success" /> <span className="text-white">{incomingRide.DropoffCity}</span></div>
              </div>

              <div className="flex gap-4">
                <Button variant="glass" className="flex-1 text-error hover:border-error" onClick={() => setIncomingRide(null)}>Decline</Button>
                <Button variant="neon" className="flex-1" onClick={handleAccept}>Accept Ride</Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeRide && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard tier={3} className="p-6 border-amber-500/50">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <Badge variant="success" className="mb-2">Active Ride: {activeRide.RideStatus}</Badge>
                  <h3 className="text-xl font-display">{activeRide.RiderName}</h3>
                </div>
              </div>
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex items-center gap-3"><MapPin size={16} className="text-amber-500" /> <span className="text-white">{activeRide.PickupCity}</span></div>
                <div className="flex items-center gap-3"><MapPin size={16} className="text-success" /> <span className="text-white">{activeRide.DropoffCity}</span></div>
              </div>
              {activeRide.RideStatus === 'Accepted' ? (
                <Button className="w-full" onClick={handleStart}>Start Ride</Button>
              ) : (
                <Button variant="neon" className="w-full" onClick={handleComplete}>Complete Ride</Button>
              )}
            </GlassCard>

            {/* Safety Panel for Active Rides */}
            <SafetyPanel activeRide={activeRide} className="mt-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EarningsTab() {
  const [wallet, setWallet] = useState<any>({});
  const [earnings, setEarnings] = useState<any>({});
  const [ridesCount, setRidesCount] = useState(0);

  const fetchData = async () => {
    try {
      const [wRes, eRes, rRes] = await Promise.all([
        driverAPI.getWallet(),
        driverAPI.getEarnings(),
        driverAPI.getMyRides()
      ]);
      setWallet(wRes.data.data || {});
      setEarnings(eRes.data.data || {});
      const completed = rRes.data.data.filter((r: any) => r.RideStatus === 'Completed').length;
      setRidesCount(completed);
    } catch (e) {}
  };

  useEffect(() => { fetchData(); }, []);

  const requestPayout = async () => {
    try {
      await driverAPI.requestPayout();
      toast.success('Payout requested successfully!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request payout');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wallet Balance" value={wallet.WalletBalance || 0} prefix="PKR " />
        <StatCard label="Completed Rides" value={ridesCount} />
        <StatCard label="Gross Earnings" value={earnings.TotalFare || 0} prefix="PKR " />
        <StatCard label="Net Earnings" value={earnings.NetEarnings || 0} prefix="PKR " />
      </div>

      <GlassCard tier={1} className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display">Earnings Management</h3>
          <Button size="sm" onClick={requestPayout}>Request Payout</Button>
        </div>
      </GlassCard>
    </div>
  );
}

function ProfileTab({ 
  profile, 
  onEditProfile, 
  onAddVehicle, 
  onEditVehicle, 
  onUpdate 
}: {
  profile: any;
  onEditProfile: () => void;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: any) => void;
  onUpdate: () => void;
}) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [localProfile, setLocalProfile] = useState<any>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    driverAPI.getVehicles().then(r => setVehicles(r.data.data)).catch(console.error);
  }, [onUpdate]);

  if (!localProfile.DriverID) return null;

  return (
    <GlassCard tier={1} className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-6 mb-8 pb-8 border-b border-glass-border">
        <div className="w-20 h-20 rounded-full bg-amber-600 flex items-center justify-center text-2xl font-display text-bg-base overflow-hidden">
          {localProfile.ProfilePhoto ? (
            <img src={localProfile.ProfilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            localProfile.FullName?.charAt(0)
          )}
        </div>
        <div>
          <h2 className="text-2xl font-display text-white mb-1">{localProfile.FullName}</h2>
          <div className="flex gap-2 mt-2">
            <Badge variant={localProfile.VerificationStatus === 'Verified' ? 'success' : 'warning'}>{localProfile.VerificationStatus}</Badge>
            <Badge variant="info">{localProfile.CurrentCity || 'Unknown Location'}</Badge>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-white">Registered Vehicles</h3>
        <Button variant="glass" size="sm" onClick={onAddVehicle}>
          Add Vehicle
        </Button>
      </div>
      
      <div className="flex flex-col gap-3">
        {vehicles.length === 0 ? (
          <p className="text-text-muted text-sm">No vehicles registered.</p>
        ) : (
          <AnimatePresence>
            {vehicles.map(v => (
              <VehicleCard
                key={v.VehicleID}
                vehicle={v}
                onEdit={() => onEditVehicle(v)}
                onDelete={() => {}}
                onUpdate={onUpdate}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  );
}
