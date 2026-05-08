import React, { useState, useEffect } from 'react';
import { driverAPI } from '../../lib/driver';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  MapPin,
  Clock,
  Star
} from 'lucide-react';

interface EarningsOverview {
  TotalRides: number;
  CompletedRides: number;
  GrossEarnings: number;
  TotalCommission: number;
  NetEarnings: number;
  AverageFare: number;
  MinimumFare: number;
  MaximumFare: number;
  TotalDistance: number;
  AverageDistance: number;
  WalletBalance: number;
  CommissionRate: number;
}

interface DailyEarning {
  Date: string;
  TotalRides: number;
  GrossEarnings: number;
  NetEarnings: number;
  TotalDistance: number;
  AverageFare: number;
}

interface PerformanceMetrics {
  TotalRides: number;
  CompletedRides: number;
  CancelledRides: number;
  CompletionRate: number;
  NetEarnings: number;
  AverageEarningsPerRide: number;
  TotalDistance: number;
  AverageDistancePerRide: number;
  AverageRideDuration: number;
  AverageRating: number;
  UniqueRaters: number;
  KilometersPerHour: number;
}

type Period = 'daily' | 'weekly' | 'monthly';

export const EarningsDashboard: React.FC = () => {
  const [overview, setOverview] = useState<EarningsOverview | null>(null);
  const [dailyData, setDailyData] = useState<DailyEarning[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('daily');

  useEffect(() => {
    loadEarningsData();
  }, [period]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const days = period === 'daily' ? 30 : period === 'weekly' ? 84 : 365;
      
      const [overviewRes, dailyRes, performanceRes] = await Promise.all([
        driverAPI.analytics.getEarningsOverview(),
        driverAPI.analytics.getDailyEarnings(days),
        driverAPI.analytics.getPerformanceMetrics()
      ]);

      setOverview(overviewRes.data.data);
      setDailyData(dailyRes.data.data || []);
      setPerformance(performanceRes.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      await driverAPI.analytics.exportAnalytics('earnings', 'csv');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Export failed');
    }
  };

  const formatCurrency = (amount: number) => `PKR ${amount?.toFixed(2) || '0.00'}`;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h2>
          <p className="text-gray-600">Track your performance and earnings</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Last 30 Days</option>
            <option value="weekly">Last 12 Weeks</option>
            <option value="monthly">Last 12 Months</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
          <button
            onClick={loadEarningsData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Earnings"
          value={formatCurrency(overview?.NetEarnings || 0)}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          trend={dailyData.length > 1 ? 
            ((dailyData[dailyData.length - 1]?.NetEarnings - dailyData[dailyData.length - 2]?.NetEarnings) > 0 ? 'up' : 'down') : 
            'neutral'
          }
          bgColor="bg-green-100"
        />
        <StatCard
          title="Completed Rides"
          value={overview?.CompletedRides?.toString() || '0'}
          icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          trend="neutral"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Average Fare"
          value={formatCurrency(overview?.AverageFare || 0)}
          icon={<DollarSign className="w-5 h-5 text-purple-600" />}
          trend="neutral"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Total Distance"
          value={`${(overview?.TotalDistance || 0).toFixed(1)} km`}
          icon={<MapPin className="w-5 h-5 text-orange-600" />}
          trend="neutral"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Earnings Breakdown</h3>
          <div className="space-y-4">
            <BreakdownRow 
              label="Gross Earnings" 
              value={formatCurrency(overview?.GrossEarnings || 0)}
              color="text-gray-900"
            />
            <BreakdownRow 
              label={`Platform Commission (${overview?.CommissionRate || 10}%)`}
              value={`-${formatCurrency(overview?.TotalCommission || 0)}`}
              color="text-red-600"
            />
            <div className="border-t pt-3">
              <BreakdownRow 
                label="Net Earnings" 
                value={formatCurrency(overview?.NetEarnings || 0)}
                color="text-green-600 font-semibold"
                large
              />
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <PerformanceItem
              label="Completion Rate"
              value={`${(performance?.CompletionRate || 0).toFixed(1)}%`}
              icon={<CheckCircle2 />}
            />
            <PerformanceItem
              label="Average Rating"
              value={(performance?.AverageRating || 0).toFixed(1)}
              icon={<Star className="w-4 h-4 text-yellow-500" />}
            />
            <PerformanceItem
              label="Avg Distance/Ride"
              value={`${(performance?.AverageDistancePerRide || 0).toFixed(1)} km`}
              icon={<MapPin className="w-4 h-4 text-gray-400" />}
            />
            <PerformanceItem
              label="Avg Duration"
              value={`${Math.round(performance?.AverageRideDuration || 0)} min`}
              icon={<Clock className="w-4 h-4 text-gray-400" />}
            />
          </div>
        </div>
      </div>

      {/* Daily Earnings Chart */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Earnings History</h3>
          </div>
          <span className="text-sm text-gray-500">{dailyData.length} days</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rides</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Gross</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Commission</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Net</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dailyData.slice(0, 10).map((day) => (
                <tr key={day.Date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {new Date(day.Date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{day.TotalRides}</td>
                  <td className="px-4 py-3 text-sm">PKR {day.GrossEarnings?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-red-600">
                    -PKR {(day.GrossEarnings - day.NetEarnings)?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">
                    PKR {day.NetEarnings?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">{day.TotalDistance?.toFixed(1)} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {dailyData.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No earnings data available</p>
          </div>
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-blue-200 text-sm">Total Rides</p>
            <p className="text-3xl font-bold">{overview?.TotalRides || 0}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Completed</p>
            <p className="text-3xl font-bold">{overview?.CompletedRides || 0}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Min Fare</p>
            <p className="text-3xl font-bold">PKR {overview?.MinimumFare?.toFixed(0) || 0}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Max Fare</p>
            <p className="text-3xl font-bold">PKR {overview?.MaximumFare?.toFixed(0) || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  bgColor: string;
}> = ({ title, value, icon, trend, bgColor }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-3 ${bgColor} rounded-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {trend !== 'neutral' && (
        <div className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
          {trend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
      )}
    </div>
  </div>
);

const BreakdownRow: React.FC<{
  label: string;
  value: string;
  color: string;
  large?: boolean;
}> = ({ label, value, color, large }) => (
  <div className={`flex justify-between items-center ${large ? 'text-lg' : ''}`}>
    <span className="text-gray-600">{label}</span>
    <span className={`font-medium ${color}`}>{value}</span>
  </div>
);

const PerformanceItem: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
    {icon}
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const CheckCircle2: React.FC = () => (
  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

export default EarningsDashboard;
