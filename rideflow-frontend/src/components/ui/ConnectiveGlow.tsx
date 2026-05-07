import { motion } from 'framer-motion';

export function ConnectiveGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-5">
      {/* Simplified static glow zone */}
      <motion.div
        className="absolute top-1/2 left-3/4 w-[300px] h-[300px] rounded-full"
        style={{
          background: `
            radial-gradient(circle at center,
              rgba(245, 158, 11, 0.1) 0%,
              rgba(251, 191, 36, 0.05) 30%,
              transparent 70%
            )
          `,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Simplified connection points */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`connect-point-${i}`}
          className="absolute w-2 h-2 rounded-full bg-amber-500/30"
          style={{
            left: `${30 + i * 20}%`,
            top: `${40 + i * 10}%`,
            filter: 'blur(2px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
