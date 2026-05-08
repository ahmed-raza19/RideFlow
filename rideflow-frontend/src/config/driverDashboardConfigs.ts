import type { DashboardConfig } from '../components/driver/DynamicDashboard';

export const driverDashboardConfigs: Record<string, DashboardConfig[]> = {
  overview: [
    {
      id: '1',
      title: 'Total Rides',
      type: 'stats',
      dataSource: 'driver-rides',
      refreshInterval: 10000, // 10 seconds for real-time updates
    },
  ],
  earnings: [
    {
      id: '1',
      title: 'Earnings Overview',
      type: 'metric',
      dataSource: 'earnings-overview',
      refreshInterval: 30000,
    },
    {
      id: '2',
      title: 'Daily Earnings',
      type: 'chart',
      dataSource: 'daily-earnings',
      refreshInterval: 60000,
      filters: { period: '30' },
    },
    {
      id: '3',
      title: 'Wallet Balance',
      type: 'stats',
      dataSource: 'driver-wallet',
      refreshInterval: 30000,
    },
    {
      id: '4',
      title: 'Earnings Forecast',
      type: 'chart',
      dataSource: 'earnings-forecast',
      refreshInterval: 300000, // 5 minutes
      filters: { period: '7' },
    },
  ],
  analytics: [
    {
      id: '1',
      title: 'Performance Metrics',
      type: 'metric',
      dataSource: 'performance-metrics',
      refreshInterval: 60000,
    },
    {
      id: '2',
      title: 'Peak Hours',
      type: 'chart',
      dataSource: 'peak-hours',
      refreshInterval: 300000,
    },
    {
      id: '3',
      title: 'Location Hotspots',
      type: 'list',
      dataSource: 'location-hotspots',
      refreshInterval: 300000,
      filters: { limit: '5' },
    },
    {
      id: '4',
      title: 'Popular Routes',
      type: 'list',
      dataSource: 'popular-routes',
      refreshInterval: 300000,
      filters: { limit: '5' },
    },
    {
      id: '5',
      title: 'Weekly Earnings Trend',
      type: 'chart',
      dataSource: 'weekly-earnings',
      refreshInterval: 300000,
    },
    {
      id: '6',
      title: 'Monthly Performance',
      type: 'chart',
      dataSource: 'monthly-earnings',
      refreshInterval: 600000, // 10 minutes
    },
  ],
  live: [
    {
      id: '1',
      title: 'Total Rides',
      type: 'stats',
      dataSource: 'driver-rides',
      refreshInterval: 10000, // 10 seconds for real-time updates
    },
    {
      id: '2',
      title: 'Completed Rides',
      type: 'stats',
      dataSource: 'earnings-overview',
      refreshInterval: 10000,
    },
    {
      id: '3',
      title: 'Net Earnings',
      type: 'stats',
      dataSource: 'earnings-overview',
      refreshInterval: 10000,
    },
    {
      id: '4',
      title: 'Average Rating',
      type: 'stats',
      dataSource: 'performance-metrics',
      refreshInterval: 10000,
    },
    {
      id: '5',
      title: 'Incoming Rides',
      type: 'list',
      dataSource: 'incoming-rides',
      refreshInterval: 10000, // 10 seconds for real-time updates
    },
    {
      id: '6',
      title: 'Recent Rides',
      type: 'list',
      dataSource: 'driver-rides',
      refreshInterval: 30000,
    },
    {
      id: '7',
      title: 'Current Status',
      type: 'metric',
      dataSource: 'performance-metrics',
      refreshInterval: 15000,
    },
    {
      id: '8',
      title: 'Recent Ratings',
      type: 'list',
      dataSource: 'driver-ratings',
      refreshInterval: 45000,
    },
  ],
};
