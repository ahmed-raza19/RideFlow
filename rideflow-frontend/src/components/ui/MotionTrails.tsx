import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Trail {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
}

export function MotionTrails() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  // Generate fewer light trails for better performance
  const trails: Trail[] = [
    { id: 1, startX: 10, startY: 20, endX: 90, endY: 30, delay: 0, duration: 12 },
    { id: 2, startX: 80, startY: 10, endX: 20, endY: 80, delay: 2, duration: 15 },
    { id: 3, startX: 15, startY: 70, endX: 85, endY: 25, delay: 4, duration: 14 },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate mouse position as a percentage of viewport
      const xPercent = (clientX / innerWidth - 0.5) * 2;
      const yPercent = (clientY / innerHeight - 0.5) * 2;
      
      mouseX.set(xPercent * 15);
      mouseY.set(yPercent * 15);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Light Trails */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {/* Enhanced gradients with better fade effects */}
          <linearGradient id="trailGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
            <stop offset="20%" stopColor="#F59E0B" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.7" />
            <stop offset="80%" stopColor="#FBBF24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trailGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFEF9" stopOpacity="0" />
            <stop offset="25%" stopColor="#FFFEF9" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#FFFEF9" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#F5F2ED" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F5F2ED" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trailGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0" />
            <stop offset="30%" stopColor="#D97706" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
          
          {/* Multiple glow filters for depth */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="blur-subtle">
            <feGaussianBlur stdDeviation="1"/>
          </filter>
        </defs>
        
        {trails.map((trail, index) => {
          const depthLevel = index % 3;
          const gradientMap = [1, 2, 3];
          const filterMap = ['glow', 'blur-subtle', 'glow-strong'];
          const opacityMap = [0.8, 0.5, 0.3];
          const strokeWidthMap = [3, 2, 1];
          
          return (
            <motion.line
              key={trail.id}
              x1={`${trail.startX}%`}
              y1={`${trail.startY}%`}
              x2={`${trail.endX}%`}
              y2={`${trail.endY}%`}
              stroke={`url(#trailGradient${gradientMap[depthLevel]})`}
              strokeWidth={strokeWidthMap[depthLevel]}
              filter={`url(#${filterMap[depthLevel]})`}
              opacity={opacityMap[depthLevel]}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0], 
                opacity: [0, opacityMap[depthLevel], 0] 
              }}
              transition={{
              duration: trail.duration + depthLevel * 2,
                delay: trail.delay + depthLevel * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                x: useTransform(springX, [-15, 15], [-20 + depthLevel * 5, 20 - depthLevel * 5]),
                y: useTransform(springY, [-15, 15], [-20 + depthLevel * 5, 20 - depthLevel * 5]),
              }}
            />
          );
        })}
        
        {/* Simplified flowing lines */}
        {[...Array(4)].map((_, i) => (
          <motion.path
            key={`flow-${i}`}
            d={`M ${20 + i * 15} ${10 + i * 8} Q ${50 + i * 8} ${50 - i * 5} ${80 + i * 5} ${90 - i * 8}`}
            stroke={i % 2 === 0 ? "#F59E0B" : "#FFFEF9"}
            strokeWidth="1"
            fill="none"
            opacity={0.3}
            filter="url(#glow)"
            animate={{
              pathLength: [0, 1],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 8 + i * 1,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
      
      {/* Reduced floating light particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 2 === 0 ? '#F59E0B' : '#FFFEF9',
            boxShadow: `0 0 4px ${i % 2 === 0 ? '#F59E0B' : '#FFFEF9'}`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
