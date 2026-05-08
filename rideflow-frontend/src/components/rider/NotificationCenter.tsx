import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, DollarSign, Shield, Car, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { riderAPI } from '../../lib/rider';
import { fadeSlideUp } from '../../motion/presets';

interface Notification {
  NotificationID: number;
  Title: string;
  Message: string;
  NotificationType: 'RideUpdate' | 'Payment' | 'Promo' | 'Safety' | 'System' | 'Ride' | 'Verification';
  IsRead: boolean;
  CreatedAt: string;
  RelatedID?: number;
  ActionURL?: string;
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await riderAPI.getNotifications();
      const data = response.data?.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.IsRead).length);
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

  const markAsRead = async (notificationId: number) => {
    try {
      await riderAPI.markNotificationsRead([notificationId]);
      setNotifications(prev => 
        prev.map(n => n.NotificationID === notificationId ? { ...n, IsRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await riderAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await riderAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.NotificationID !== notificationId));
      const deleted = notifications.find(n => n.NotificationID === notificationId);
      if (deleted && !deleted.IsRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Ride':
      case 'RideUpdate':
        return <Car size={16} className="text-blue-500" />;
      case 'Payment':
        return <DollarSign size={16} className="text-green-500" />;
      case 'Promo':
        return <CheckCircle size={16} className="text-purple-500" />;
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
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell size={20} className="text-white" />
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
              className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-bg-surface border border-glass-border rounded-lg shadow-xl z-20 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-glass-border">
                <h3 className="text-lg font-display text-white">Notifications</h3>
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
                  <div className="p-8 text-center text-text-muted">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-text-muted">
                    <Bell size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.NotificationID}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-glass-bg-light cursor-pointer transition-colors ${
                          !notification.IsRead ? 'bg-amber-500/5' : ''
                        }`}
                        onClick={() => !notification.IsRead && markAsRead(notification.NotificationID)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.NotificationType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${
                                !notification.IsRead ? 'text-white' : 'text-text-secondary'
                              }`}>
                                {notification.Title}
                              </h4>
                              {!notification.IsRead && (
                                <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                            <p className="text-sm text-text-muted mt-1 line-clamp-2">
                              {notification.Message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-text-muted">
                                {formatTime(notification.CreatedAt)}
                              </span>
                              <div className="flex items-center gap-2">
                                {!notification.IsRead && (
                                  <Button variant="glass" size="sm" onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.NotificationID);
                                  }}>
                                    Mark read
                                  </Button>
                                )}
                                <Button variant="icon" className="w-6 h-6" onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.NotificationID);
                                }}>
                                  <X size={14} />
                                </Button>
                              </div>
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
  onRead?: (id: number) => void;
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
        return <CheckCircle size={20} className="text-purple-500" />;
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
          {getNotificationIcon(notification.NotificationType)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${
              !notification.IsRead ? 'text-white' : 'text-text-secondary'
            }`}>
              {notification.Title}
            </h4>
            {!notification.IsRead && (
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
            )}
          </div>
          <p className="text-sm text-text-muted mt-1">
            {notification.Message}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-text-muted">
              {formatTime(notification.CreatedAt)}
            </span>
            {!notification.IsRead && onRead && (
              <Button 
                variant="glass" 
                size="sm" 
                onClick={() => onRead(notification.NotificationID)}
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
