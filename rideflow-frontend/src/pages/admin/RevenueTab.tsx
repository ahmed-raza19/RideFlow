import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Activity, Users, TrendingUp } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { adminAPI } from '../../lib/admin';
import { Skeleton } from '../../components/ui/Skeleton';

export function RevenueTab() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getRevenueOverview(dateRange.from, dateRange.to);
        setRevenueData(response.data);
      } catch (error) {
        console.error('Failed to fetch revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-8"
    >
      {/* Header with Date Filter */}
      <GlassCard tier={1} className="p-6 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-3xl font-display text-text-primary font-bold mb-2">Customer Spending Analytics</h3>
            <p className="text-text-secondary">Total revenue from all customer transactions</p>
          </div>
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-glass-white border border-glass-border hover:border-soft-gold/50 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse shadow-glow" />
            <span className="text-sm font-medium text-text-primary">Live Data</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg backdrop-blur-xl bg-glass-white border border-glass-border hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg backdrop-blur-xl bg-glass-white border border-glass-border hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setDateRange({ from: '', to: '' })}
              variant="glass"
              className="px-6 py-2"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} tier={2} className="p-6 backdrop-blur-xl bg-glass-white-strong border-glass-border">
              <Skeleton variant="card" height="120px" />
            </GlassCard>
          ))}
        </div>
      ) : revenueData ? (
        <>
          {/* Key Revenue Metrics */}
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
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(revenueData.overview.TotalRevenue)}</p>
                <div className="mt-2 text-xs text-amber-600 font-medium">All customer payments</div>
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
                    <Activity className="w-6 h-6" />
                  </div>
                  <motion.div 
                    className="w-2 h-2 bg-admin-success rounded-full animate-pulse shadow-glow"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Total Transactions</h3>
                <p className="text-2xl font-bold text-text-primary">{revenueData.overview.TotalTransactions.toLocaleString()}</p>
                <div className="mt-2 text-xs text-admin-success font-medium">Completed payments</div>
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
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <motion.div 
                    className="w-2 h-2 bg-admin-cyan rounded-full animate-pulse shadow-glow"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                </div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Net Revenue</h3>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(revenueData.overview.NetRevenue)}</p>
                <div className="mt-2 text-xs text-admin-cyan font-medium">After discounts</div>
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
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <motion.div 
                    className="w-2 h-2 bg-admin-warning rounded-full animate-pulse shadow-glow"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  />
                </div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Average Transaction</h3>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(revenueData.overview.AverageTransaction)}</p>
                <div className="mt-2 text-xs text-admin-warning font-medium">Per transaction</div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Top Customers Table */}
          <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-text-primary font-bold">Top Customers by Spending</h3>
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-2 h-2 bg-amber-600 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm text-text-secondary">All time</span>
              </div>
            </div>
            <div className="overflow-auto rounded-2xl border border-glass-border backdrop-blur-xl bg-glass-white/30">
              <table className="w-full text-left">
                <thead className="bg-glass-bg-light text-text-muted border-b border-glass-border sticky top-0">
                  <tr>
                    <th className="p-4 font-medium">Rank</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Total Spent</th>
                    <th className="p-4 font-medium">Transactions</th>
                    <th className="p-4 font-medium">Average</th>
                    <th className="p-4 font-medium">Last Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.topCustomers?.map((customer: any, index: number) => (
                    <motion.tr
                      key={customer.UserID}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-glass-border/50 hover:bg-glass-white/30 transition-all duration-300"
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm font-medium text-amber-600 bg-amber-600/10 px-2 py-1 rounded-lg">#{index + 1}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-semibold text-text-primary">{customer.CustomerName}</div>
                          <div className="text-sm text-text-secondary">{customer.Email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-amber-600">{formatCurrency(customer.TotalSpent)}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-text-primary">{customer.TransactionCount}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-text-primary">{formatCurrency(customer.AverageSpent)}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-text-primary text-sm">{formatDate(customer.LastTransaction)}</div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Payment Methods and Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard tier={1} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border hover:border-soft-gold/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-display text-text-primary font-bold">Revenue by Payment Method</h3>
                <div className="flex items-center gap-2">
                  <motion.div 
                    className="w-2 h-2 bg-amber-600 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm text-text-secondary">Breakdown</span>
                </div>
              </div>
              <div className="space-y-4">
                {revenueData.byPaymentMethod?.map((method: any, index: number) => (
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
                        <div className="text-amber-600 font-bold text-lg">{formatCurrency(method.Revenue)}</div>
                        <div className="text-sm text-admin-success">{method.Percentage}%</div>
                      </div>
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
                    <span className="text-text-secondary">Total Discounts Given:</span>
                    <span className="font-semibold text-admin-warning">{formatCurrency(revenueData.overview.TotalDiscounts)}</span>
                  </div>
                </div>
                <div className="p-4 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">First Transaction:</span>
                    <span className="font-semibold text-text-primary">
                      {revenueData.overview.FirstTransaction ? formatDate(revenueData.overview.FirstTransaction) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="p-4 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Last Transaction:</span>
                    <span className="font-semibold text-text-primary">
                      {revenueData.overview.LastTransaction ? formatDate(revenueData.overview.LastTransaction) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="p-4 backdrop-blur-xl bg-glass-white border border-glass-border rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Daily Average (30 days):</span>
                    <span className="font-semibold text-admin-cyan">
                      {revenueData.dailyTrend?.length > 0 
                        ? formatCurrency(revenueData.dailyTrend.reduce((sum: number, day: any) => sum + day.Revenue, 0) / revenueData.dailyTrend.length)
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <GlassCard tier={1} className="p-8 inline-block">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-soft-gold/20 to-champagne/20 border-2 border-soft-gold/30 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-text-secondary">Unable to load revenue data.</p>
          </GlassCard>
        </div>
      )}
    </motion.div>
  );
}
