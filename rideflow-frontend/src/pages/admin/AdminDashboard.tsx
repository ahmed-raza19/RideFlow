import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Star, 
  Tag, 
  MessageSquare, 
  DollarSign, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Sidebar } from '../../components/layout/Sidebar';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { adminAPI } from '../../lib/admin';
import { fadeSlideUp } from '../../motion/presets';
import { toast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { MagneticButton } from '../../components/ui/MagneticButton';
import { CreateUserModal } from '../../components/admin/CreateUserModal';
import { NotificationCenter } from '../../components/admin/NotificationCenter';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'drivers', label: 'Drivers', icon: <Car size={20} /> },
    { id: 'vehicles', label: 'Vehicles', icon: <Car size={20} /> },
    { id: 'rides', label: 'Rides', icon: <Car size={20} /> },
    { id: 'ratings', label: 'Ratings', icon: <Star size={20} /> },
    { id: 'promos', label: 'Promo Codes', icon: <Tag size={20} /> },
    { id: 'complaints', label: 'Complaints', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white via-soft-beige to-ivory text-text-primary overflow-x-hidden relative">
      {/* Elegant Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-champagne/10 to-soft-gold/10 animate-gradient-shift" />
      <motion.div 
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(230,213,184,0.15) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <DashboardLayout>
        <Sidebar items={navItems} activeId={activeTab} onSelect={setActiveTab} title="Admin Portal" />
        <main className="flex-1 lg:ml-64 p-4 md:p-8 pb-24 lg:pb-8 w-full max-w-[1400px] mx-auto relative z-10">
          {/* Header with Notifications */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-display text-amber-900 mb-2">Admin Dashboard</h1>
              <p className="text-amber-700/70">Manage platform operations</p>
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
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'drivers' && <DriversTab />}
              {activeTab === 'vehicles' && <VehiclesTab />}
              {activeTab === 'rides' && <RidesTab />}
              {activeTab === 'ratings' && <RatingsTab />}
              {activeTab === 'promos' && <PromosTab />}
              {activeTab === 'complaints' && <ComplaintsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </DashboardLayout>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState({ revenue: 0, drivers: 0, rides: 0, complaints: 0 });
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [revenueOverview, setRevenueOverview] = useState<any>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [revenueOverviewRes, ridesRes, userRes, complRes] = await Promise.all([
          adminAPI.getRevenueOverview(),
          adminAPI.activeRides(),
          adminAPI.getDrivers(),
          adminAPI.getComplaints('Open')
        ]);
        
        const revenueData = revenueOverviewRes.data.data;
        const totalRevenue = revenueData.overview.TotalRevenue;
        
        const drivers = userRes.data.data;
        const activeDriversCount = drivers.filter((d: any) => d.AvailabilityStatus === 'Online').length;
        
        setStats({
          revenue: totalRevenue,
          drivers: activeDriversCount,
          rides: ridesRes.data.data.length,
          complaints: complRes.data.data.length
        });

        setActiveRides(ridesRes.data.data);
        setRevenueOverview(revenueData);

        // Chart mapping using monthly revenue trend
        setChartData({
          labels: revenueData.monthlyTrend.map((m: any) => m.MonthLabel),
          datasets: [{
            label: 'Monthly Revenue (PKR)',
            data: revenueData.monthlyTrend.map((m: any) => m.Revenue),
            borderColor: '#D97706',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            tension: 0.4,
          }]
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchOverview();
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: { 
      legend: { 
        display: false,
        labels: {
          color: '#2C1810',
          font: {
            family: '"DM Sans", system-ui, sans-serif'
          }
        }
      } 
    },
    scales: {
      x: { 
        grid: { color: 'rgba(230,213,184,0.2)', drawBorder: false }, 
        ticks: { color: '#8B7355' },
        border: {
          display: false
        }
      },
      y: { 
        grid: { color: 'rgba(230,213,184,0.2)', drawBorder: false }, 
        ticks: { color: '#8B7355' },
        border: {
          display: false
        }
      },
    },
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <GlassCard tier={2} className="p-6 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/50 transition-all duration-300 hover:shadow-glow-lg group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-soft-gold/20 to-champagne/20 border-2 border-soft-gold/30 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6" />
              </div>
              <motion.div 
                className="w-2 h-2 bg-amber-600 rounded-full animate-pulse shadow-glow"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">Total Customer Spending</h3>
            <p className="text-2xl font-bold text-text-primary">PKR {stats.revenue.toLocaleString()}</p>
            <div className="mt-2 text-xs text-amber-600 font-medium">
              {revenueOverview ? `${revenueOverview.overview.TotalTransactions} transactions` : 'Loading...'}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <GlassCard tier={2} className="p-6 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/50 transition-all duration-300 hover:shadow-glow-lg group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-soft-gold/20 to-champagne/20 border-2 border-soft-gold/30 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
              <motion.div 
                className="w-2 h-2 bg-admin-success rounded-full animate-pulse shadow-glow"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">Active Drivers</h3>
            <p className="text-2xl font-bold text-text-primary">{stats.drivers}</p>
            <div className="mt-2 text-xs text-admin-success font-medium">+8% from last week</div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <GlassCard tier={2} className="p-6 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/50 transition-all duration-300 hover:shadow-glow-lg group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-soft-gold/20 to-champagne/20 border-2 border-soft-gold/30 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-6 h-6" />
              </div>
              <motion.div 
                className="w-2 h-2 bg-admin-cyan rounded-full animate-pulse shadow-glow"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">Active Rides</h3>
            <p className="text-2xl font-bold text-text-primary">{stats.rides}</p>
            <div className="mt-2 text-xs text-admin-cyan font-medium">Real-time tracking</div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <GlassCard tier={2} className="p-6 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/50 transition-all duration-300 hover:shadow-glow-lg group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-soft-gold/20 to-champagne/20 border-2 border-soft-gold/30 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-6 h-6" />
              </div>
              <motion.div 
                className="w-2 h-2 bg-admin-warning rounded-full animate-pulse shadow-glow"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
              />
            </div>
            <h3 className="text-sm font-medium text-text-secondary mb-1">Open Complaints</h3>
            <p className="text-2xl font-bold text-text-primary">{stats.complaints}</p>
            <div className="mt-2 text-xs text-admin-warning font-medium">Requires attention</div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Charts and Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-text-primary font-bold">Revenue Analytics</h3>
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-2 h-2 bg-amber-600 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm text-text-secondary">Live Data</span>
              </div>
            </div>
            {chartData ? <Line data={chartData} options={chartOptions} /> : <Skeleton variant="card" height="300px" />}
          </GlassCard>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display text-text-primary font-bold">Live Activity</h3>
              <motion.div 
                className="w-2 h-2 bg-admin-cyan rounded-full animate-pulse shadow-glow"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
              {activeRides.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-soft-gold/20 to-champagne/20 border-2 border-soft-gold/30 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                  <p className="text-text-secondary text-sm">No active rides at the moment.</p>
                </div>
              ) : (
                activeRides.map((r, index) => (
                  <motion.div
                    key={r.RideID}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl hover:border-soft-gold/30 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-text-primary text-sm">Ride #{r.RideID}</span>
                        <motion.span 
                          className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-admin-cyan/20 text-admin-cyan border border-admin-cyan/30"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {r.RideStatus}
                        </motion.span>
                      </div>
                      <div className="text-amber-600 font-bold text-sm">PKR {r.Fare}</div>
                    </div>
                    <div className="text-text-secondary text-xs">
                      {r.RiderName} → {r.DriverName || 'Pending'}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Revenue Insights Section */}
      {revenueOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-text-primary font-bold">Revenue Breakdown</h3>
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-2 h-2 bg-amber-600 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm text-text-secondary">Payment Methods</span>
              </div>
            </div>
            <div className="space-y-4">
              {revenueOverview.byPaymentMethod?.map((method: any, index: number) => (
                <motion.div
                  key={method.PaymentMethod}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl hover:border-soft-gold/30 transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-text-primary">{method.PaymentMethod}</h4>
                      <p className="text-sm text-text-secondary">{method.TransactionCount} transactions</p>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-600 font-bold text-lg">PKR {method.Revenue.toLocaleString()}</div>
                      <div className="text-sm text-admin-success">{method.Percentage}%</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-text-primary font-bold">Top Customers</h3>
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-2 h-2 bg-admin-cyan rounded-full animate-pulse shadow-glow"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-sm text-text-secondary">By Spending</span>
              </div>
            </div>
            <div className="space-y-3">
              {revenueOverview.topCustomers?.slice(0, 5).map((customer: any, index: number) => (
                <motion.div
                  key={customer.UserID}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl hover:border-soft-gold/30 transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-text-primary text-sm">#{index + 1}</span>
                      <span className="ml-2 font-medium text-text-primary">{customer.CustomerName}</span>
                    </div>
                    <div className="text-amber-600 font-bold text-sm">PKR {customer.TotalSpent.toLocaleString()}</div>
                  </div>
                  <div className="text-text-secondary text-xs mt-1">
                    {customer.TransactionCount} transactions • Avg: PKR {customer.AverageSpent.toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300">
            <h3 className="text-2xl font-display text-text-primary font-bold mb-6">Revenue Insights</h3>
            <div className="space-y-4">
              <div className="p-4 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Net Revenue:</span>
                  <span className="font-semibold text-admin-cyan">PKR {revenueOverview.overview.NetRevenue.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-4 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Discounts:</span>
                  <span className="font-semibold text-admin-warning">PKR {revenueOverview.overview.TotalDiscounts.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-4 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Average Transaction:</span>
                  <span className="font-semibold text-amber-600">PKR {revenueOverview.overview.AverageTransaction.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const fetchUsers = () => adminAPI.getUsers().then(r => setUsers(r.data.data)).catch(console.error);
  useEffect(() => { fetchUsers(); }, []);

  const toggleStatus = async (u: any) => {
    const newStatus = u.AccountStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await adminAPI.updateUserStatus(u.UserID, newStatus);
      toast.success(`User ${newStatus}`);
      fetchUsers();
    } catch (e) { toast.error('Failed to update status'); }
  };

  const handleUserCreated = () => {
    fetchUsers();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-display text-text-primary font-bold mb-2">User Management</h3>
            <p className="text-text-secondary">Manage and monitor all platform users</p>
          </div>
          <div className="flex items-center gap-4">
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-glass-white border border-glass-border hover:border-soft-gold/50 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse shadow-glow" />
              <span className="text-sm font-medium text-text-primary">{users.length} Total Users</span>
            </motion.div>
            <MagneticButton
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow rounded-xl border-0 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Add User
              </span>
            </MagneticButton>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search users by name, email, or role..." 
              className="w-full px-6 py-4 pl-12 rounded-2xl backdrop-blur-xl bg-glass-white border border-glass-border hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary"
            />
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          </div>
        </div>

        <div className="overflow-auto rounded-2xl border border-glass-border backdrop-blur-xl bg-glass-white/30">
          <table className="w-full text-left">
            <thead className="backdrop-blur-xl bg-glass-white-strong border-b border-glass-border sticky top-0 z-10">
              <tr>
                <th className="p-6 font-semibold text-text-primary text-left">User ID</th>
                <th className="p-6 font-semibold text-text-primary text-left">Name</th>
                <th className="p-6 font-semibold text-text-primary text-left">Role</th>
                <th className="p-6 font-semibold text-text-primary text-left">Status</th>
                <th className="p-6 font-semibold text-text-primary text-left">Registration</th>
                <th className="p-6 font-semibold text-text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <motion.tr
                  key={u.UserID}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-glass-border/50 hover:bg-glass-white/30 transition-all duration-300"
                >
                  <td className="p-6">
                    <span className="font-mono text-sm font-medium text-amber-600 bg-amber-600/10 px-2 py-1 rounded-lg">#{u.UserID}</span>
                  </td>
                  <td className="p-6">
                    <div>
                      <div className="font-semibold text-text-primary">{u.FullName}</div>
                      <div className="text-sm text-text-secondary">{u.Email}</div>
                    </div>
                  </td>
                  <td className="p-6">
                    <Badge variant={u.Role === 'Admin' ? 'warning' : u.Role === 'Driver' ? 'info' : 'success'} className="px-3 py-1">
                      {u.Role}
                    </Badge>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className={`w-2 h-2 rounded-full ${
                          u.AccountStatus === 'Active' ? 'bg-admin-success' : 
                          u.AccountStatus === 'Suspended' ? 'bg-admin-warning' : 'bg-admin-danger'
                        }`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <Badge variant={u.AccountStatus === 'Active' ? 'success' : u.AccountStatus === 'Suspended' ? 'warning' : 'error'}>
                        {u.AccountStatus}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-sm text-text-secondary">
                      {new Date(u.RegistrationDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2 justify-end">
                      <MagneticButton
                        onClick={() => toggleStatus(u)}
                        className="px-4 py-2 text-sm font-medium backdrop-blur-xl bg-glass-white border border-glass-border hover:border-soft-gold/50 text-text-primary rounded-xl transition-all duration-300"
                      >
                        {u.AccountStatus === 'Active' ? 'Suspend' : 'Activate'}
                      </MagneticButton>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      
      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleUserCreated}
      />
    </motion.div>
  );
}

function DriversTab() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const fetchDrivers = () => adminAPI.getDrivers().then(r => setDrivers(r.data.data)).catch(console.error);
  useEffect(() => { fetchDrivers(); }, []);

  const verify = async (id: number) => {
    try {
      await adminAPI.verifyDriver(id, 'Verified');
      toast.success('Driver verified');
      fetchDrivers();
    } catch { toast.error('Failed to verify'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-display text-text-primary font-bold mb-2">Driver Verification</h3>
            <p className="text-text-secondary">Approve driver verification requests</p>
          </div>
          <div className="flex items-center gap-4">
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-glass-white border border-glass-border hover:border-soft-gold/50 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-2 h-2 bg-admin-warning rounded-full animate-pulse shadow-glow" />
              <span className="text-sm font-medium text-text-primary">
                {drivers.filter(d => d.VerificationStatus === 'Unverified').length} Pending
              </span>
            </motion.div>
          </div>
        </div>

        <div className="overflow-auto rounded-2xl border border-glass-border backdrop-blur-xl bg-glass-white/30">
          <table className="w-full text-left">
            <thead className="backdrop-blur-xl bg-glass-white-strong border-b border-glass-border sticky top-0 z-10">
              <tr>
                <th className="p-6 font-semibold text-text-primary text-left">Driver ID</th>
                <th className="p-6 font-semibold text-text-primary text-left">Name</th>
                <th className="p-6 font-semibold text-text-primary text-left">License</th>
                <th className="p-6 font-semibold text-text-primary text-left">CNIC</th>
                <th className="p-6 font-semibold text-text-primary text-left">Status</th>
                <th className="p-6 font-semibold text-text-primary text-left">Wallet</th>
                <th className="p-6 font-semibold text-text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, index) => (
                <motion.tr
                  key={d.DriverID}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-glass-border/50 hover:bg-glass-white/30 transition-all duration-300"
                >
                  <td className="p-6">
                    <span className="font-mono text-sm font-medium text-amber-600 bg-amber-600/10 px-2 py-1 rounded-lg">#{d.DriverID}</span>
                  </td>
                  <td className="p-6">
                    <div>
                      <div className="font-semibold text-text-primary">{d.DriverName}</div>
                      <div className="text-sm text-text-secondary">{d.Email}</div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="font-mono text-sm text-text-secondary">{d.LicenseNumber}</div>
                  </td>
                  <td className="p-6">
                    <div className="font-mono text-sm text-text-secondary">{d.CNIC}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className={`w-2 h-2 rounded-full ${
                          d.VerificationStatus === 'Verified' ? 'bg-admin-success' : 
                          d.VerificationStatus === 'Unverified' ? 'bg-admin-warning' : 'bg-admin-danger'
                        }`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <Badge variant={d.VerificationStatus === 'Verified' ? 'success' : d.VerificationStatus === 'Unverified' ? 'warning' : 'error'}>
                        {d.VerificationStatus}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="font-semibold text-amber-600">PKR {d.WalletBalance}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2 justify-end">
                      {d.VerificationStatus !== 'Verified' && (
                        <MagneticButton
                          onClick={() => verify(d.DriverID)}
                          className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-admin-success to-admin-cyan hover:from-admin-cyan hover:to-admin-success text-white shadow-glow rounded-xl border-0 transition-all duration-300"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </MagneticButton>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function PromosTab() {
  const [promos, setPromos] = useState<any[]>([]);
  useEffect(() => { adminAPI.getPromoCodes().then(r => setPromos(r.data.data)).catch(console.error); }, []);

  return (
    <GlassCard tier={1} className="p-6 h-[80vh] flex flex-col">
      <h3 className="text-xl font-display mb-6">Promocodes</h3>
      <div className="flex-1 overflow-auto rounded-radius-md border border-glass-border">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-glass-bg-light text-text-muted border-b border-glass-border sticky top-0">
            <tr>
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Discount</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Usage</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.PromoCodeID} className="border-b border-glass-border hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-amber-500">{p.Code}</td>
                <td className="p-4">{p.DiscountPercentage}%</td>
                <td className="p-4"><Badge variant={p.Status === 'Active' ? 'success' : 'error'}>{p.Status}</Badge></td>
                <td className="p-4 text-text-muted">{p.UsageCount} / {p.UsageLimit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function VehiclesTab() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const fetchVehicles = () => adminAPI.getVehicles().then(r => setVehicles(r.data.data)).catch(console.error);
  useEffect(() => { fetchVehicles(); }, []);

  const verify = async (id: number, status: string) => {
    try {
      await adminAPI.verifyVehicle(id, status);
      toast.success(`Vehicle ${status}`);
      fetchVehicles();
    } catch { toast.error('Failed to update'); }
  };

  const deleteVehicle = async (id: number) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await adminAPI.deleteVehicle(id);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <GlassCard tier={1} className="p-6 h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display">Vehicle Management</h3>
      </div>
      <div className="flex-1 overflow-auto rounded-radius-md border border-glass-border">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-glass-bg-light text-text-muted border-b border-glass-border sticky top-0">
            <tr>
              <th className="p-4 font-medium">Vehicle ID</th>
              <th className="p-4 font-medium">Driver</th>
              <th className="p-4 font-medium">Make/Model</th>
              <th className="p-4 font-medium">License</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.VehicleID} className="border-b border-glass-border hover:bg-white/5 transition-colors">
                <td className="p-4">#{v.VehicleID}</td>
                <td className="p-4 text-white">{v.DriverName}</td>
                <td className="p-4">{v.Make} {v.Model}</td>
                <td className="p-4">{v.LicensePlate}</td>
                <td className="p-4"><Badge variant="info">{v.VehicleType}</Badge></td>
                <td className="p-4"><Badge variant={v.VerificationStatus === 'Verified' ? 'success' : v.VerificationStatus === 'Rejected' ? 'error' : 'warning'}>{v.VerificationStatus}</Badge></td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    {v.VerificationStatus !== 'Verified' && (
                      <Button variant="glass" size="sm" onClick={() => verify(v.VehicleID, 'Verified')}>Approve</Button>
                    )}
                    <Button variant="glass" size="sm" onClick={() => deleteVehicle(v.VehicleID)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function RidesTab() {
  const [rides, setRides] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  
  const fetchRides = () => {
    const params = statusFilter ? { status: statusFilter } : {};
    adminAPI.getRides(params).then(r => setRides(r.data.data)).catch(console.error);
  };
  useEffect(() => { fetchRides(); }, [statusFilter]);

  const cancelRide = async (id: number) => {
    if (!confirm('Cancel this ride?')) return;
    try {
      await adminAPI.cancelRide(id);
      toast.success('Ride cancelled');
      fetchRides();
    } catch { toast.error('Failed to cancel'); }
  };

  return (
    <GlassCard tier={1} className="p-6 h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display">Ride Management</h3>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-glass-bg border border-glass-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-amber-500">
          <option value="">All Status</option>
          <option value="Requested">Requested</option>
          <option value="Accepted">Accepted</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <div className="flex-1 overflow-auto rounded-radius-md border border-glass-border">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-glass-bg-light text-text-muted border-b border-glass-border sticky top-0">
            <tr>
              <th className="p-4 font-medium">Ride ID</th>
              <th className="p-4 font-medium">Rider</th>
              <th className="p-4 font-medium">Driver</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Fare</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((r) => (
              <tr key={r.RideID} className="border-b border-glass-border hover:bg-white/5 transition-colors">
                <td className="p-4">#{r.RideID}</td>
                <td className="p-4 text-white">{r.RiderName}</td>
                <td className="p-4">{r.DriverName || 'Unassigned'}</td>
                <td className="p-4"><Badge variant={r.RideStatus === 'Completed' ? 'success' : r.RideStatus === 'Cancelled' ? 'error' : 'warning'}>{r.RideStatus}</Badge></td>
                <td className="p-4 text-amber-500">PKR {r.Fare}</td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    {r.RideStatus !== 'Completed' && r.RideStatus !== 'Cancelled' && (
                      <Button variant="glass" size="sm" onClick={() => cancelRide(r.RideID)}>Cancel</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function RatingsTab() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  
  const fetchRatings = () => {
    const params = filter === 'flagged' ? { flagged: 'true' } : {};
    adminAPI.getRatings(params).then(r => setRatings(r.data.data)).catch(console.error);
  };
  useEffect(() => { fetchRatings(); }, [filter]);

  const deleteRating = async (rating: any) => {
    if (!confirm('Delete this rating?')) return;
    try {
      await adminAPI.deleteRating(rating.RideID, rating.RatedBy);
      toast.success('Rating deleted');
      fetchRatings();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <GlassCard tier={1} className="p-6 h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display">Ratings & Reviews Moderation</h3>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-glass-bg border border-glass-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-amber-500">
          <option value="">All Ratings</option>
          <option value="flagged">Flagged (≤2 stars)</option>
        </select>
      </div>
      <div className="flex-1 overflow-auto rounded-radius-md border border-glass-border">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-glass-bg-light text-text-muted border-b border-glass-border sticky top-0">
            <tr>
              <th className="p-4 font-medium">Ride ID</th>
              <th className="p-4 font-medium">Rater</th>
              <th className="p-4 font-medium">Rated User</th>
              <th className="p-4 font-medium">Score</th>
              <th className="p-4 font-medium">Comment</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((r) => (
              <tr key={`${r.RideID}-${r.RatedBy}`} className="border-b border-glass-border hover:bg-white/5 transition-colors">
                <td className="p-4">#{r.RideID}</td>
                <td className="p-4 text-white">{r.RaterName}</td>
                <td className="p-4">{r.RatedUserName}</td>
                <td className="p-4">
                  <Badge variant={r.Score >= 4 ? 'success' : r.Score >= 3 ? 'warning' : 'error'}>
                    {r.Score} ★
                  </Badge>
                </td>
                <td className="p-4 text-text-muted max-w-xs truncate">{r.Comment}</td>
                <td className="p-4 text-right">
                  <Button variant="glass" size="sm" onClick={() => deleteRating(r)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function ComplaintsTab() {
  const [complaints, setComplaints] = useState<any[]>([]);
  useEffect(() => { adminAPI.getComplaints().then(r => setComplaints(r.data.data)).catch(console.error); }, []);

  const resolve = async (id: number) => {
    try {
      await adminAPI.updateComplaint(id, 'Resolved');
      toast.success('Complaint resolved');
      adminAPI.getComplaints().then(r => setComplaints(r.data.data));
    } catch { toast.error('Failed'); }
  };

  return (
    <GlassCard tier={1} className="p-6 h-[80vh] flex flex-col">
      <h3 className="text-xl font-display mb-6">Complaints</h3>
      <div className="flex-1 overflow-auto rounded-radius-md border border-glass-border">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-glass-bg-light text-text-muted border-b border-glass-border sticky top-0">
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Filed By</th>
              <th className="p-4 font-medium">Description</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.ComplaintID} className="border-b border-glass-border hover:bg-white/5 transition-colors">
                <td className="p-4">#{c.ComplaintID}</td>
                <td className="p-4">{c.FiledBy} <span className="text-text-muted text-xs">({c.Role})</span></td>
                <td className="p-4 whitespace-normal max-w-xs">{c.Description}</td>
                <td className="p-4"><Badge variant={c.ComplaintStatus === 'Resolved' ? 'success' : c.ComplaintStatus === 'Dismissed' ? 'error' : 'warning'}>{c.ComplaintStatus}</Badge></td>
                <td className="p-4 text-right">
                  {c.ComplaintStatus === 'Open' && (
                    <Button variant="glass" size="sm" onClick={() => resolve(c.ComplaintID)}>Resolve</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

