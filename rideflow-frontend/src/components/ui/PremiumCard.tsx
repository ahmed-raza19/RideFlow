import { motion } from 'framer-motion';
import { Check, X, Clock, Zap } from 'lucide-react';

interface PremiumCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'featured' | 'premium' | 'status';
  status?: 'active' | 'inactive' | 'pending' | 'completed' | 'error';
  className?: string;
  glowing?: boolean;
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function PremiumCard({ 
  children, 
  variant = 'default', 
  status, 
  className = '', 
  glowing = false,
  hover = true,
  selected = false,
  onClick
}: PremiumCardProps) {
  const getVariantStyles = () => {
    const base = 'relative overflow-hidden transition-all duration-500';
    
    switch (variant) {
      case 'featured':
        return `${base} bg-gradient-to-br from-amber-500/10 via-gold-500/10 to-champagne/10 border-2 border-amber-500/30 shadow-glow-lg`;
      case 'premium':
        return `${base} bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 border-2 border-purple-500/30 shadow-glow-lg`;
      case 'status':
        return `${base} bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-500/30 shadow-glow-lg`;
      default:
        return `${base} bg-glass-white border-glass-border hover:border-soft-gold/30`;
    }
  };

  const getStatusIndicator = () => {
    if (!status) return null;
    
    const statusConfig = {
      active: { color: 'bg-green-500', icon: <Check size={12} />, pulse: true },
      inactive: { color: 'bg-gray-500', icon: <X size={12} />, pulse: false },
      pending: { color: 'bg-amber-500', icon: <Clock size={12} />, pulse: true },
      completed: { color: 'bg-blue-500', icon: <Check size={12} />, pulse: false },
      error: { color: 'bg-red-500', icon: <X size={12} />, pulse: true }
    };
    
    const config = statusConfig[status];
    
    return (
      <div className="absolute top-4 right-4 z-10">
        <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white ${config.pulse ? 'animate-pulse' : ''}`}>
          {config.icon}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className={`${getVariantStyles()} ${className} ${selected ? 'ring-2 ring-soft-gold/50 scale-105' : ''}`}
      whileHover={hover ? { y: -8, scale: 1.02, rotateX: 2 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
      onClick={onClick}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-soft-gold/20 to-transparent animate-pulse" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, transparent 50%, rgba(255, 215, 0, 0.1) 51%)',
        }} />
      </div>

      {/* Glowing Border Effect */}
      {glowing && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500 via-gold-500 to-champagne opacity-20 blur-md animate-pulse" />
      )}

      {/* Selected Indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-soft-gold rounded-full flex items-center justify-center shadow-glow-lg"
        >
          <Check size={16} className="text-text-primary" />
        </motion.div>
      )}

      {/* Status Indicator */}
      {getStatusIndicator()}

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>

      {/* Hover Effect Overlay */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-soft-gold/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      )}
    </motion.div>
  );
}

interface StatusCircleProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusCircle({ status, size = 'md', showLabel = false, className = '' }: StatusCircleProps) {
  const sizeConfig = {
    sm: { circle: 'w-3 h-3', text: 'text-xs' },
    md: { circle: 'w-4 h-4', text: 'text-sm' },
    lg: { circle: 'w-6 h-6', text: 'text-base' }
  };

  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online', pulse: true },
    offline: { color: 'bg-gray-500', label: 'Offline', pulse: false },
    busy: { color: 'bg-red-500', label: 'Busy', pulse: true },
    away: { color: 'bg-amber-500', label: 'Away', pulse: false }
  };

  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${sizes.circle}`}>
        <div className={`w-full h-full rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
        <div className={`absolute inset-0 rounded-full ${config.color} animate-ping opacity-75`} />
      </div>
      {showLabel && (
        <span className={`${sizes.text} text-text-muted capitalize`}>{config.label}</span>
      )}
    </div>
  );
}

interface FeatureBoxProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status?: 'active' | 'inactive';
  onClick?: () => void;
  className?: string;
}

export function FeatureBox({ icon, title, description, status, onClick, className = '' }: FeatureBoxProps) {
  return (
    <motion.div
      className={`
        relative p-6 rounded-2xl border-2 border-glass-border bg-glass-bg-light
        hover:border-soft-gold/50 hover:bg-glass-white/20 transition-all duration-300
        cursor-pointer group
        ${status === 'active' ? 'ring-2 ring-emerald-500/50 bg-emerald-500/10' : ''}
        ${className}
      `}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Icon Container */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-soft-gold/20 to-champagne/20 border border-soft-gold/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>

      {/* Content */}
      <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-soft-gold transition-colors duration-300">
        {title}
      </h4>
      <p className="text-text-muted text-sm leading-relaxed">
        {description}
      </p>

      {/* Status Indicator */}
      {status === 'active' && (
        <div className="absolute top-4 right-4">
          <StatusCircle status="online" size="sm" />
        </div>
      )}

      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-soft-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}

interface StatBoxProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  className?: string;
}

export function StatBox({ value, label, icon, trend, change, className = '' }: StatBoxProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <Zap className="text-green-500" size={16} />;
      case 'down':
        return <Zap className="text-red-500 rotate-180" size={16} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`
        p-6 rounded-2xl bg-gradient-to-br from-glass-bg-light to-glass-bg
        border border-glass-border hover:border-soft-gold/30
        transition-all duration-300
        ${className}
      `}
      whileHover={{ y: -2, scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-soft-gold/20 to-champagne/20 border border-soft-gold/30 flex items-center justify-center">
            {icon}
          </div>
        )}
        {trend && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-text-muted'
            }`}>
              {change}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-3xl font-bold text-white">
          {value}
        </div>
        <div className="text-sm text-text-muted">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
