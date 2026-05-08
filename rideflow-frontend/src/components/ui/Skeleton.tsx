import { clsx } from 'clsx';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'card' | 'circle';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, lines = 1, className }: SkeletonProps) {
  const baseClass = 'animate-shimmer bg-[length:1000px_100%] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)]';
  
  if (variant === 'card') {
    return (
      <div 
        className={clsx('rounded-radius-lg border border-glass-border', baseClass, className)}
        style={{ width: width || '100%', height: height || '200px' }}
      />
    );
  }

  if (variant === 'circle') {
    return (
      <div 
        className={clsx('rounded-full', baseClass, className)}
        style={{ width: width || '48px', height: height || '48px' }}
      />
    );
  }

  // Text or Title
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx('rounded-radius-sm', baseClass, className)}
          style={{ 
            height: height || (variant === 'title' ? '28px' : '16px'),
            width: lines > 1 && i === lines - 1 ? '70%' : width || '100%'
          }}
        />
      ))}
    </div>
  );
}
