import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { fadeSlideUp } from '@/lib/motion';

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{ destroy: () => void } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // GSAP hero timeline
    import('@/lib/gsap').then(({ gsap }) => {
      if (!mounted) return;
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl
        .from('.hero-navbar-spacer', { opacity: 0, duration: 0.3 })
        .from('.hero-label', { y: 12, opacity: 0, duration: 0.5 }, '-=0.1')
        .from('.hero-word', {
          y: 40,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
        }, '-=0.2')
        .from('.hero-sub', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
        .from('.hero-actions', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.hero-trust', { y: 16, opacity: 0, duration: 0.4 }, '-=0.2')
        .from('.hero-visual', { x: 60, opacity: 0, duration: 0.9, ease: 'expo.out' }, '-=0.8');
    });

    // Three.js scene — dynamic import after LCP
    const timer = setTimeout(async () => {
      if (!mounted || !canvasRef.current) return;
      try {
        const { shouldUse3D } = await import('@/3d/performanceGate');
        if (!shouldUse3D) return;
        const { HeroScene } = await import('@/3d/HeroScene');
        if (canvasRef.current && mounted) {
          sceneRef.current = new HeroScene(canvasRef.current);
        }
      } catch {
        // Three.js not critical — fallback SVG shown
      }
    }, 800);

    return () => {
      mounted = false;
      clearTimeout(timer);
      sceneRef.current?.destroy();
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Ambient background gradients */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 65%)' }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(194,65,12,0.06) 0%, transparent 65%)' }}
        />
      </div>

      <div className="container-rf w-full pt-[72px]">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 items-center min-h-[calc(100vh-72px)] py-16">
          {/* Left column */}
          <div>
            <div className="hero-label inline-flex items-center gap-2 mb-6">
              <span className="text-amber-600 font-semibold text-xs tracking-[0.12em] uppercase">
                Premium Ride-Hailing
              </span>
              <span className="h-px w-8 bg-amber-600/50" />
            </div>

            <h1 className="font-display text-5xl lg:text-[3.75rem] leading-[1.1] mb-6">
              {['Your', 'ride.', 'Your', 'flow.'].map((word, i) => (
                <span key={i} className="hero-word inline-block mr-3 gradient-text">
                  {word}
                </span>
              ))}
            </h1>

            <p className="hero-sub text-lg text-warm-muted leading-relaxed max-w-[42ch] mb-8">
              Premium vehicles, professional drivers, and seamless booking.
              Warm service, every ride — from your door to anywhere.
            </p>

            <div className="hero-actions flex flex-wrap gap-4 mb-10">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2"
              >
                Request a Ride
                <ArrowRight size={18} />
              </Button>
              <Button variant="glass" size="lg">
                How It Works
              </Button>
            </div>

            {/* Social proof */}
            <div className="hero-trust flex items-center gap-5">
              <div className="flex -space-x-2">
                {['#D97706', '#C2410C', '#F59E0B', '#FBBF24'].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-bg-base"
                    style={{ backgroundColor: c, opacity: 0.8 }}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-warm-muted mt-0.5">
                  <strong className="text-warm-white">50,000+</strong> happy riders
                </p>
              </div>
            </div>
          </div>

          {/* Right column — Three.js canvas / fallback */}
          <div className="hero-visual flex items-center justify-center">
            <div className="relative w-full max-w-[480px] aspect-square">
              {/* Canvas for Three.js */}
              <canvas
                id="hero-canvas"
                ref={canvasRef}
                className="w-full h-full rounded-3xl"
                style={{ background: 'transparent' }}
                aria-hidden="true"
              />

              {/* Fallback: amber-tinted floating circle */}
              <div
                className="absolute inset-0 rounded-3xl flex items-center justify-center animate-float -z-10"
                aria-hidden="true"
              >
                <div
                  className="w-72 h-72 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(217,119,6,0.15) 0%, rgba(194,65,12,0.08) 50%, transparent 70%)',
                    boxShadow: '0 0 80px rgba(217,119,6,0.2)',
                  }}
                />
              </div>

              {/* Glass info cards */}
              <motion.div
                {...fadeSlideUp}
                transition={{ delay: 1 }}
                className="absolute -bottom-4 -left-4 glass-2 px-4 py-3 rounded-2xl"
              >
                <p className="text-xs text-warm-faint uppercase tracking-widest">Avg. wait time</p>
                <p className="font-display text-xl gradient-text">3.2 min</p>
              </motion.div>

              <motion.div
                {...fadeSlideUp}
                transition={{ delay: 1.2 }}
                className="absolute -top-4 -right-4 glass-2 px-4 py-3 rounded-2xl"
              >
                <p className="text-xs text-warm-faint uppercase tracking-widest">Rating</p>
                <p className="font-display text-xl gradient-text">4.9 ★</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
