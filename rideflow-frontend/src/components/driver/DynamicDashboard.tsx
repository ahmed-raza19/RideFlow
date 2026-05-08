import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, DollarSign, Star, MapPin, TrendingUp } from 'lucide-react';
import { driverAPI } from '../../lib/driver';
import { fadeSlideUp } from '../../motion/presets';

export interface DashboardConfig {
  id: string;
  title: string;
  type: 'stats' | 'chart' | 'list' | 'metric';
  dataSource: string;
  refreshInterval?: number;
  layout?: {
    cols: number;
    rows: number;
  };
  filters?: {
    period?: string;
    limit?: string;
  };
}

export interface DynamicDashboardProps {
  config: DashboardConfig[];
  pageType: 'overview' | 'earnings' | 'analytics' | 'live';
}

export function DynamicDashboard({ config, pageType }: DynamicDashboardProps) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Fetch data for each dashboard item
  const fetchDashboardData = async (item: DashboardConfig) => {
    try {
      setLoading(prev => ({ ...prev, [item.id]: true }));
      
      let response;
      switch (item.dataSource) {
        case 'earnings-overview':
          response = await driverAPI.analytics.getEarningsOverview();
          break;
        case 'performance-metrics':
          response = await driverAPI.analytics.getPerformanceMetrics();
          break;
        case 'daily-earnings':
          response = await driverAPI.analytics.getDailyEarnings(item.filters?.period ? parseInt(item.filters.period) : undefined);
          break;
        case 'weekly-earnings':
          response = await driverAPI.analytics.getWeeklyEarnings();
          break;
        case 'monthly-earnings':
          response = await driverAPI.analytics.getMonthlyEarnings();
          break;
        case 'peak-hours':
          response = await driverAPI.analytics.getPeakHours();
          break;
        case 'location-hotspots':
          response = await driverAPI.analytics.getLocationHotspots(item.filters?.limit ? parseInt(item.filters.limit) : undefined);
          break;
        case 'popular-routes':
          response = await driverAPI.analytics.getPopularRoutes(item.filters?.limit ? parseInt(item.filters.limit) : undefined);
          break;
        case 'earnings-forecast':
          response = await driverAPI.analytics.getEarningsForecast(item.filters?.period ? parseInt(item.filters.period) : undefined);
          break;
        case 'driver-rides':
          response = await driverAPI.getMyRides();
          break;
        case 'driver-ratings':
          response = await driverAPI.getMyRatings();
          break;
        case 'driver-wallet':
          response = await driverAPI.getWallet();
          break;
        case 'incoming-rides':
          response = await driverAPI.getIncomingRides();
          break;
        default:
          response = { data: null };
      }
      
      setData(prev => ({ ...prev, [item.id]: response.data }));
    } catch (error) {
      console.error(`Failed to fetch data for ${item.id}:`, error);
      setData(prev => ({ ...prev, [item.id]: null }));
    } finally {
      setLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    config.forEach(item => {
      fetchDashboardData(item);
      
      // Set up refresh interval if specified
      if (item.refreshInterval && item.refreshInterval > 0) {
        const interval = setInterval(() => {
          fetchDashboardData(item);
        }, item.refreshInterval);
        
        return () => clearInterval(interval);
      }
    });
  }, [config]);

  // Render dashboard item based on type
  const renderDashboardItem = (item: DashboardConfig) => {
    const itemData = data[item.id];
    const isLoading = loading[item.id];

    if (isLoading) {
      return (
        <div className="bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg p-6 shadow-glow">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    if (!itemData) {
      return (
        <div className="bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg p-6 shadow-glow">
          <div className="text-center text-text-muted">
            Failed to load data
          </div>
        </div>
      );
    }

    switch (item.type) {
      case 'stats':
        return <StatsCard item={item} data={itemData} />;
      case 'chart':
        return <ChartCard item={item} data={itemData} />;
      case 'list':
        return <ListCard item={item} data={itemData} />;
      case 'metric':
        return <MetricCard item={item} data={itemData} />;
      default:
        return <div>Unknown card type</div>;
    }
  };

  return (
    <motion.div
      variants={fadeSlideUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className={`grid gap-4 ${
        pageType === 'overview' ? 'grid-cols-1' :
        pageType === 'earnings' ? 'grid-cols-1 md:grid-cols-2' :
        pageType === 'analytics' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
        pageType === 'live' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
        'grid-cols-1'
      }`}>
        {config.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * parseInt(item.id) }}
            className={item.layout ? `col-span-${item.layout.cols}` : ''}
          >
            {renderDashboardItem(item)}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Stats Card Component
function StatsCard({ item, data }: { item: DashboardConfig; data: any }) {
  const getIcon = (title: string) => {
    if (title.includes('Rides') || title.includes('Activity')) return <Activity size={24} className="text-amber-500" />;
    if (title.includes('Earnings') || title.includes('Revenue')) return <DollarSign size={24} className="text-amber-500" />;
    if (title.includes('Rating') || title.includes('Star')) return <Star size={24} className="text-success" />;
    if (title.includes('Location') || title.includes('Route')) return <MapPin size={24} className="text-amber-600" />;
    return <TrendingUp size={24} className="text-amber-500" />;
  };

  const getValue = (title: string, data: any) => {
    if (title.includes('Total Rides')) return data.TotalRides || 0;
    if (title.includes('Completed Rides')) return data.CompletedRides || 0;
    if (title.includes('Net Earnings')) return `PKR ${(data.NetEarnings || 0).toFixed(2)}`;
    if (title.includes('Gross Earnings')) return `PKR ${(data.GrossEarnings || 0).toFixed(2)}`;
    if (title.includes('Average Rating')) return `★ ${(data.AverageRating || 0).toFixed(1)}`;
    if (title.includes('Completion Rate')) return `${(data.CompletionRate || 0).toFixed(1)}%`;
    if (title.includes('Average Distance')) return `${(data.AverageDistance || 0).toFixed(1)} km`;
    if (title.includes('Wallet Balance')) return `PKR ${(data.WalletBalance || 0).toFixed(2)}`;
    return data.value || 'N/A';
  };

  const getTrend = (title: string) => {
    // This would come from backend calculations
    if (title.includes('Rides')) return '+12 this month';
    if (title.includes('Earnings')) return '+15% this month';
    if (title.includes('Rating')) return '+0.2 this month';
    return '';
  };

  return (
    <div className="bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg p-4 hover:border-soft-gold/30 transition-all duration-300 shadow-glow">
      <div className="flex items-center gap-3 mb-2">
        {getIcon(item.title)}
        <div>
          <h3 className="text-lg font-display text-text-primary">{item.title}</h3>
          <p className="text-2xl font-display text-text-primary">{getValue(item.title, data)}</p>
        </div>
      </div>
      <div className="text-sm text-amber-600">{getTrend(item.title)}</div>
    </div>
  );
}

// Chart Card Component
function ChartCard({ item, data }: { item: DashboardConfig; data: any }) {
  return (
    <div className="bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg p-6 shadow-glow">
      <h3 className="text-xl font-display bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold mb-4">
        {item.title}
      </h3>
      <div className="space-y-2">
        {Array.isArray(data) ? data.slice(0, 5).map((entry, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-text-muted">{entry.Date || entry.Period || entry.City || entry.PickupCity}</span>
            <span className="text-text-primary font-medium">
              {entry.NetEarnings ? `PKR ${entry.NetEarnings.toFixed(2)}` : 
               entry.TotalEarnings ? `PKR ${entry.TotalEarnings.toFixed(2)}` :
               entry.RideCount ? `${entry.RideCount} rides` :
               entry.PickupCount ? `${entry.PickupCount} pickups` : 'N/A'}
            </span>
          </div>
        )) : (
          <div className="text-center text-text-muted">No chart data available</div>
        )}
      </div>
    </div>
  );
}

// List Card Component
function ListCard({ item, data }: { item: DashboardConfig; data: any }) {
  return (
    <div className="bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg p-6 shadow-glow">
      <h3 className="text-xl font-display bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold mb-4">
        {item.title}
      </h3>
      <div className="space-y-3">
        {Array.isArray(data) ? data.slice(0, 5).map((entry, index) => (
          <div key={index} className="border-b border-glass-border pb-2 last:border-b-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-text-primary font-medium">
                  {entry.RiderName || entry.PickupCity || entry.City || `Item ${index + 1}`}
                </div>
                {entry.DropoffCity && (
                  <div className="text-sm text-text-muted">
                    {entry.PickupCity} → {entry.DropoffCity}
                  </div>
                )}
              </div>
              <div className="text-right">
                {entry.Fare && <div className="text-amber-600">PKR {entry.Fare}</div>}
                {entry.RouteCount && <div className="text-text-muted">{entry.RouteCount} trips</div>}
                {entry.Score && <div className="text-success">★ {entry.Score}</div>}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center text-text-muted">No list data available</div>
        )}
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ item, data }: { item: DashboardConfig; data: any }) {
  return (
    <div className="bg-glass-white/90 backdrop-blur-xl border border-glass-border rounded-lg p-6 shadow-glow">
      <h3 className="text-xl font-display bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold mb-4">
        {item.title}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data).slice(0, 4).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="text-2xl font-display text-text-primary">
              {typeof value === 'number' ? 
                (key.includes('Rate') || key.includes('Percentage')) ? `${value.toFixed(1)}%` :
                (key.includes('Earnings') || key.includes('Balance') || key.includes('Fare')) ? `PKR ${value.toFixed(2)}` :
                (key.includes('Distance')) ? `${value.toFixed(1)} km` :
                (key.includes('Rating')) ? `★ ${value.toFixed(1)}` :
                value.toFixed(0) :
                String(value)}
            </div>
            <div className="text-sm text-text-muted">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
