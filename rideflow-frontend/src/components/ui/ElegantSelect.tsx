import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Check, Search } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface ElegantSelectProps {
  options: Array<{
    value: string | number;
    label: string;
    subtitle?: string;
    icon?: React.ReactNode;
  }>;
  value: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  variant?: 'pickup' | 'dropoff' | 'default';
  searchable?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function ElegantSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  variant = 'default',
  searchable = false,
  icon,
  className = ''
}: ElegantSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVariantStyles = () => {
    switch (variant) {
      case 'pickup':
        return {
          border: 'border-amber-500/30',
          hover: 'hover:border-amber-500/50',
          selected: 'bg-gradient-to-r from-amber-500/10 to-champagne/10 border-amber-500/50',
          icon: 'text-amber-500'
        };
      case 'dropoff':
        return {
          border: 'border-emerald-500/30',
          hover: 'hover:border-emerald-500/50',
          selected: 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/50',
          icon: 'text-emerald-500'
        };
      default:
        return {
          border: 'border-glass-border',
          hover: 'hover:border-soft-gold/30',
          selected: 'bg-gradient-to-r from-soft-gold/10 to-champagne/10 border-soft-gold/50',
          icon: 'text-soft-gold'
        };
    }
  };

  const styles = getVariantStyles();

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Select Button */}
      <motion.button
        type="button"
        className={`
          w-full px-6 py-4 bg-glass-bg-light border-2 ${styles.border} rounded-2xl
          backdrop-blur-xl transition-all duration-300 outline-none
          ${styles.hover} shadow-glow hover:shadow-glow-lg
          ${selectedOption ? styles.selected : ''}
          flex items-center justify-between gap-4 group
        `}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${selectedOption 
              ? variant === 'pickup' ? 'bg-amber-500/20' : 
                variant === 'dropoff' ? 'bg-emerald-500/20' : 
                'bg-soft-gold/20'
              : 'bg-glass-bg'}
          `}>
            {icon || <MapPin className={styles.icon} size={20} />}
          </div>

          {/* Selected Content */}
          <div className="flex-1 text-left">
            {selectedOption ? (
              <div>
                <div className="font-semibold text-white text-lg">
                  {selectedOption.label}
                </div>
                {selectedOption.subtitle && (
                  <div className="text-sm text-text-muted">
                    {selectedOption.subtitle}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-text-muted">
                {placeholder}
              </div>
            )}
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-text-muted"
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2"
          >
            <GlassCard tier={2} className="p-2 backdrop-blur-xl bg-glass-white border-glass-border shadow-glow-lg max-h-80 overflow-hidden">
              {/* Search */}
              {searchable && (
                <div className="p-3 border-b border-glass-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-glass-bg-light border border-glass-border rounded-lg text-white placeholder-text-muted outline-none focus:border-soft-gold/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-text-muted">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-4 rounded-xl cursor-pointer transition-all duration-200
                        ${option.value === value 
                          ? styles.selected 
                          : 'hover:bg-glass-bg-light/50'}
                        ${index === highlightedIndex ? 'bg-glass-bg-light/30' : ''}
                        flex items-center gap-4
                      `}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {/* Option Icon */}
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${option.value === value 
                          ? variant === 'pickup' ? 'bg-amber-500/20' : 
                            variant === 'dropoff' ? 'bg-emerald-500/20' : 
                            'bg-soft-gold/20'
                          : 'bg-glass-bg'}
                      `}>
                        {option.icon || <MapPin className={styles.icon} size={16} />}
                      </div>

                      {/* Option Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">
                          {option.label}
                        </div>
                        {option.subtitle && (
                          <div className="text-sm text-text-muted truncate">
                            {option.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Check Mark */}
                      {option.value === value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-soft-gold flex items-center justify-center"
                        >
                          <Check size={14} className="text-text-primary" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
