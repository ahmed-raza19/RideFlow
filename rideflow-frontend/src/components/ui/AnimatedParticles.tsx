import { motion } from 'framer-motion';

export function AnimatedParticles() {
  const particles = [...Array(12)].map((_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 3,
    pathX: Math.random() * 60 - 30,
    pathY: Math.random() * 60 - 30,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Enhanced texture particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.id % 3 === 0 ? '#F59E0B' : '#FFFEF9',
            boxShadow: `0 0 ${particle.size * 1.5}px ${particle.id % 3 === 0 ? '#F59E0B' : '#FFFEF9'}`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: particle.opacity,
            filter: 'blur(0.5px)', // Softer texture
          }}
          animate={{
            x: [0, particle.pathX, 0],
            y: [0, particle.pathY - 20, 0],
            opacity: [0, particle.opacity, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Reduced floating dust motes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-0.5 h-0.5 rounded-full bg-soft-gold/15"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: 'blur(0.5px)',
          }}
          animate={{
            opacity: [0, 0.15, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Reduced light orbs */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, rgba(251, 191, 36, 0.2) 50%, transparent 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: 'blur(1px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
