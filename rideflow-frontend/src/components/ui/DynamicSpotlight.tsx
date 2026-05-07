import { motion } from 'framer-motion';

export function DynamicSpotlight() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {/* Simplified static spotlight */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full"
        style={{
          background: `
            radial-gradient(circle at center,
              rgba(245, 158, 11, 0.1) 0%,
              rgba(251, 191, 36, 0.05) 30%,
              transparent 70%
            )
          `,
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Secondary static glow */}
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full"
        style={{
          background: `
            radial-gradient(circle at center,
              rgba(255, 254, 249, 0.15) 0%,
              rgba(247, 231, 206, 0.08) 30%,
              transparent 60%
            )
          `,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
