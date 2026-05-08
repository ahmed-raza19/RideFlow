import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default' | 'neon';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    success: 'bg-[#059669]/20 text-[#34D399] border-[#059669]/30',
    error:   'bg-[#DC2626]/20 text-[#F87171] border-[#DC2626]/30',
    warning: 'bg-[#D97706]/20 text-[#FBBF24] border-[#D97706]/30',
    info:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    default: 'bg-glass-bg-light text-text-secondary border-glass-border',
    neon:    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-lg shadow-cyan-500/50',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
