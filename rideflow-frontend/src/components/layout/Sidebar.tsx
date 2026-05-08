import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { GlassCard } from '../ui/GlassCard';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  title?: string;
}

export function Sidebar({ items, activeId, onSelect, title }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-full p-4 pt-24 shrink-0 fixed left-0 top-0 bottom-0 z-40">
        <GlassCard tier={2} className="flex-1 backdrop-blur-xl bg-glass-white border-glass-border p-6 flex flex-col">
          {title && (
            <h2 className="text-xl font-display text-text-primary mb-6 px-2 bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold">
              {title}
            </h2>
          )}
          <nav className="flex flex-col gap-2 relative">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-radius-md text-sm font-medium transition-all duration-300 relative z-10',
                    isActive 
                      ? 'text-amber-600 bg-gradient-to-r from-soft-gold/20 to-champagne/20 border border-soft-gold/30 shadow-glow' 
                      : 'text-text-muted hover:text-text-primary hover:bg-white/10 hover:border hover:border-soft-gold/20'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={clsx('transition-transform duration-300', isActive && 'scale-110 text-amber-600')}>
                    {item.icon}
                  </span>
                  <span className={clsx('font-medium', isActive && 'font-semibold')}>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </GlassCard>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 backdrop-blur-xl bg-glass-white/90 border-t border-glass-border z-40 flex items-center justify-around px-2 pb-safe">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={clsx(
                'flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors relative',
                isActive ? 'text-amber-600' : 'text-text-muted hover:text-text-primary'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-active"
                  className="absolute top-0 w-8 h-1 bg-gradient-to-r from-amber-500 to-soft-gold rounded-b-full shadow-glow"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={clsx('transition-transform duration-300', isActive ? '-translate-y-1 scale-110' : 'scale-100')}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </>
  );
}
