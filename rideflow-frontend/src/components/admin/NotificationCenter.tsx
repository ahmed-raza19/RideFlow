import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, DollarSign, Shield, Car, Info, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { adminAPI } from '../../lib/admin';
import { fadeSlideUp } from '../../motion/presets';

interface AdminNotificationData {
  lowRatedDrivers: Array<{
    DriverID: number;
    DriverName: string;
    TotalRatings: number;
    AvgRating: number;
  }>;
  unverifiedDrivers: number;
  pendingVehicles: number;
  openComplaints: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'RideUpdate' | 'Payment' | 'Promo' | 'Safety' | 'System' | 'Ride' | 'Verification';
  isRead: boolean;
  createdAt: string;
  relatedId?: number;
  actionUrl?: string;
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const processNotifications = (data: AdminNotificationData): Notification[] => {
    const notifications: Notification[] = [];
    
    // Add low-rated drivers notifications
    data.lowRatedDrivers.forEach((driver) => {
      notifications.push({
        id: `low-rated-${driver.DriverID}`,
        title: 'Low Rated Driver',
        message: `${driver.DriverName} has an average rating of ${driver.AvgRating} from ${driver.TotalRatings} ratings`,
        type: 'Safety',
        isRead: false,
        createdAt: new Date().toISOString(),
        relatedId: driver.DriverID
      });
    });
    
    // Add unverified drivers notification
    if (data.unverifiedDrivers > 0) {
      notifications.push({
        id: 'unverified-drivers',
        title: 'Unverified Drivers',
        message: `${data.unverifiedDrivers} drivers pending verification`,
        type: 'Verification',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
    
    // Add pending vehicles notification
    if (data.pendingVehicles > 0) {
      notifications.push({
        id: 'pending-vehicles',
        title: 'Pending Vehicle Verification',
        message: `${data.pendingVehicles} vehicles pending verification`,
        type: 'Verification',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
    
    // Add open complaints notification
    if (data.openComplaints > 0) {
      notifications.push({
        id: 'open-complaints',
        title: 'Open Complaints',
        message: `${data.openComplaints} complaints require attention`,
        type: 'Safety',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
    
    return notifications;
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getNotifications();
      const data = response.data || {};
      const processedNotifications = processNotifications(data);
      setNotifications(processedNotifications);
      setUnreadCount(processedNotifications.filter(n => !n.isRead).length);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: string) => {
    // Admin API doesn't have mark read endpoint, just update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Ride':
      case 'RideUpdate':
        return <Car size={16} className="text-blue-500" />;
      case 'Payment':
        return <DollarSign size={16} className="text-green-500" />;
      case 'Promo':
        return <Tag size={16} className="text-purple-500" />;
      case 'Verification':
        return <CheckCircle size={16} className="text-amber-500" />;
      case 'Safety':
        return <Shield size={16} className="text-red-500" />;
      case 'System':
        return <Info size={16} className="text-gray-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-amber-500/10 transition-colors"
      >
        <Bell size={20} className="text-amber-700" />
        {unreadCount > 0 && (
          <Badge 
            variant="error" 
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0 rounded-full"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              variants={fadeSlideUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white border border-champagne rounded-lg shadow-xl z-20 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-champagne/30">
                <h3 className="text-lg font-display text-amber-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="glass" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                  <Button variant="glass" size="sm" onClick={() => setIsOpen(false)}>
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[400px]">
                {loading ? (
                  <div className="p-8 text-center text-amber-700/70">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-amber-700/70">
                    <Bell size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-champagne/20">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-amber-50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-amber-100/50' : ''
                        }`}
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${
                                !notification.isRead ? 'text-amber-900' : 'text-amber-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                            <p className="text-sm text-amber-800/70 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-amber-700/60">
                                {formatTime(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <Button variant="glass" size="sm" onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}>
                                  Mark read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Notification card for displaying in other parts of the app
interface NotificationCardProps {
  notification: Notification;
  onRead?: (id: string) => void;
}

export function NotificationCard({ notification, onRead }: NotificationCardProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Ride':
      case 'RideUpdate':
        return <Car size={20} className="text-blue-500" />;
      case 'Payment':
        return <DollarSign size={20} className="text-green-500" />;
      case 'Promo':
        return <Tag size={20} className="text-purple-500" />;
      case 'Verification':
        return <CheckCircle size={20} className="text-amber-500" />;
      case 'Safety':
        return <Shield size={20} className="text-red-500" />;
      case 'System':
        return <Info size={20} className="text-gray-500" />;
      default:
        return <AlertCircle size={20} className="text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <GlassCard tier={1} className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${
              !notification.isRead ? 'text-amber-900' : 'text-amber-700'
            }`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
            )}
          </div>
          <p className="text-sm text-amber-800/70 mt-1">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-amber-700/60">
              {formatTime(notification.createdAt)}
            </span>
            {!notification.isRead && onRead && (
              <Button 
                variant="glass" 
                size="sm" 
                onClick={() => onRead(notification.id)}
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
