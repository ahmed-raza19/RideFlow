import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ConnectionStatusProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  onReconnect?: () => void;
  className?: string;
}

export function ConnectionStatus({ 
  connectionStatus, 
  onReconnect, 
  className = '' 
}: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi size={16} className="text-success" />,
          color: 'success',
          text: 'Connected',
          description: 'Real-time updates active'
        };
      case 'connecting':
        return {
          icon: <RefreshCw size={16} className="text-amber-500 animate-spin" />,
          color: 'warning',
          text: 'Connecting...',
          description: 'Establishing connection'
        };
      case 'disconnected':
        return {
          icon: <WifiOff size={16} className="text-error" />,
          color: 'error',
          text: 'Disconnected',
          description: 'Real-time updates unavailable'
        };
      default:
        return {
          icon: <AlertCircle size={16} className="text-text-muted" />,
          color: 'info',
          text: 'Unknown',
          description: 'Connection status unknown'
        };
    }
  };

  const config = getStatusConfig();

  if (connectionStatus === 'connected') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {config.icon}
          <span className="text-xs text-text-muted">{config.text}</span>
        </div>
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <Badge variant={config.color as any} className="flex items-center gap-1">
        {config.icon}
        <span className="text-xs">{config.text}</span>
      </Badge>
      
      {connectionStatus === 'disconnected' && onReconnect && (
        <Button
          variant="glass"
          size="sm"
          onClick={onReconnect}
          className="h-6 px-2 text-xs"
        >
          Reconnect
        </Button>
      )}
      
      <div className="hidden md:block">
        <span className="text-xs text-text-muted ml-2">
          {config.description}
        </span>
      </div>
    </motion.div>
  );
}

// Full connection status panel for dashboard
export function ConnectionPanel({ 
  isConnected, 
  connectionStatus, 
  onReconnect,
  lastEvent 
}: { 
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  onReconnect?: () => void;
  lastEvent?: { type: string; data: any; timestamp: Date } | null;
}) {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi size={24} className="text-success" />,
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          title: 'Real-time Connected',
          description: 'All live features are active'
        };
      case 'connecting':
        return {
          icon: <RefreshCw size={24} className="text-amber-500 animate-spin" />,
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          title: 'Connecting...',
          description: 'Establishing real-time connection'
        };
      case 'disconnected':
        return {
          icon: <WifiOff size={24} className="text-error" />,
          bgColor: 'bg-error/10',
          borderColor: 'border-error/30',
          title: 'Disconnected',
          description: 'Real-time features unavailable'
        };
      default:
        return {
          icon: <AlertCircle size={24} className="text-text-muted" />,
          bgColor: 'bg-glass-bg-light',
          borderColor: 'border-glass-border',
          title: 'Unknown Status',
          description: 'Connection status unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h4 className="text-white font-medium">{config.title}</h4>
            <p className="text-sm text-text-muted">{config.description}</p>
          </div>
        </div>
        
        {connectionStatus === 'disconnected' && onReconnect && (
          <Button variant="glass" size="sm" onClick={onReconnect}>
            <RefreshCw size={16} className="mr-2" />
            Reconnect
          </Button>
        )}
      </div>
      
      {lastEvent && (
        <div className="mt-3 pt-3 border-t border-glass-border">
          <div className="text-xs text-text-muted mb-1">Last Event:</div>
          <div className="text-sm text-white">
            <span className="font-mono bg-glass-bg-light px-2 py-1 rounded">
              {lastEvent.type}
            </span>
            <span className="text-text-muted ml-2">
              {lastEvent.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
      
      {isConnected && (
        <div className="mt-3 pt-3 border-t border-glass-border">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span>Live updates enabled</span>
          </div>
        </div>
      )}
    </div>
  );
}
