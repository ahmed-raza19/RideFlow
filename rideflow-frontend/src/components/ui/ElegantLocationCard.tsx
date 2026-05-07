import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Clock, Navigation, Check } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface ElegantLocationCardProps {
  location: {
    LocationID: number;
    LocationName: string;
    City: string;
    Street?: string;
  };
  onClick?: () => void;
  variant?: 'pickup' | 'dropoff' | 'default';
  isSelected?: boolean;
  className?: string;
}

export function ElegantLocationCard({
  location,
  onClick,
  variant = 'default',
  isSelected = false,
  className = ''
}: ElegantLocationCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'pickup':
        return {
          border: 'border-amber-500/30',
          hover: 'hover:border-amber-500/50',
          selected: 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent',
          icon: 'text-amber-500',
          accent: 'bg-amber-500'
        };
      case 'dropoff':
        return {
          border: 'border-emerald-500/30',
          hover: 'hover:border-emerald-500/50',
          selected: 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent',
          icon: 'text-emerald-500',
          accent: 'bg-emerald-500'
        };
      default:
        return {
          border: 'border-glass-border',
          hover: 'hover:border-soft-gold/30',
          selected: 'border-soft-gold/50 bg-gradient-to-br from-soft-gold/10 via-soft-gold/5 to-transparent',
          icon: 'text-soft-gold',
          accent: 'bg-soft-gold'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <GlassCard 
        tier={2} 
        className={`
          p-6 cursor-pointer transition-all duration-300 backdrop-blur-xl
          border-2 ${styles.border} ${styles.hover}
          ${isSelected ? styles.selected : ''}
          relative overflow-hidden group
        `}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl" />
        </div>

        {/* Selection Indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="absolute top-4 right-4 z-10"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-soft-gold to-champagne flex items-center justify-center shadow-glow">
                <Check size={16} className="text-text-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon Container */}
          <div className="flex items-start gap-4 mb-4">
            <motion.div
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
                ${isSelected 
                  ? variant === 'pickup' ? 'bg-amber-500/20' : 
                    variant === 'dropoff' ? 'bg-emerald-500/20' : 
                    'bg-soft-gold/20'
                  : 'bg-glass-bg-light border border-glass-border'}
                ${isSelected ? 'border ' + styles.accent + '/50' : ''}
              `}
              whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <MapPin className={styles.icon} size={24} />
            </motion.div>

            {/* Location Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg mb-1 group-hover:text-soft-gold transition-colors duration-300">
                {location.LocationName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <div className={`w-2 h-2 rounded-full ${styles.accent} opacity-60`} />
                <span>{location.City}</span>
              </div>
              {location.Street && (
                <div className="text-xs text-text-muted mt-1 flex items-center gap-1">
                  <Navigation size={10} />
                  {location.Street}
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-glass-border/50">
            <div className="flex items-center gap-4">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="text-amber-500" size={14} fill="currentColor" />
                <span className="text-sm text-text-muted">4.8</span>
              </div>
              
              {/* Time */}
              <div className="flex items-center gap-1">
                <Clock className="text-blue-500" size={14} />
                <span className="text-sm text-text-muted">5-10 min</span>
              </div>
            </div>

            {/* Arrow */}
            <motion.div
              className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              animate={{ x: isSelected ? 0 : 5 }}
            >
              <Navigation size={16} />
            </motion.div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
      </GlassCard>
    </motion.div>
  );
}

interface ElegantLocationGridProps {
  locations: Array<{
    LocationID: number;
    LocationName: string;
    City: string;
    Street?: string;
  }>;
  onLocationClick?: (location: any) => void;
  selectedPickup?: number | null;
  selectedDropoff?: number | null;
  className?: string;
}

export function ElegantLocationGrid({
  locations,
  onLocationClick,
  selectedPickup,
  selectedDropoff,
  className = ''
}: ElegantLocationGridProps) {
  const getVariant = (locationId: number) => {
    if (selectedPickup === locationId) return 'pickup';
    if (selectedDropoff === locationId) return 'dropoff';
    return 'default';
  };

  const isSelected = (locationId: number) => {
    return selectedPickup === locationId || selectedDropoff === locationId;
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {locations.map((location, index) => (
        <motion.div
          key={location.LocationID}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <ElegantLocationCard
            location={location}
            onClick={() => onLocationClick?.(location)}
            variant={getVariant(location.LocationID)}
            isSelected={isSelected(location.LocationID)}
          />
        </motion.div>
      ))}
    </div>
  );
}
