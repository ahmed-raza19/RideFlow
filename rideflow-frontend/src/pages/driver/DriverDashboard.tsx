import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, User, MapPin, Settings, BarChart3, Activity, Star } from 'lucide-react';
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

interface DriverStats {
  totalRides: number;
  completedRides: number;
  totalEarnings: number;
  averageRating: number;
  onlineHours: number;
}

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
  
  // WebSocket integration
  const {
    isConnected,
    connectionStatus,
    goOnline,
    goOffline,
    acceptRide,
    rejectRide,
    startRide,
    completeRide,
    reconnect
  } = useWebSocket({
    onNewRideRequest: (data) => {
      console.log('New ride request via WebSocket:', data);
      toast.info(`New ride request: ${data.customerName} in ${data.pickupCity}`, 5000);
    },
    onRideStatusUpdate: (data) => {
      console.log('Ride status update via WebSocket:', data);
    },
    onStatusUpdated: (data) => {
      console.log('Driver status update via WebSocket:', data);
    }
  });

  // Driver stats from real data
  const [driverStats, setDriverStats] = useState<DriverStats>({
    totalRides: 0,
    completedRides: 0,
    totalEarnings: 0,
    averageRating: 0,
    onlineHours: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Real incoming ride requests
  const [incomingRides, setIncomingRides] = useState<RideRequest[]>([]);
  const [ridesLoading, setRidesLoading] = useState(true);

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
    fetchDriverStats();
    fetchIncomingRides();
  }, []);

  const fetchIncomingRides = async () => {
    try {
      setRidesLoading(true);
      const response = await driverAPI.getIncomingRides();
      const rides = response.data.data || [];
      const formattedRides = rides.map((ride: any) => ({
        id: ride.RideID,
        customerName: ride.RiderName,
        pickupCity: ride.PickupCity,
        dropoffCity: ride.DropoffCity,
        fare: ride.Fare,
        vehicleType: 'Economy', // Default, should come from ride data
        timestamp: new Date().toISOString()
      }));
      setIncomingRides(formattedRides);
    } catch (error) {
      console.error('Failed to fetch incoming rides:', error);
    } finally {
      setRidesLoading(false);
    }
  };

  const fetchDriverStats = async () => {
    try {
      setStatsLoading(true);
      const [ridesRes, earningsRes, ratingsRes] = await Promise.all([
        driverAPI.getMyRides(),
        driverAPI.getEarnings(),
        driverAPI.getMyRatings()
      ]);
      
      const rides = ridesRes.data.data || [];
      const earnings = earningsRes.data || {};
      const ratings = ratingsRes.data || [];
      
      const completedRides = rides.filter(r => r.RideStatus === 'Completed').length;
      const totalRides = rides.length;
      const totalEarnings = earnings.totalEarnings || 0;
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, r: any) => sum + r.Score, 0) / ratings.length 
        : 0;
      
      setDriverStats({
        totalRides,
        completedRides,
        totalEarnings,
        averageRating,
        onlineHours: 0
      });
    } catch (error) {
      console.error('Failed to fetch driver stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAcceptRide = (rideId: number) => {
    acceptRide(rideId, 5);
    setIncomingRides((prev: any[]) => prev.filter((ride: any) => ride.id !== rideId));
    setActiveRide({
      id: rideId,
      customerName: 'John Doe',
      pickupCity: 'Karachi',
      dropoffCity: 'Lahore',
      fare: 850,
      vehicleType: 'Economy',
      status: 'Accepted'
    });
    toast.success('Ride accepted successfully!');
  };

  const handleRejectRide = (rideId: number, reason: string) => {
    rejectRide(rideId, reason);
    setIncomingRides((prev: any[]) => prev.filter((ride: any) => ride.id !== rideId));
    toast.info('Ride rejected');
  };

  const handleStartRide = (rideId: number) => {
    startRide(rideId);
    setActiveRide((prev: any) => ({ ...prev, status: 'InProgress', startTime: new Date().toISOString() }));
    toast.success('Ride started!');
  };

  const handleCompleteRide = (rideId: number) => {
    completeRide(rideId);
    setActiveRide(null);
    toast.success('Ride completed successfully!');
  };

  return (
    <DashboardLayout>
      <Sidebar items={navItems} activeId={activeTab} onSelect={setActiveTab} title="Driver Dashboard" />
      
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pb-24 lg:pb-8 w-full max-w-[1200px] mx-auto">
        {/* Header with Enhanced Connection Status */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display text-white mb-2">Driver Dashboard</h1>
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

        {/* Enhanced Stats Cards - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-4 backdrop-blur-sm hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Activity size={24} className="text-amber-500" />
              <div>
                <h3 className="text-lg font-display text-white">Total Rides</h3>
                <p className="text-2xl font-display text-white">{statsLoading ? '...' : driverStats.totalRides}</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">+12 this month</div>
          </div>
          <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-4 backdrop-blur-sm hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Star size={24} className="text-green-500" />
              <div>
                <h3 className="text-lg font-display text-white">Completed Rides</h3>
                <p className="text-2xl font-display text-white">{statsLoading ? '...' : driverStats.completedRides}</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">+8 this month</div>
          </div>
          <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-4 backdrop-blur-sm hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={24} className="text-amber-500" />
              <div>
                <h3 className="text-lg font-display text-white">Total Earnings</h3>
                <p className="text-2xl font-display text-white">PKR {statsLoading ? '...' : driverStats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">+15% this month</div>
          </div>
          <div className="bg-gray-900/90 border border-gray-700 rounded-lg p-4 backdrop-blur-sm hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Star size={24} className="text-green-500" />
              <div>
                <h3 className="text-lg font-display text-white">Average Rating</h3>
                <p className="text-2xl font-display text-white">★ {statsLoading ? '...' : driverStats.averageRating.toFixed(1)}</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">+0.2 this month</div>
          </div>
        </div>

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
              <div className="space-y-6">
                {/* Enhanced Connection Status - Dark Theme */}
                <div className={`p-4 rounded-lg border backdrop-blur-sm ${isConnected ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <div>
                        <h3 className={`text-white font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                          {isConnected ? 'Connected' : 'Offline'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {isConnected 
                            ? 'Real-time connection established. All features active.'
                            : 'Connection lost. Attempting to reconnect...'}
                        </p>
                      </div>
                    </div>
                    {isConnected && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-gray-400 ml-2">Live updates enabled</span>
                      </div>
                    )}
                  </div>
                  {!isConnected && (
                    <Button variant="neon" size="sm" onClick={reconnect}>
                      Reconnect
                    </Button>
                  )}
                </div>

                {/* Incoming Ride Requests - Dark Theme */}
                {incomingRides.length > 0 && !activeRide && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-display text-white mb-4">Incoming Ride Requests</h2>
                    <div className="grid gap-4">
                      {incomingRides.map((ride) => (
                        <motion.div
                          key={ride.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gray-900/90 border border-gray-700 rounded-lg p-4 backdrop-blur-sm hover:border-gray-600 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <Badge variant="success" className="mb-2">New Request</Badge>
                              <h3 className="text-lg font-display text-white">{ride.customerName}</h3>
                              <p className="text-sm text-gray-400">
                                {ride.pickupCity} → {ride.dropoffCity}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400 mb-1">Est. Earnings</div>
                              <div className="text-2xl font-display text-amber-500">PKR {Math.round(ride.fare * 0.8)}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="glass" className="flex-1 text-red-400 hover:border-red-500" onClick={() => handleRejectRide(ride.id, 'Driver unavailable')}>
                              Decline
                            </Button>
                            <Button variant="neon" className="flex-1" onClick={() => handleAcceptRide(ride.id)}>
                              Accept
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Ride - Dark Theme */}
                {activeRide && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-900/90 border border-gray-700 rounded-lg p-4 backdrop-blur-sm hover:border-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <Badge variant="success" className="mb-2">
                          Active Ride: {activeRide.status}
                        </Badge>
                        <h3 className="text-xl font-display text-white">{activeRide.customerName}</h3>
                      </div>
                      <Button variant="glass" size="sm" onClick={() => goOffline()}>
                        End Ride
                      </Button>
                    </div>
                      
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-amber-500" />
                        <span className="text-white">{activeRide.pickupCity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-green-500" />
                        <span className="text-white">{activeRide.dropoffCity}</span>
                      </div>
                    </div>
                      
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-400">
                        <div>Fare: <span className="text-white font-medium">PKR {activeRide.fare}</span></div>
                        <div>Vehicle: <span className="text-white">{activeRide.vehicleType}</span></div>
                      </div>
                        
                      {activeRide.status === 'Accepted' && (
                        <Button variant="neon" className="w-full" onClick={() => handleStartRide(activeRide.id)}>
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

                {/* Empty State when no rides - Dark Theme */}
                {incomingRides.length === 0 && !activeRide && (
                  <div className="p-8 text-center bg-gray-900/90 border border-gray-700 rounded-lg backdrop-blur-sm">
                    <Activity size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-xl font-display text-white mb-2">No Active Rides</h3>
                    <p className="text-gray-400">
                      You're currently online and ready to receive ride requests.
                      Turn on availability to start accepting rides.
                    </p>
                    <Button variant="neon" onClick={() => goOnline()}>
                      Go Online
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && <EarningsTab stats={driverStats} />}
            {activeTab === 'analytics' && <AnalyticsTab />}
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

// Tab Components
function EarningsTab({ stats }: { stats: DriverStats }) {
  const [walletData, setWalletData] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setWalletLoading(true);
        const response = await driverAPI.getWallet();
        setWalletData(response.data);
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      } finally {
        setWalletLoading(false);
      }
    };
    
    fetchWalletData();
  }, []);

  const completionRate = stats.totalRides > 0 
    ? ((stats.completedRides / stats.totalRides) * 100).toFixed(1)
    : '0.0';
  
  const commissionRate = walletData?.CommissionRate || 10;
  const platformCommission = (stats.totalEarnings * commissionRate) / 100;
  const netEarnings = stats.totalEarnings - platformCommission;

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gray-900/90 border border-gray-700 rounded-lg backdrop-blur-sm">
        <h2 className="text-2xl font-display text-white mb-6">Earnings Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Gross Earnings:</span>
                <span className="text-2xl font-display text-white">PKR {stats.totalEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform Commission ({commissionRate}%):</span>
                <span className="text-xl font-display text-amber-500">PKR {platformCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Net Earnings:</span>
                <span className="text-2xl font-display text-green-500">PKR {netEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wallet Balance:</span>
                <span className="text-xl font-display text-amber-500">PKR {walletLoading ? '...' : (walletData?.WalletBalance || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-3">Performance Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Average Rating:</span>
                <span className="text-xl font-display text-white">★ {stats.averageRating.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completion Rate:</span>
                <span className="text-xl font-display text-white">{completionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Rides:</span>
                <span className="text-xl font-display text-white">{stats.totalRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completed Rides:</span>
                <span className="text-xl font-display text-green-500">{stats.completedRides}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [earningsRes, performanceRes] = await Promise.all([
          driverAPI.analytics.getEarningsOverview(),
          driverAPI.analytics.getPerformanceMetrics()
        ]);
        
        setAnalyticsData({
          earnings: earningsRes.data || {},
          performance: performanceRes.data || {}
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gray-900/90 border border-gray-700 rounded-lg backdrop-blur-sm">
        <h2 className="text-2xl font-display text-white mb-6">Analytics Dashboard</h2>
        
        {loading ? (
          <div className="text-center text-gray-400">Loading analytics...</div>
        ) : analyticsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-3">Earnings Analytics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Today's Earnings:</span>
                  <span className="text-xl font-display text-white">PKR {analyticsData.earnings.today || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">This Week:</span>
                  <span className="text-xl font-display text-white">PKR {analyticsData.earnings.week || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">This Month:</span>
                  <span className="text-xl font-display text-white">PKR {analyticsData.earnings.month || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-3">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Acceptance Rate:</span>
                  <span className="text-xl font-display text-white">{analyticsData.performance.acceptanceRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completion Rate:</span>
                  <span className="text-xl font-display text-white">{analyticsData.performance.completionRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Trip Distance:</span>
                  <span className="text-xl font-display text-white">{analyticsData.performance.avgDistance || 0} km</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">No analytics data available</div>
        )}
      </div>
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
      <div className="p-6 bg-gray-900/90 border border-gray-700 rounded-lg backdrop-blur-sm">
        <h2 className="text-2xl font-display text-white mb-6">Profile Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={profile.FullName || ''}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={profile.Email || ''}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">License Number</label>
              <input
                type="text"
                value={profile.LicenseNumber || ''}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">CNIC</label>
              <input
                type="text"
                value={profile.CNIC || ''}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                readOnly
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Verification Status</label>
              <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                profile.VerificationStatus === 'Verified' 
                  ? 'bg-green-900/50 text-green-400 border border-green-700' 
                  : profile.VerificationStatus === 'Pending'
                  ? 'bg-amber-900/50 text-amber-400 border border-amber-700'
                  : 'bg-red-900/50 text-red-400 border border-red-700'
              }`}>
                {profile.VerificationStatus || 'Unknown'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Availability Status</label>
              <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                profile.AvailabilityStatus === 'Online' 
                  ? 'bg-green-900/50 text-green-400 border border-green-700' 
                  : profile.AvailabilityStatus === 'In-Ride'
                  ? 'bg-blue-900/50 text-blue-400 border border-blue-700'
                  : 'bg-gray-800 text-gray-400 border border-gray-600'
              }`}>
                {profile.AvailabilityStatus || 'Offline'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Account Status</label>
              <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                profile.AccountStatus === 'Active' 
                  ? 'bg-green-900/50 text-green-400 border border-green-700' 
                  : 'bg-red-900/50 text-red-400 border border-red-700'
              }`}>
                {profile.AccountStatus || 'Unknown'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-3">Vehicle Management</h3>
            <div className="flex gap-4 mb-4">
              <Button variant="glass" onClick={onAddVehicle}>
                Add Vehicle
              </Button>
              <Button variant="glass" onClick={onEditProfile}>
                Edit Profile
              </Button>
            </div>
            
            {vehiclesLoading ? (
              <div className="text-gray-400">Loading vehicles...</div>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((vehicle: any) => (
                  <div key={vehicle.VehicleID} className="p-4 bg-gray-800 border border-gray-600 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-white">{vehicle.Make} {vehicle.Model}</h4>
                        <p className="text-sm text-gray-400">{vehicle.Year} • {vehicle.Color}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        vehicle.VerificationStatus === 'Verified'
                          ? 'bg-green-900/50 text-green-400'
                          : vehicle.VerificationStatus === 'Pending'
                          ? 'bg-amber-900/50 text-amber-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {vehicle.VerificationStatus}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>Type: {vehicle.VehicleType}</p>
                      <p>Plate: {vehicle.LicensePlate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
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
