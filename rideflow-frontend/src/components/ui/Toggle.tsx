import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { springs } from '../../motion/presets';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div 
          className={clsx(
            'w-12 h-6 rounded-full transition-colors duration-300',
            checked ? 'bg-amber-600 shadow-glow' : 'bg-glass-bg border border-glass-border'
          )}
        />
        <motion.div
          layout
          transition={springs.snappy}
          className={clsx(
            'absolute w-5 h-5 rounded-full bg-white shadow-md top-0.5',
            checked ? 'left-6.5' : 'left-0.5'
          )}
          style={{ x: checked ? 24 : 0 }}
        />
        <div className={clsx(
          'absolute inset-0 rounded-full scale-0 opacity-0 group-active:scale-150 group-active:opacity-20 transition-all duration-300',
          checked ? 'bg-amber-500' : 'bg-white'
        )} />
      </div>
      {label && <span className="text-sm font-medium text-text-primary select-none">{label}</span>}
    </label>
  );
}
