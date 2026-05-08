import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownOption {
  value: string | number;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'pickup' | 'dropoff';
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  searchable = false,
  icon,
  variant = 'default'
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = searchable 
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            onChange(filteredOptions[highlightedIndex].value);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredOptions, highlightedIndex, onChange]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'pickup':
        return 'border-amber-500/50 hover:border-amber-500/70 focus:border-amber-500';
      case 'dropoff':
        return 'border-emerald-500/50 hover:border-emerald-500/70 focus:border-emerald-500';
      default:
        return 'border-glass-border hover:border-soft-gold/30 focus:border-soft-gold/50';
    }
  };

  const getIconColors = () => {
    switch (variant) {
      case 'pickup':
        return 'text-amber-500';
      case 'dropoff':
        return 'text-emerald-500';
      default:
        return 'text-soft-gold';
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full bg-glass-bg-light border rounded-radius-md px-4 py-3 
          text-left outline-none transition-all duration-300
          flex items-center justify-between gap-3
          ${getVariantStyles()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-soft-gold/30' : ''}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && <span className={getIconColors()}>{icon}</span>}
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </div>
            {selectedOption?.subtitle && (
              <div className="text-text-muted text-sm truncate">
                {selectedOption.subtitle}
              </div>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`text-text-muted transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          size={20}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-glass-bg-light border border-glass-border rounded-radius-md shadow-glow-lg max-h-80 overflow-hidden"
          >
            {searchable && (
              <div className="p-3 border-b border-glass-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-glass-bg border border-glass-border rounded-radius-md pl-10 pr-3 py-2 text-white outline-none focus:border-soft-gold/50"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-text-muted">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`
                      w-full px-4 py-3 text-left transition-all duration-200
                      flex items-center gap-3 border-b border-glass-border/30 last:border-b-0
                      hover:bg-glass-white/20
                      ${option.value === value ? 'bg-glass-white/30 border-l-4 border-l-soft-gold' : ''}
                      ${index === highlightedIndex ? 'bg-glass-white/20' : ''}
                    `}
                  >
                    {option.icon && <span className="text-soft-gold">{option.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {option.label}
                      </div>
                      {option.subtitle && (
                        <div className="text-text-muted text-sm truncate">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                    {option.value === value && (
                      <div className="w-2 h-2 bg-soft-gold rounded-full" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
