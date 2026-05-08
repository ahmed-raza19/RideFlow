import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { riderAPI } from '../../lib/rider';

interface Location {
  LocationID: number;
  LocationName: string;
  City: string;
  Street?: string;
}

interface LocationSearchProps {
  value: string;
  onChange: (locationId: number, location: Location) => void;
  onTextChange: (text: string) => void;
  placeholder?: string;
  className?: string;
  iconColor?: string;
  disabled?: boolean;
  selectedLocationId?: number | null;
}

export function LocationSearch({
  value,
  onChange,
  onTextChange,
  placeholder = "Search for a location...",
  className = "",
  iconColor = "text-amber-500",
  disabled = false,
  selectedLocationId
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch location suggestions
  const fetchSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await riderAPI.getLocations(undefined, searchTerm, 10);
      setSuggestions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch location suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value && !selectedLocation) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, selectedLocation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onTextChange(text);
    setSelectedLocation(null);
    setIsOpen(true);
  };

  // Handle location selection
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    onChange(location.LocationID, location);
    onTextChange(`${location.LocationName}, ${location.City}`);
    setIsOpen(false);
    setSuggestions([]);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value && !selectedLocation) {
      setIsOpen(true);
    }
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedLocation(null);
    onTextChange('');
    onChange(0, {} as Location);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-gradient-to-r from-glass-bg-light via-glass-bg to-glass-bg-light border-2 border-amber-500/30 rounded-2xl px-6 py-4 text-white outline-none hover:border-amber-500/50 focus:border-amber-500/70 transition-all duration-300 shadow-glow hover:shadow-glow-lg appearance-none cursor-pointer backdrop-blur-xl pr-12 ${className}`}
        />
        
        {/* Icon */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="animate-spin text-amber-500" size={20} />
          ) : (
            <>
              <MapPin className={iconColor} size={20} />
              {selectedLocation && (
                <button
                  onClick={handleClear}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((location) => (
            <div
              key={location.LocationID}
              onClick={() => handleLocationSelect(location)}
              className="px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <MapPin className="text-amber-500" size={16} />
                <div>
                  <div className="text-white font-medium">
                    {location.LocationName}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {location.City}
                    {location.Street && `, ${location.Street}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && value.length >= 2 && !isLoading && suggestions.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50"
        >
          <div className="px-4 py-3 text-gray-400 text-center">
            No locations found for "{value}"
          </div>
        </div>
      )}
    </div>
  );
}
