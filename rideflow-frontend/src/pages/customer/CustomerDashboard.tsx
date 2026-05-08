import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, User, Clock } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlassCard } from '../../components/ui/GlassCard';
import { FormInput } from '../../components/ui/FormInput';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from '../../components/ui/Toast';
import { riderAPI } from '../../lib/rider';
import { useWebSocket } from '../../lib/websocket';
import { SafetyPanel } from '../../components/safety/SafetyPanel';
import { fadeSlideUp } from '../../motion/presets';
import { NotificationCenter } from '../../components/customer/NotificationCenter';

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('book');

  const navItems = [
    { id: 'book', label: 'Book a Ride', icon: <Navigation size={20} /> },
    { id: 'trips', label: 'My Trips', icon: <Clock size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <DashboardLayout>
      <Sidebar items={navItems} activeId={activeTab} onSelect={setActiveTab} title="Customer" />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pb-24 lg:pb-8 w-full max-w-[1200px] mx-auto">
        {/* Header with Notifications */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-display text-white mb-2">Customer Dashboard</h1>
            <p className="text-text-muted">Book rides and manage your account</p>
          </div>
          <NotificationCenter />
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
            {activeTab === 'book' && <BookTab />}
            {activeTab === 'trips' && <TripsTab />}
            {activeTab === 'profile' && <ProfileTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </DashboardLayout>
  );
}

function BookTab() {
  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [pickup, setPickup] = useState<number | null>(null);
  const [dropoff, setDropoff] = useState<number | null>(null);
  const [activeRideId, setActiveRideId] = useState<number | null>(null);
  const [rideState, setRideState] = useState<any>(null);
  const [estimatedFare, setEstimatedFare] = useState<number>(0);

  // Mock data for testing
  const mockLocations = [
    { LocationID: 1, LocationName: 'Downtown Plaza', City: 'Karachi', Street: 'Main Boulevard' },
    { LocationID: 2, LocationName: 'Airport Terminal', City: 'Karachi', Street: 'Jinnah Avenue' },
    { LocationID: 3, LocationName: 'Beach Resort', City: 'Karachi', Street: 'Sea View Road' },
    { LocationID: 4, LocationName: 'Shopping Mall', City: 'Karachi', Street: 'Gulshan-e-Iqbal' }
  ];

  const mockVehicles = [
    {
      Type: 'Economy',
      Available: 5,
      EstimatedFare: 'PKR 200-300',
      EstimatedTime: '5-10 mins',
      Vehicles: [
        { DriverID: 1, DriverName: 'Ahmed Khan', Rating: 4.8 },
        { DriverID: 2, DriverName: 'Sara Ali', Rating: 4.9 }
      ]
    },
    {
      Type: 'Business',
      Available: 2,
      EstimatedFare: 'PKR 400-600',
      EstimatedTime: '3-7 mins',
      Vehicles: [
        { DriverID: 3, DriverName: 'Michael Chen', Rating: 4.9 },
        { DriverID: 4, DriverName: 'Emma Wilson', Rating: 5.0 }
      ]
    },
    {
      Type: 'Bike',
      Available: 8,
      EstimatedFare: 'PKR 100-150',
      EstimatedTime: '2-5 mins',
      Vehicles: [
        { DriverID: 5, DriverName: 'Raju Kumar', Rating: 4.7 },
        { DriverID: 6, DriverName: 'Fatima Begum', Rating: 4.8 }
      ]
    }
  ];
  
  // WebSocket integration for real-time updates
  const { subscribeToRide } = useWebSocket();

  // Ride status progression (without cancelled - only shown when actually cancelled)
  const rideStatuses = [
    { id: 'requested', label: 'Requested', icon: '📍', description: 'Finding your driver' },
    { id: 'accepted', label: 'Accepted', icon: '✅', description: 'Driver assigned' },
    { id: 'enroute', label: 'Driver En Route', icon: '🚗', description: 'On the way to pickup' },
    { id: 'inprogress', label: 'In Progress', icon: '🛣️', description: 'Ride in progress' },
    { id: 'completed', label: 'Completed', icon: '🎉', description: 'Trip completed' }
  ];

  // Separate cancelled status for when ride is actually cancelled
  const cancelledStatus = { id: 'cancelled', label: 'Cancelled', icon: '❌', description: 'Ride cancelled' };

  const getCurrentRideStatus = () => {
    if (!rideState) return null;
    const statusMap: { [key: string]: string } = {
      'Requested': 'requested',
      'Accepted': 'accepted', 
      'InProgress': 'inprogress',
      'Completed': 'completed',
      'Cancelled': 'cancelled'
    };
    return statusMap[rideState.RideStatus] || 'requested';
  };

  useEffect(() => {
    // Simplified data loading - just set mock data immediately
    console.log('Setting mock data immediately...');
    setLocations(mockLocations);
    setVehicles(mockVehicles);
    
    // Set default pickup and dropoff
    if (mockLocations.length >= 2) {
      setPickup(mockLocations[0].LocationID);
      setDropoff(mockLocations[1].LocationID);
    }
    
    console.log('Mock data set:', { locations: mockLocations.length, vehicles: mockVehicles.length });
    
    // Check if rider already has an active ride
    riderAPI.getRideHistory().then(res => {
      const active = res.data.data.find((r: any) => ['Requested', 'Accepted', 'InProgress'].includes(r.RideStatus));
      if (active) {
        setActiveRideId(active.RideID);
        setRideState(active);
        setStep(4);
        // Subscribe to real-time updates for this ride
        subscribeToRide(active.RideID);
      }
    });
  }, [subscribeToRide]);

  useEffect(() => {
    let interval: any;
    if (step === 4 && activeRideId) {
      interval = setInterval(async () => {
        try {
          const res = await riderAPI.getRideDetail(activeRideId);
          setRideState(res.data.data);
          if (res.data.data.RideStatus === 'Completed' || res.data.data.RideStatus === 'Cancelled') {
            clearInterval(interval);
            setStep(5); // Completion step
          }
        } catch(e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, activeRideId]);

  const handleBook = async () => {
    if (!pickup || !dropoff || !selectedVehicle) return toast.error('Please complete all selections');
    setLoading(true);
    try {
      const res = await riderAPI.requestRide({
        pickupLocationID: pickup,
        dropoffLocationID: dropoff,
        vehicleType: selectedVehicle.Type
      });
      setActiveRideId(res.data.data.rideID);
      // Subscribe to real-time updates for this ride
      subscribeToRide(res.data.data.rideID);
      toast.success('Ride requested! Finding your driver...');
      setStep(4);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRideId) return;
    try {
      await riderAPI.cancelRide(activeRideId);
      toast.success('Ride cancelled');
      setStep(1);
      setActiveRideId(null);
      setRideState(null);
    } catch(err) { toast.error('Cannot cancel ride at this time'); }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {step < 4 && (
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3 bg-gradient-to-r from-glass-bg-light via-glass-bg to-glass-bg-light backdrop-blur-xl border-2 border-soft-gold/30 rounded-full px-8 py-4 shadow-glow-lg">
            {rideStatuses.map((status, index) => {
              const currentStatus = getCurrentRideStatus();
              const isActive = currentStatus === status.id;
              const isCompleted = currentStatus && rideStatuses.findIndex(s => s.id === currentStatus) > index;
              
              return (
                <div key={status.id} className="flex items-center">
                  <motion.div
                    className="flex flex-col items-center cursor-pointer group relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Interactive: Allow clicking to view details or take actions
                      if (isActive && rideState) {
                        // Show ride details for current status
                        console.log('Show details for status:', status.label);
                      }
                    }}
                  >
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-br from-soft-gold via-amber-500 to-champagne text-white shadow-glow-lg ring-2 ring-amber-500/50 animate-pulse'
                        : isCompleted 
                          ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-glow'
                          : 'bg-glass-bg-light border-2 border-glass-border text-text-muted'
                    }`}>
                      {status.icon}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-md"
                        />
                      )}
                    </div>
                    <span className={`text-xs font-medium mt-2 px-2 py-1 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        : isCompleted
                          ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {status.label}
                    </span>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10"
                      >
                        {status.description}
                      </motion.div>
                    )}
                  </motion.div>
                  {index < rideStatuses.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 transition-all duration-500 ${
                      isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-glow' : 'bg-glass-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="max-w-4xl mx-auto space-y-8">
          {locations.length === 0 ? (
            <GlassCard tier={2} className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center animate-pulse">
                <MapPin className="text-amber-500" size={24} />
              </div>
              <h3 className="text-xl font-display mb-3 text-white">Loading Locations</h3>
              <p className="text-text-muted mb-4">Loading available locations...</p>
              <div className="w-8 h-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </GlassCard>
          ) : (
            <>
              <GlassCard tier={3} className="p-8 backdrop-blur-xl bg-glass-white border-glass-border hover:border-soft-gold/30 transition-all duration-300 shadow-glow-lg">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-display mb-4 bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold">Where to?</h3>
                  <p className="text-text-muted">Choose your pickup and dropoff locations for your journey</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pickup Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-champagne/20 border-2 border-amber-500/50 flex items-center justify-center shadow-glow">
                        <MapPin className="text-amber-500" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">Pickup Location</h4>
                        <p className="text-text-muted text-sm">Where should we pick you up?</p>
                      </div>
                    </div>
                    <div className="relative">
                      <select 
                        className="w-full bg-gradient-to-r from-glass-bg-light via-glass-bg to-glass-bg-light border-2 border-amber-500/30 rounded-2xl px-6 py-4 text-white outline-none hover:border-amber-500/50 focus:border-amber-500/70 transition-all duration-300 shadow-glow hover:shadow-glow-lg appearance-none cursor-pointer backdrop-blur-xl"
                        value={pickup || ''}
                        onChange={(e) => setPickup(Number(e.target.value))}
                      >
                        <option value="" disabled className="bg-gray-900 text-gray-400">
                          {pickup ? locations.find(l => l.LocationID === pickup)?.LocationName + ' - ' + locations.find(l => l.LocationID === pickup)?.City || 'Select pickup location' : 'Select pickup location'}
                        </option>
                        {locations.map(l => (
                          <option key={l.LocationID} value={l.LocationID} className="bg-gray-900 text-white hover:bg-amber-500/20">
                            {l.LocationName} - {l.City}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <MapPin className="text-amber-500" size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Dropoff Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50 flex items-center justify-center shadow-glow">
                        <MapPin className="text-emerald-500" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">Dropoff Location</h4>
                        <p className="text-text-muted text-sm">Where are you heading?</p>
                      </div>
                    </div>
                    <div className="relative">
                      <select 
                        className="w-full bg-gradient-to-r from-glass-bg-light via-glass-bg to-glass-bg-light border-2 border-emerald-500/30 rounded-2xl px-6 py-4 text-white outline-none hover:border-emerald-500/50 focus:border-emerald-500/70 transition-all duration-300 shadow-glow hover:shadow-glow-lg appearance-none cursor-pointer backdrop-blur-xl"
                        value={dropoff || ''}
                        onChange={(e) => setDropoff(Number(e.target.value))}
                      >
                        <option value="" disabled className="bg-gray-900 text-gray-400">
                          {dropoff ? locations.find(l => l.LocationID === dropoff)?.LocationName + ' - ' + locations.find(l => l.LocationID === dropoff)?.City || 'Select dropoff location' : 'Select dropoff location'}
                        </option>
                        {locations.map(l => (
                          <option key={l.LocationID} value={l.LocationID} className="bg-gray-900 text-white hover:bg-emerald-500/20">
                            {l.LocationName} - {l.City}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <MapPin className="text-emerald-500" size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <Button 
                    className="px-12 py-4 bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow-lg transition-all duration-300 text-lg font-semibold"
                    onClick={() => setStep(2)}
                    disabled={!pickup || !dropoff}
                  >
                    Continue to Vehicle Selection
                  </Button>
                </div>
              </GlassCard>

              {/* Popular Locations */}
              <GlassCard tier={2} className="p-6">
                <h4 className="text-lg font-display mb-4 text-soft-gold">Popular Locations</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {locations.slice(0, 3).map(location => (
                    <motion.div
                      key={location.LocationID}
                      className="p-4 bg-glass-bg-light border border-glass-border rounded-lg cursor-pointer hover:border-soft-gold/50 transition-all duration-300"
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!pickup) {
                          setPickup(location.LocationID);
                        } else if (!dropoff && location.LocationID !== pickup) {
                          setDropoff(location.LocationID);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          pickup === location.LocationID 
                            ? 'bg-amber-500/20 border-amber-500/50' 
                            : dropoff === location.LocationID 
                            ? 'bg-emerald-500/20 border-emerald-500/50'
                            : 'bg-glass-bg border-glass-border'
                        }`}>
                          <MapPin className={pickup === location.LocationID ? 'text-amber-500' : dropoff === location.LocationID ? 'text-emerald-500' : 'text-soft-gold'} size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{location.LocationName}</div>
                          <div className="text-sm text-text-muted">{location.City}</div>
                        </div>
                        {(pickup === location.LocationID || dropoff === location.LocationID) && (
                          <div className="w-2 h-2 bg-soft-gold rounded-full" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="max-w-6xl mx-auto space-y-8">
          <GlassCard tier={3} className="p-8 backdrop-blur-xl bg-glass-white border-glass-border">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-display mb-4 bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold">Choose Your Ride</h3>
              <p className="text-text-muted">Select the perfect vehicle for your journey</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vehicles.map((vehicle, index) => {
                const isSelected = selectedVehicle?.Type === vehicle.Type;
                return (
                  <motion.div
                    key={vehicle.Type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GlassCard 
                      tier={isSelected ? 'amber' : 2}
                      className={`p-6 cursor-pointer transition-all duration-300 backdrop-blur-xl relative overflow-hidden ${
                        isSelected 
                          ? 'bg-gradient-to-br from-soft-gold/20 to-champagne/20 border-soft-gold/50 shadow-glow-lg scale-105 ring-2 ring-soft-gold/30' 
                          : 'bg-glass-white border-glass-border hover:border-soft-gold/30 hover:shadow-glow'
                      }`}
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        // Calculate estimated fare based on vehicle type
                        const fareRange = vehicle.EstimatedFare.match(/PKR (\d+)-(\d+)/);
                        if (fareRange) {
                          setEstimatedFare((parseInt(fareRange[1]) + parseInt(fareRange[2])) / 2);
                        }
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 right-4 w-8 h-8 bg-soft-gold rounded-full flex items-center justify-center"
                        >
                          <span className="text-xs font-bold text-text-primary">✓</span>
                        </motion.div>
                      )}

                      <div className="text-center">
                        <motion.div 
                          className="text-6xl mb-4"
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          {vehicle.Type === 'Bike' ? '🏍️' : vehicle.Type === 'Business' ? '💼' : '🚗'}
                        </motion.div>
                        <h4 className="font-bold text-xl mb-3 text-text-primary">{vehicle.Type}</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${vehicle.Available > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                            <span className="text-sm text-text-muted">
                              {vehicle.Available > 0 ? `${vehicle.Available} available` : 'Currently unavailable'}
                            </span>
                          </div>
                          
                          <div className="bg-glass-bg-light rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-muted">Est. Fare</span>
                              <span className="text-sm font-bold text-amber-500">{vehicle.EstimatedFare}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-muted">Est. Time</span>
                              <span className="text-xs text-white">{vehicle.EstimatedTime}</span>
                            </div>
                          </div>

                          {vehicle.Vehicles.length > 0 && (
                            <div className="text-xs text-text-muted">
                              <div className="font-medium text-amber-600 mb-2">Top Drivers</div>
                              <div className="space-y-1">
                                {vehicle.Vehicles.slice(0, 2).map((v: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 bg-amber-500/20 rounded-full" />
                                    <span>{v.DriverName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <Button 
                variant="glass" 
                className="px-8 py-3"
                onClick={() => setStep(1)}
              >
                ← Back to Locations
              </Button>
              <Button 
                className="px-12 py-3 bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow-lg transition-all duration-300 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setStep(3)} 
                disabled={!selectedVehicle}
              >
                Continue to Summary →
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-6xl mx-auto space-y-8">
          <GlassCard tier={3} className="p-8 backdrop-blur-xl bg-glass-white border-glass-border">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-display mb-4 bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold">Ride Summary</h3>
              <p className="text-text-muted">Review your ride details before booking</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Route Visualization */}
              <div className="lg:col-span-2">
                <GlassCard tier={2} className="h-[400px] flex items-center justify-center bg-gradient-to-br from-amber-500/5 to-champagne/5 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  {/* Animated Route Line */}
                  <motion.div 
                    className="absolute top-1/2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-amber-500 to-champagne rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                  
                  <div className="relative z-10 flex flex-col items-center gap-8">
                    {/* Pickup Point */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-champagne/20 border-2 border-amber-500/50 flex items-center justify-center shadow-glow">
                        <MapPin className="text-amber-500" size={24} />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-white">Pickup</div>
                        <div className="text-sm text-text-muted">{locations.find(l => l.LocationID === pickup)?.LocationName}</div>
                      </div>
                    </motion.div>

                    {/* Vehicle Icon */}
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      className="text-4xl"
                    >
                      {selectedVehicle?.Type === 'Bike' ? '🏍️' : selectedVehicle?.Type === 'Business' ? '💼' : '🚗'}
                    </motion.div>

                    {/* Dropoff Point */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50 flex items-center justify-center shadow-glow">
                        <MapPin className="text-emerald-500" size={24} />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-white">Dropoff</div>
                        <div className="text-sm text-text-muted">{locations.find(l => l.LocationID === dropoff)?.LocationName}</div>
                      </div>
                    </motion.div>
                  </div>
                </GlassCard>
              </div>

              {/* Booking Details */}
              <div className="space-y-6">
                <GlassCard tier={2} className="p-6">
                  <h4 className="text-lg font-display mb-6 text-soft-gold">Booking Details</h4>
                  
                  <div className="space-y-4">
                    {/* Vehicle Type */}
                    <div className="flex items-center justify-between p-3 bg-glass-bg-light rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedVehicle?.Type === 'Bike' ? '🏍️' : selectedVehicle?.Type === 'Business' ? '💼' : '🚗'}</span>
                        <div>
                          <div className="font-medium text-white">{selectedVehicle?.Type}</div>
                          <div className="text-xs text-text-muted">{selectedVehicle?.Available} available</div>
                        </div>
                      </div>
                    </div>

                    {/* Route Summary */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                          <MapPin className="text-amber-500" size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-text-muted">From</div>
                          <div className="text-white font-medium">{locations.find(l => l.LocationID === pickup)?.LocationName}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                          <MapPin className="text-emerald-500" size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-text-muted">To</div>
                          <div className="text-white font-medium">{locations.find(l => l.LocationID === dropoff)?.LocationName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Fare Breakdown */}
                    <div className="bg-glass-bg-light rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Base Fare</span>
                        <span className="text-white">PKR {estimatedFare ? Math.round(estimatedFare * 0.7) : 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Distance</span>
                        <span className="text-white">PKR {estimatedFare ? Math.round(estimatedFare * 0.3) : 0}</span>
                      </div>
                      <hr className="border-glass-border" />
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-amber-500">Total</span>
                        <span className="text-amber-500">PKR {estimatedFare || 0}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full py-4 bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow-lg transition-all duration-300 text-lg font-semibold"
                    onClick={handleBook} 
                    loading={loading}
                    disabled={!pickup || !dropoff || !selectedVehicle}
                  >
                    {loading ? 'Booking...' : 'Book Now'}
                  </Button>
                  <Button 
                    variant="glass" 
                    className="w-full py-3"
                    onClick={() => setStep(2)}
                  >
                    ← Back to Vehicle Selection
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {step === 4 && rideState && (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
          {/* Check if ride is cancelled - show cancelled status separately */}
          {rideState.RideStatus === 'Cancelled' ? (
            <GlassCard tier={3} className="max-w-2xl mx-auto p-8 text-center backdrop-blur-xl bg-glass-white border-glass-border shadow-glow-lg">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl text-red-500">{cancelledStatus.icon}</span>
              </div>
              <h3 className="text-2xl font-display mb-2 bg-gradient-to-r from-red-600 to-pink-500 bg-clip-text text-transparent font-bold">Ride Cancelled</h3>
              <p className="text-text-muted mb-4">Your ride has been cancelled. You can book a new ride anytime.</p>
              <div className="bg-glass-bg-light p-4 rounded-radius-md border border-glass-border my-6">
                <p className="text-sm text-text-muted">Original fare: PKR {rideState.Fare}</p>
                <p className="text-sm text-text-muted">Pickup: {locations.find(l => l.LocationID === pickup)?.LocationName}</p>
                <p className="text-sm text-text-muted">Dropoff: {locations.find(l => l.LocationID === dropoff)?.LocationName}</p>
              </div>
              <Button className="bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow-lg" onClick={() => { setStep(1); setRideState(null); setActiveRideId(null); }}>Book New Ride</Button>
            </GlassCard>
          ) : (
            <>
              {/* Enhanced Ride Status Tracker for non-cancelled rides */}
              <GlassCard tier={2} className="p-6 backdrop-blur-xl bg-glass-white border-glass-border">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-glass-bg-light via-glass-bg to-glass-bg-light backdrop-blur-xl border-2 border-soft-gold/30 rounded-full px-8 py-4 shadow-glow-lg">
                    {rideStatuses.map((status, index) => {
                      const currentStatus = getCurrentRideStatus();
                      const isActive = currentStatus === status.id;
                      const isCompleted = currentStatus && rideStatuses.findIndex(s => s.id === currentStatus) > index;
                      
                      return (
                        <div key={status.id} className="flex items-center">
                          <motion.div
                            className="flex flex-col items-center cursor-pointer group relative"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (isActive && rideState) {
                                console.log('Show details for status:', status.label);
                              }
                            }}
                          >
                            <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                              isActive 
                                ? 'bg-gradient-to-br from-soft-gold via-amber-500 to-champagne text-white shadow-glow-lg ring-2 ring-amber-500/50 animate-pulse'
                                : isCompleted 
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-glow'
                                  : 'bg-glass-bg-light border-2 border-glass-border text-text-muted'
                            }`}>
                              {status.icon}
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-md"
                                />
                              )}
                            </div>
                            <span className={`text-xs font-medium mt-2 px-2 py-1 rounded-full transition-all duration-300 ${
                              isActive 
                                ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                                : isCompleted
                                  ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {status.label}
                            </span>
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10"
                              >
                                {status.description}
                              </motion.div>
                            )}
                          </motion.div>
                          {index < rideStatuses.length - 1 && (
                            <div className={`w-6 h-0.5 mx-2 transition-all duration-500 ${
                              isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-glow' : 'bg-glass-border'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Current Status Details */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl bg-glass-white-strong border border-soft-gold/50 shadow-glow">
                    <span className="text-amber-500 text-lg font-bold animate-pulse">✦</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {rideStatuses.find(s => s.id === getCurrentRideStatus())?.description || 'Processing...'}
                    </span>
                  </div>
                </div>
              </GlassCard>

              {/* Ride Status Content */}
              {rideState.RideStatus === 'Requested' ? (
                <GlassCard tier={3} className="max-w-2xl mx-auto p-8 text-center backdrop-blur-xl bg-glass-white border-glass-border shadow-glow-lg">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-6">
                    <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse-glow" />
                  </div>
                  <h3 className="text-2xl font-display mb-2 bg-gradient-to-r from-amber-600 to-champagne bg-clip-text text-transparent font-bold">Finding your driver</h3>
                  <p className="text-text-muted mb-4">Please wait while we connect you to a nearby driver.</p>
                  <div className="bg-glass-bg-light p-4 rounded-radius-md border border-glass-border my-6">
                    <p className="text-amber-500 font-medium mb-1">Estimated Fare: PKR {rideState.Fare}</p>
                    <p className="text-sm text-text-muted">Pickup: {locations.find(l => l.LocationID === pickup)?.LocationName}</p>
                    <p className="text-sm text-text-muted">Dropoff: {locations.find(l => l.LocationID === dropoff)?.LocationName}</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button variant="glass" onClick={() => riderAPI.getRideDetail(activeRideId!)}>Refresh Status</Button>
                    <Button variant="glass" className="text-error border-error/30 hover:border-error" onClick={handleCancel}>Cancel Request</Button>
                  </div>
                </GlassCard>
              ) : rideState.RideStatus === 'Accepted' ? (
                <GlassCard tier={3} className="max-w-2xl mx-auto p-8 text-center backdrop-blur-xl bg-glass-white border-glass-border shadow-glow-lg">
                  <div className="w-16 h-16 rounded-full bg-success/20 border border-success/50 flex items-center justify-center mx-auto mb-6">
                    <Navigation className="text-success" size={32} />
                  </div>
                  <h3 className="text-2xl font-display mb-2 bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent font-bold">Driver is on the way!</h3>
                  <div className="bg-glass-bg-light p-4 rounded-radius-md border border-glass-border my-6">
                    <p className="text-amber-500 font-medium mb-1">Fare: PKR {rideState.Fare}</p>
                    <p className="text-sm text-text-muted">Driver is heading to your pickup location</p>
                    <p className="text-sm text-text-muted">Estimated arrival: 5-10 minutes</p>
                    {rideState.DriverName && <p className="text-sm text-amber-600 font-medium mt-2">Driver: {rideState.DriverName}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="glass" onClick={() => riderAPI.getRideDetail(activeRideId!)}>Refresh Status</Button>
                    <Button variant="glass" className="text-error border-error/30 hover:border-error" onClick={handleCancel}>Cancel Ride</Button>
                  </div>
                </GlassCard>
              ) : rideState.RideStatus === 'InProgress' ? (
                <GlassCard tier={3} className="max-w-2xl mx-auto p-8 text-center backdrop-blur-xl bg-glass-white border-glass-border shadow-glow-lg">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center mx-auto mb-6">
                    <MapPin className="text-blue-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-display mb-2 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent font-bold">Ride in Progress</h3>
                  <div className="bg-glass-bg-light p-4 rounded-radius-md border border-glass-border my-6">
                    <p className="text-amber-500 font-medium mb-1">Fare: PKR {rideState.Fare}</p>
                    <p className="text-sm text-text-muted">You are currently on your way to your destination</p>
                    <p className="text-sm text-text-muted">Destination: {locations.find(l => l.LocationID === dropoff)?.LocationName}</p>
                    {rideState.DriverName && <p className="text-sm text-amber-600 font-medium mt-2">Driver: {rideState.DriverName}</p>}
                  </div>
                  <Button variant="glass" onClick={() => riderAPI.getRideDetail(activeRideId!)}>Refresh Status</Button>
                </GlassCard>
              ) : (
                <GlassCard tier={3} className="max-w-2xl mx-auto p-8 text-center backdrop-blur-xl bg-glass-white border-glass-border shadow-glow-lg">
                  <Badge variant="success" className="mb-4">Ride {rideState.RideStatus}</Badge>
                  <h3 className="text-2xl font-display mb-2 bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent font-bold">Driver is on the way</h3>
                  <div className="bg-glass-bg-light p-4 rounded-radius-md border border-glass-border my-6">
                    <p className="text-amber-500 font-medium mb-1">Fare: PKR {rideState.Fare}</p>
                    <p className="text-text-muted">Please meet your driver at the pickup location.</p>
                  </div>
                  <p className="text-text-muted text-sm">Please meet your driver at the pickup location.</p>
                </GlassCard>
              )}
            </>
          )}
          </div>
          
          {/* Safety Panel for active rides */}
          <div className="lg:w-80">
            {activeRideId && <SafetyPanel rideID={activeRideId} />}
          </div>
        </div>
      )}

      {step === 5 && rideState && (
        <GlassCard tier={3} className="max-w-md mx-auto p-8 text-center mt-12 border-success">
          <h3 className="text-2xl font-display mb-2 text-success">Ride {rideState.RideStatus}!</h3>
          <p className="text-text-muted mb-6">Thank you for riding with RideFlow.</p>
          <Button className="w-full" onClick={() => { setStep(1); setRideState(null); setActiveRideId(null); }}>Book Another Ride</Button>
        </GlassCard>
      )}
    </div>
  );
}

function TripsTab() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    riderAPI.getRideHistory().then(res => {
      setRides(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredRides = filter === 'All' ? rides : rides.filter(r => r.RideStatus === filter);
  const totalSpent = rides.filter(r => r.RideStatus === 'Completed').reduce((sum, r) => sum + Number(r.Fare), 0);

  const handlePayment = async (rideId: number) => {
    try {
      await riderAPI.makePayment({
        rideID: rideId,
        amount: rides.find(r => r.RideID === rideId)?.Fare,
        paymentMethod: 'CreditCard'
      });
      toast.success('Payment processed successfully');
      // Refresh rides
      const res = await riderAPI.getRideHistory();
      setRides(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const handleRating = async () => {
    if (!selectedRide) return;
    try {
      await riderAPI.rateDriver({
        rideID: selectedRide.RideID,
        score: rating,
        comment: ratingComment
      });
      toast.success('Rating submitted successfully');
      setShowRatingModal(false);
      setSelectedRide(null);
      setRating(5);
      setRatingComment('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rating failed');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Rides" value={rides.length} />
        <StatCard label="Total Spent" value={totalSpent} prefix="PKR " />
        <StatCard label="Completed" value={rides.filter(r => r.RideStatus === 'Completed').length} />
      </div>

      <div className="flex gap-2">
        {['All', 'Completed', 'Cancelled', 'InProgress', 'Requested'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-amber-600 text-bg-base' 
                : 'bg-glass-bg border border-glass-border text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          Array.from({length: 3}).map((_, i) => <Skeleton key={i} variant="card" height="100px" />)
        ) : filteredRides.length === 0 ? (
          <GlassCard tier={1} className="p-8 text-center text-text-muted">No rides found.</GlassCard>
        ) : (
          filteredRides.map(r => (
            <GlassCard key={r.RideID} tier={1} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 rounded-full bg-glass-bg-light border border-glass-border flex items-center justify-center shrink-0">
                  🚗
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">Ride #{r.RideID}</span>
                    <Badge variant={r.RideStatus === 'Completed' ? 'success' : r.RideStatus === 'Cancelled' ? 'error' : r.RideStatus === 'InProgress' ? 'warning' : 'info'}>{r.RideStatus}</Badge>
                  </div>
                  <p className="text-sm text-text-muted">{new Date(r.StartTime || r.ScheduledTime).toLocaleDateString()} • PKR {r.Fare}</p>
                  <p className="text-xs text-text-muted">{r.PickupCity} → {r.DropoffCity}</p>
                  {r.DriverName && <p className="text-xs text-text-muted">Driver: {r.DriverName}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="glass" size="sm" onClick={() => setSelectedRide(r)}>Details</Button>
                {r.RideStatus === 'Completed' && !r.Rated && (
                  <Button size="sm" onClick={() => { setSelectedRide(r); setShowRatingModal(true); }}>Rate</Button>
                )}
                {r.RideStatus === 'Completed' && !r.Paid && (
                  <Button size="sm" onClick={() => { setSelectedRide(r); setShowPaymentModal(true); }}>Pay</Button>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GlassCard tier={3} className="p-6 max-w-md w-full">
            <h3 className="text-xl font-display mb-4">Complete Payment</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between"><span>Ride #{selectedRide.RideID}</span><span>PKR {selectedRide.Fare}</span></div>
              <div className="flex justify-between"><span>Payment Method</span><span>Credit Card</span></div>
              <hr className="border-glass-border" />
              <div className="flex justify-between font-medium"><span>Total</span><span>PKR {selectedRide.Fare}</span></div>
            </div>
            <div className="flex gap-3">
              <Button variant="glass" className="flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => handlePayment(selectedRide.RideID)}>Pay Now</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedRide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GlassCard tier={3} className="p-6 max-w-md w-full">
            <h3 className="text-xl font-display mb-4">Rate Your Driver</h3>
            <div className="text-center mb-4">
              <p className="text-sm text-text-muted mb-2">How was your ride with {selectedRide.DriverName}?</p>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${star <= rating ? 'text-amber-500' : 'text-glass-border'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="w-full bg-glass-bg border border-glass-border rounded-radius-md px-3 py-2 text-white outline-none resize-none"
                placeholder="Share your experience (optional)"
                rows={3}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="glass" className="flex-1" onClick={() => setShowRatingModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleRating}>Submit Rating</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function ProfileTab() {
  const [profile, setProfile] = useState<any>({});
  const [promos, setPromos] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' });
  const [complaintForm, setComplaintForm] = useState({ rideID: '', description: '' });
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    // Load profile and promos
    Promise.all([
      riderAPI.getProfile(),
      riderAPI.getMyPromos(),
      riderAPI.getComplaints()
    ]).then(([profileRes, promosRes, complaintsRes]) => {
      setProfile(profileRes.data.data);
      setPromos(promosRes.data.data);
      setComplaints(complaintsRes.data.data);
      
      // Set edit form values
      const p = profileRes.data.data;
      setEditForm({
        firstName: p.FirstName || '',
        lastName: p.LastName || '',
        email: p.Email || ''
      });
    }).catch(console.error);
  }, []);

  const handleUpdateProfile = async () => {
    try {
      await riderAPI.updateProfile(editForm);
      toast.success('Profile updated successfully');
      setShowEditModal(false);
      // Refresh profile
      const res = await riderAPI.getProfile();
      setProfile(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Profile update failed');
    }
  };

  const handleFileComplaint = async () => {
    if (!complaintForm.rideID || !complaintForm.description) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await riderAPI.fileComplaint(complaintForm);
      toast.success('Complaint filed successfully');
      setShowComplaintModal(false);
      setComplaintForm({ rideID: '', description: '' });
      // Refresh complaints
      const res = await riderAPI.getComplaints();
      setComplaints(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to file complaint');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <GlassCard tier={3} className="p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-amber-600 text-bg-base flex items-center justify-center text-3xl font-display mb-4 shadow-glow">
            {profile.FirstName?.charAt(0) || 'R'}
          </div>
          <h2 className="text-2xl font-medium text-white mb-1">{profile.FirstName} {profile.LastName}</h2>
          <p className="text-text-muted mb-4">{profile.Email}</p>
          <Badge variant="success">Active Account</Badge>
          <div className="mt-6 w-full space-y-2">
            <Button className="w-full" onClick={() => setShowEditModal(true)}>Edit Profile</Button>
            <Button variant="glass" className="w-full" onClick={() => setShowComplaintModal(true)}>File Complaint</Button>
          </div>
        </GlassCard>
        
        <GlassCard tier={1} className="p-6 mt-6">
          <h3 className="text-lg font-display mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span>Member Since</span><span>{new Date(profile.RegistrationDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between text-sm"><span>Active Promos</span><span>{promos.length}</span></div>
            <div className="flex justify-between text-sm"><span>Complaints</span><span>{complaints.length}</span></div>
          </div>
        </GlassCard>
      </div>
      
      <div className="lg:col-span-2 flex flex-col gap-6">
        <GlassCard tier={1} className="p-6">
          <h3 className="text-xl font-display mb-6">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="First Name" defaultValue={profile.FirstName || ''} readOnly />
            <FormInput label="Last Name" defaultValue={profile.LastName || ''} readOnly />
            <FormInput label="Email" defaultValue={profile.Email || ''} className="md:col-span-2" readOnly />
            <FormInput label="Account Status" defaultValue={profile.AccountStatus || ''} readOnly />
            <FormInput label="User ID" defaultValue={profile.UserID || ''} readOnly />
          </div>
        </GlassCard>
        
        <GlassCard tier={1} className="p-6">
          <h3 className="text-xl font-display mb-6">Promocodes</h3>
          <div className="flex flex-col gap-3">
            {promos.length === 0 ? <p className="text-text-muted">No active promos.</p> : null}
            {promos.map(p => (
              <div key={p.PromoCodeID} className="flex items-center justify-between p-3 border border-amber-500/30 bg-amber-500/5 rounded-radius-md">
                <div>
                  <div className="font-medium text-amber-500">{p.Code}</div>
                  <div className="text-xs text-text-muted">{p.DiscountPercentage}% off • Valid until {new Date(p.ValidTo).toLocaleDateString()}</div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ))}
          </div>
        </GlassCard>
        
        <GlassCard tier={1} className="p-6">
          <h3 className="text-xl font-display mb-6">Recent Complaints</h3>
          <div className="flex flex-col gap-3">
            {complaints.length === 0 ? <p className="text-text-muted">No complaints filed.</p> : null}
            {complaints.slice(0, 3).map(c => (
              <div key={c.ComplaintID} className="p-3 border border-glass-border rounded-radius-md">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-white">Complaint #{c.ComplaintID}</span>
                  <Badge variant={c.ComplaintStatus === 'Resolved' ? 'success' : c.ComplaintStatus === 'Dismissed' ? 'error' : 'warning'}>{c.ComplaintStatus}</Badge>
                </div>
                <p className="text-sm text-text-muted mb-1">Ride #{c.RideID}</p>
                <p className="text-sm text-text-muted">{c.Description.substring(0, 100)}{c.Description.length > 100 ? '...' : ''}</p>
                <p className="text-xs text-text-muted mt-2">{new Date(c.CreatedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GlassCard tier={3} className="p-6 max-w-md w-full">
            <h3 className="text-xl font-display mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <FormInput 
                label="First Name" 
                value={editForm.firstName} 
                onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
              />
              <FormInput 
                label="Last Name" 
                value={editForm.lastName} 
                onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
              />
              <FormInput 
                label="Email" 
                value={editForm.email} 
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="glass" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleUpdateProfile}>Save Changes</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <GlassCard tier={3} className="p-6 max-w-md w-full">
            <h3 className="text-xl font-display mb-4">File a Complaint</h3>
            <div className="space-y-4">
              <FormInput 
                label="Ride ID" 
                placeholder="Enter ride ID"
                value={complaintForm.rideID} 
                onChange={(e) => setComplaintForm({...complaintForm, rideID: e.target.value})}
              />
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
                <textarea
                  className="w-full bg-glass-bg border border-glass-border rounded-radius-md px-3 py-2 text-white outline-none resize-none"
                  placeholder="Describe your issue..."
                  rows={4}
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="glass" className="flex-1" onClick={() => setShowComplaintModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleFileComplaint}>Submit Complaint</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
