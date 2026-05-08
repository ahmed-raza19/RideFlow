import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Car, 
  DollarSign, 
  Star, 
  Activity, 
  User
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from '../../components/ui/Toast';
import { driverAPI } from '../../lib/driver';
import { fadeSlideUp } from '../../motion/presets';
import { useWebSocket } from '../../hooks/useWebSocket';
import { DriverRatingModal } from '../../components/driver/DriverRatingModal';
import { NotificationCenter } from '../../components/driver/NotificationCenter';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<any>({});
  const [earnings, setEarnings] = useState<any>({});
  const [incomingRides, setIncomingRides] = useState<any[]>([]);
  const [myRides, setMyRides] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>({});
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // WebSocket integration for real-time updates
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  useWebSocket({
    onRideAccepted: (data) => {
      // Remove ride from incoming rides when accepted
      setIncomingRides(prev => prev.filter(ride => ride.RideID !== data.rideId));
      setMyRides(prev => [...prev, data]);
      toast.success('Ride accepted by another driver!');
    },
    onRideRejected: (data) => {
      // Remove ride from incoming rides when rejected
      setIncomingRides(prev => prev.filter(ride => ride.RideID !== data.rideId));
      toast.info('Ride was rejected by another driver');
    },
    onRideStatusUpdate: (data) => {
      // Update ride status in real-time
      setMyRides(prev => 
        prev.map(ride => 
          ride.RideID === data.rideId 
            ? { ...ride, RideStatus: data.status }
            : ride
        )
      );
    },
    onRideCompleted: (data) => {
      // Show rating modal when driver completes ride
      const completedRide = myRides.find(ride => ride.RideID === data.rideId);
      if (completedRide && !ratingModalOpen) {
        setRatingModalOpen(true);
      }
    }
  });

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'rides', label: 'Rides', icon: <Car size={20} /> },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, earningsRes, incomingRes, ridesRes, walletRes, ratingsRes] = await Promise.all([
        driverAPI.getProfile(),
        driverAPI.analytics.getEarningsOverview(),
        driverAPI.getIncomingRides(),
        driverAPI.getMyRides(),
        driverAPI.getWallet(),
        driverAPI.getMyRatings()
      ]);

      setProfile(profileRes.data.data);
      setEarnings(earningsRes.data.data);
      setIncomingRides(incomingRes.data.data || []);
      setMyRides(ridesRes.data.data || []);
      setWallet(walletRes.data.data);
      setRatings(ratingsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId: number) => {
    try {
      // Get driver's available vehicles
      const vehiclesResponse = await driverAPI.getVehicles();
      const vehicles = vehiclesResponse.data.data;
      
      if (vehicles && vehicles.length > 0) {
        const vehicleID = vehicles[0].VehicleID;
        await driverAPI.acceptRide(rideId, vehicleID);
        toast.success('Ride accepted successfully!');
        
        // Immediately remove from incoming rides and refresh data
        setIncomingRides(prev => prev.filter(ride => ride.RideID !== rideId));
        fetchDashboardData();
      } else {
        toast.error('No verified vehicles available');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept ride');
    }
  };

  const handleRejectRide = async (rideId: number) => {
    try {
      await driverAPI.rejectRide(rideId, 'Driver unavailable');
      toast.info('Ride rejected');
      
      // Immediately remove from incoming rides and refresh data
      setIncomingRides(prev => prev.filter(ride => ride.RideID !== rideId));
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject ride');
    }
  };

  const handleStartRide = async (rideId: number) => {
    try {
      await driverAPI.startRide(rideId);
      toast.success('Ride started!');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start ride');
    }
  };

  const handleCompleteRide = useCallback(async (rideId: number) => {
    try {
      await driverAPI.completeRide(rideId);
      toast.success('Ride completed successfully!');
      
      // Show rating modal after completion
      setRatingModalOpen(true);
      
      fetchDashboardData();
    } catch (error: any) {
      console.error('Failed to complete ride:', error);
      toast.error('Failed to complete ride');
    }
  }, []);

  return (
    <DashboardLayout>
      <Sidebar items={navItems} activeId={activeTab} onSelect={setActiveTab} title="Driver Dashboard" />
      
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pb-24 lg:pb-8 w-full max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display text-white mb-2">Driver Dashboard</h1>
            <p className="text-text-muted">Manage your rides and earnings</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={profile.AvailabilityStatus === 'Online' ? 'success' : 'secondary'}>
              {profile.AvailabilityStatus || 'Offline'}
            </Badge>
            <NotificationCenter />
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
            {activeTab === 'overview' && <OverviewTab earnings={earnings} wallet={wallet} ratings={ratings} loading={loading} />}
            {activeTab === 'rides' && <RidesTab incomingRides={incomingRides} myRides={myRides} onAcceptRide={handleAcceptRide} onRejectRide={handleRejectRide} onStartRide={handleStartRide} onCompleteRide={handleCompleteRide} loading={loading} />}
            {activeTab === 'earnings' && <EarningsTab earnings={earnings} wallet={wallet} loading={loading} />}
            {activeTab === 'profile' && <ProfileTab profile={profile} loading={loading} />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Driver Rating Modal */}
      <DriverRatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        rideId={myRides.find(ride => ride.RideStatus === 'Completed')?.RideID || 0}
        riderName={myRides.find(ride => ride.RideStatus === 'Completed')?.RiderName || 'Rider'}
        onSubmit={(rating) => {
          driverAPI.rateRide(
            myRides.find(ride => ride.RideStatus === 'Completed')?.RideID || 0,
            rating
          );
          setRatingModalOpen(false);
          toast.success('Thank you for rating your rider!');
        }}
      />
    </DashboardLayout>
  );
}

// Overview Tab Component
function OverviewTab({ earnings, wallet, ratings, loading }: any) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Rides"
          value={Number(earnings.TotalRides) || 0}
          icon={<Car size={20} />}
          delta="+12 this month"
        />
        <StatCard
          label="Completed Rides"
          value={Number(earnings.CompletedRides) || 0}
          icon={<Activity size={20} />}
          delta="+12 this month"
        />
        <StatCard
          label="Net Earnings"
          value={Number(earnings.NetEarnings) || 0}
          prefix="PKR"
          icon={<DollarSign size={20} />}
          delta="+15% this month"
        />
        <StatCard
          label="Average Rating"
          value={Number(earnings.AverageRating) || 0}
          icon={<Star size={20} />}
          delta="+0.2 this month"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard tier={2} className="p-6">
          <h3 className="text-xl font-display text-white mb-4">Recent Rides</h3>
          <div className="space-y-3">
            {ratings.slice(0, 5).map((rating: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Ride #{rating.RideID}</p>
                  <p className="text-text-muted text-sm">{new Date(rating.Timestamp).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="text-white">{rating.Score}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard tier={2} className="p-6">
          <h3 className="text-xl font-display text-white mb-4">Wallet Balance</h3>
          <div className="text-center">
            <p className="text-4xl font-display text-amber-500 mb-2">PKR {Number(wallet.WalletBalance || 0).toFixed(2)}</p>
            <p className="text-text-muted">Available for withdrawal</p>
          </div>
          <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700">
            Request Payout
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}

// Rides Tab Component
function RidesTab({ incomingRides, myRides, onAcceptRide, onRejectRide, onStartRide, onCompleteRide, loading }: any) {
  if (loading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="space-y-6">
      {/* Incoming Rides */}
      {incomingRides.length > 0 && (
        <GlassCard tier={2} className="p-6">
          <h3 className="text-xl font-display text-white mb-4">Incoming Ride Requests</h3>
          <div className="space-y-4">
            {incomingRides.map((ride: any) => (
              <div key={ride.RideID} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium">{ride.RiderName}</p>
                    <p className="text-text-muted text-sm">
                      {ride.PickupCity} → {ride.DropoffCity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-500 font-semibold">PKR {ride.Fare}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="glass" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onRejectRide(ride.RideID)}
                  >
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    onClick={() => onAcceptRide(ride.RideID)}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* My Rides */}
      <GlassCard tier={2} className="p-6">
        <h3 className="text-xl font-display text-white mb-4">My Rides</h3>
        <div className="space-y-4">
          {myRides.map((ride: any) => (
            <div key={ride.RideID} className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-medium">{ride.RiderName}</p>
                  <p className="text-text-muted text-sm">
                    {ride.PickupCity} → {ride.DropoffCity}
                  </p>
                  <Badge variant={ride.RideStatus === 'Completed' ? 'success' : ride.RideStatus === 'InProgress' ? 'warning' : 'secondary'}>
                    {ride.RideStatus}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-amber-500 font-semibold">PKR {ride.Fare}</p>
                  <p className="text-text-muted text-sm">{ride.Distance} km</p>
                </div>
              </div>
              
              {ride.RideStatus === 'Accepted' && (
                <Button 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => onStartRide(ride.RideID)}
                >
                  Start Ride
                </Button>
              )}
              
              {ride.RideStatus === 'InProgress' && (
                <Button 
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => onCompleteRide(ride.RideID)}
                >
                  Complete Ride
                </Button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// Earnings Tab Component
function EarningsTab({ earnings, wallet, loading }: any) {
  if (loading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Gross Earnings"
          value={Number(earnings.GrossEarnings) || 0}
          prefix="PKR"
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Net Earnings"
          value={Number(earnings.NetEarnings) || 0}
          prefix="PKR"
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Wallet Balance"
          value={Number(wallet.WalletBalance) || 0}
          prefix="PKR"
          icon={<DollarSign size={20} />}
        />
      </div>

      <GlassCard tier={2} className="p-6">
        <h3 className="text-xl font-display text-white mb-4">Earnings Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-text-muted mb-2">Average Fare</p>
            <p className="text-2xl font-display text-white">PKR {Number(earnings.AverageFare || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-text-muted mb-2">Commission Rate</p>
            <p className="text-2xl font-display text-white">{earnings.CommissionRate || 10}%</p>
          </div>
          <div>
            <p className="text-text-muted mb-2">Total Distance</p>
            <p className="text-2xl font-display text-white">{Number(earnings.TotalDistance || 0).toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-text-muted mb-2">Average Distance</p>
            <p className="text-2xl font-display text-white">{Number(earnings.AverageDistance || 0).toFixed(1)} km</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}


// Profile Tab Component
function ProfileTab({ profile, loading }: any) {
  if (loading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="space-y-6">
      <GlassCard tier={2} className="p-6">
        <h3 className="text-xl font-display text-white mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-text-muted mb-2">Full Name</p>
            <p className="text-white">{profile.FullName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-text-muted mb-2">Email</p>
            <p className="text-white">{profile.Email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-text-muted mb-2">License Number</p>
            <p className="text-white">{profile.LicenseNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-text-muted mb-2">CNIC</p>
            <p className="text-white">{profile.CNIC || 'N/A'}</p>
          </div>
          <div>
            <p className="text-text-muted mb-2">Verification Status</p>
            <Badge variant={profile.VerificationStatus === 'Verified' ? 'success' : 'warning'}>
              {profile.VerificationStatus || 'Unknown'}
            </Badge>
          </div>
          <div>
            <p className="text-text-muted mb-2">Availability Status</p>
            <Badge variant={profile.AvailabilityStatus === 'Online' ? 'success' : 'secondary'}>
              {profile.AvailabilityStatus || 'Offline'}
            </Badge>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
