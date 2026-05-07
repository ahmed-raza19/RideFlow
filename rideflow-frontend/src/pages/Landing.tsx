import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Shield, Star, CheckCircle, Users, Clock, Phone, ArrowRight, Zap, Globe } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { MagneticButton } from '../components/ui/MagneticButton';
import { Floating3DObjects } from '../components/ui/Floating3DObjects';
import { ParallaxWrapper } from '../components/ui/ParallaxWrapper';
import { MotionTrails } from '../components/ui/MotionTrails';
import { GeographicTextures } from '../components/ui/GeographicTextures';
import { CinematicBackground } from '../components/ui/CinematicBackground';
import { DynamicSpotlight } from '../components/ui/DynamicSpotlight';
import { AnimatedParticles } from '../components/ui/AnimatedParticles';
import { ConnectiveGlow } from '../components/ui/ConnectiveGlow';
import { AuthModal } from '../components/auth/AuthModal';
import { motion } from 'framer-motion';

export function Landing() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'signin' | 'signup' }>({
    isOpen: false,
    mode: 'signin',
  });
    const heroRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    // Dynamic import for Three.js scene
    const canvas = document.querySelector<HTMLCanvasElement>('#hero-canvas');
    let scene: any;
    if (canvas) {
      import('../3d/HeroScene').then(({ HeroScene }) => {
        scene = new HeroScene(canvas);
      });
    }

    // Hero GSAP sequence
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.navbar', { y: -72, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
        .fromTo('.hero-label', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.3')
        .fromTo('.hero-headline .word', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 }, '-=0.2')
        .fromTo(['.hero-sub', '.hero-actions'], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.15 }, '-=0.3')
        .fromTo('.hero-illustration', { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9 }, '-=0.7')
        .fromTo('.hero-glow', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5 }, '-=0.8');

      // How it works scroll trigger
      if (howItWorksRef.current) {
        gsap.fromTo(
          gsap.utils.toArray('.hiw-card'),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.2,
            scrollTrigger: {
              trigger: howItWorksRef.current,
              start: 'top 75%',
            },
          }
        );
      }
    }, heroRef);

    return () => {
      ctx.revert();
      if (scene) scene.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white via-soft-beige to-ivory text-text-primary overflow-x-hidden relative">
            
      {/* Optimized Visual Layers */}
      <CinematicBackground />
      <GeographicTextures />
      <MotionTrails />
      <DynamicSpotlight />
      {/* <ConnectiveGlow /> */}
      {/* <AnimatedParticles /> */}
      {/* <Floating3DObjects /> */}
      <Navbar 
        onLoginClick={() => setAuthModal({ isOpen: true, mode: 'signin' })} 
        onSignupClick={() => setAuthModal({ isOpen: true, mode: 'signup' })} 
      />

      <main>
        {/* SECTION 1 — HERO */}
        <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-champagne/10 to-soft-gold/10 animate-gradient-shift" />
          
          {/* Hero Glow Effect */}
          <motion.div 
            className="hero-glow absolute top-1/2 left-[70%] -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(230,213,184,0.15) 0%, transparent 70%)' }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-5 flex flex-col items-start">
              <div className="hero-label inline-flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-xl bg-glass-white-strong border border-soft-gold/50 shadow-glow-lg mb-8 relative z-20">
                <motion.span 
                  className="text-amber-500 text-lg font-bold"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >✦</motion.span>
                <span className="text-sm font-semibold text-text-primary">Available in Karachi · Lahore · Islamabad</span>
              </div>
              
              <h1 className="hero-headline text-[clamp(3.5rem,7vw,6rem)] font-display leading-[1.05] mb-8 relative">
                <span className="block overflow-hidden relative">
                  <span className="word block bg-gradient-to-r from-amber-600 via-soft-gold to-champagne bg-clip-text text-transparent font-bold drop-shadow-lg">Ride smarter.</span>
                </span>
                <span className="block overflow-hidden relative">
                  <span className="word block bg-gradient-to-r from-champagne via-amber-600 to-soft-gold bg-clip-text text-transparent font-bold drop-shadow-lg">Arrive in style.</span>
                </span>
              </h1>
              
              <p className="hero-sub text-xl md:text-2xl text-text-primary/90 mb-10 max-w-lg leading-relaxed font-light drop-shadow">
                Pakistan's premium ride-hailing experience. Book in seconds, ride in comfort.
              </p>
              
              <div className="hero-actions flex flex-wrap gap-4 mb-16">
                <MagneticButton
                  onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                  className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow rounded-xl border-0 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Book a Ride
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </MagneticButton>
                <MagneticButton
                  onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                  className="px-8 py-4 text-lg font-semibold backdrop-blur-xl bg-glass-white border-glass-border hover:border-soft-gold/50 text-text-primary rounded-xl transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Drive with Us
                  </span>
                </MagneticButton>
              </div>
              
              <div className="hero-actions flex items-center gap-8 text-sm font-medium text-text-secondary">
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-2 h-2 bg-soft-gold rounded-full animate-pulse-glow shadow-glow" />
                  <span className="text-text-primary font-bold text-base">24,000+</span>
                  <span className="text-amber-600">Rides</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-text-primary font-bold text-base">4.8★</span>
                  <span className="text-amber-600">Rating</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Users className="w-4 h-4 text-amber-500" />
                  <span className="text-text-primary font-bold text-base">500+</span>
                  <span className="text-amber-600">Drivers</span>
                </motion.div>
              </div>
            </div>

            {/* Right Content - Isometric City */}
            <div className="lg:col-span-7 relative hero-illustration h-[400px] lg:h-[600px] w-full overflow-hidden">
              {/* Isometric City SVG */}
              <svg viewBox="0 0 680 640" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="w-full h-full">
                <defs>
                  <filter id="bldShadow">
                    <feDropShadow dx="4" dy="6" stdDeviation="5" floodColor="#8B6820" floodOpacity="0.2"/>
                  </filter>
                  <filter id="routeGlow">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="carGlow">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#8B6820" floodOpacity="0.25"/>
                  </filter>
                </defs>

                <g className="iso-scene">

                {/* ── GROUND PLANE ── */}
                <polygon points="340,60 660,230 340,400 20,230"
                  fill="#EDE3CE" stroke="#D8CAA8" strokeWidth="0.8"/>

                {/* Ground grid */}
                <g stroke="#C8B880" strokeWidth="0.4" opacity="0.45">
                  {/* horizontals */}
                  <line x1="100" y1="190" x2="580" y2="190"/>
                  <line x1="60"  y1="215" x2="620" y2="215"/>
                  <line x1="20"  y1="240" x2="660" y2="240"/>
                  <line x1="60"  y1="265" x2="620" y2="265"/>
                  <line x1="100" y1="290" x2="580" y2="290"/>
                  <line x1="140" y1="315" x2="540" y2="315"/>
                  <line x1="180" y1="340" x2="500" y2="340"/>
                  {/* left diagonals */}
                  <line x1="340" y1="60"  x2="20"  y2="230"/>
                  <line x1="400" y1="60"  x2="80"  y2="230"/>
                  <line x1="460" y1="76"  x2="140" y2="246"/>
                  <line x1="520" y1="108" x2="200" y2="278"/>
                  <line x1="580" y1="140" x2="260" y2="310"/>
                  <line x1="640" y1="172" x2="320" y2="342"/>
                  {/* right diagonals */}
                  <line x1="280" y1="60"  x2="600" y2="230"/>
                  <line x1="220" y1="76"  x2="540" y2="246"/>
                  <line x1="160" y1="108" x2="480" y2="278"/>
                  <line x1="100" y1="140" x2="420" y2="310"/>
                  <line x1="40"  y1="172" x2="360" y2="342"/>
                </g>

                {/* ── ROADS ── */}
                {/* Main road strip (center) */}
                <polygon points="220,175 380,95 420,116 260,196" fill="#D8C898" opacity="0.7" stroke="none"/>
                <polygon points="260,196 420,116 460,138 300,218" fill="#D8C898" opacity="0.7" stroke="none"/>
                <polygon points="300,218 460,138 500,160 340,240" fill="#D8C898" opacity="0.7" stroke="none"/>
                <polygon points="340,240 500,160 530,178 370,258" fill="#D8C898" opacity="0.7" stroke="none"/>
                {/* Road center dashes */}
                <g stroke="#C4B070" strokeWidth="1" strokeDasharray="10,8" opacity="0.5">
                  <line x1="250" y1="186" x2="430" y2="127"/>
                  <line x1="330" y1="229" x2="510" y2="169"/>
                </g>

                {/* ── BUILDINGS ── */}

                {/* Building 1: Tall back-left */}
                <g filter="url(#bldShadow)">
                  <polygon points="95,205 145,177 145,97 95,125" fill="#B89A60"/>
                  <polygon points="95,125 145,97 195,125 145,153" fill="#F0D890"/>
                  <polygon points="145,153 195,125 195,205 145,233" fill="#D4BC78"/>
                  {/* windows L */}
                  <rect x="103" y="133" width="10" height="13" rx="1.5"
                        fill="rgba(245,235,210,0.5)" transform="matrix(1,0.5,0,1,0,0)"/>
                  <rect x="118" y="125" width="10" height="13" rx="1.5"
                        fill="rgba(200,160,60,0.55)" transform="matrix(1,0.5,0,1,0,0)"/>
                  <rect x="103" y="152" width="10" height="13" rx="1.5"
                        fill="rgba(245,235,210,0.4)" transform="matrix(1,0.5,0,1,0,0)"/>
                  <rect x="118" y="144" width="10" height="13" rx="1.5"
                        fill="rgba(245,235,210,0.5)" transform="matrix(1,0.5,0,1,0,0)"/>
                  {/* windows R */}
                  <rect x="152" y="133" width="10" height="13" rx="1.5"
                        fill="rgba(245,235,210,0.4)" transform="matrix(1,-0.5,0,1,0,0)"/>
                  <rect x="167" y="141" width="10" height="13" rx="1.5"
                        fill="rgba(200,160,60,0.5)" transform="matrix(1,-0.5,0,1,0,0)"/>
                  {/* rooftop accent */}
                  <polygon points="95,125 145,97 195,125 145,153" fill="none" stroke="#E8C860" strokeWidth="0.6" opacity="0.4"/>
                </g>

                {/* Building 2: Medium mid-left */}
                <g filter="url(#bldShadow)">
                  <polygon points="145,265 185,243 185,183 145,205" fill="#A88C52"/>
                  <polygon points="145,205 185,183 220,200 180,222" fill="#E0C87C"/>
                  <polygon points="180,222 220,200 220,260 180,282" fill="#C4A868"/>
                  <rect x="152" y="212" width="9" height="12" rx="1"
                        fill="rgba(245,235,210,0.45)" transform="matrix(1,0.5,0,1,0,0)"/>
                  <rect x="165" y="205" width="9" height="12" rx="1"
                        fill="rgba(200,160,60,0.5)" transform="matrix(1,0.5,0,1,0,0)"/>
                </g>

                {/* Building 3: Tall far-right */}
                <g filter="url(#bldShadow)">
                  <polygon points="490,200 540,172 540,92 490,120" fill="#C0A268"/>
                  <polygon points="490,120 540,92 590,120 540,148" fill="#F4DC92"/>
                  <polygon points="540,148 590,120 590,200 540,228" fill="#DCC07A"/>
                  {/* windows R */}
                  <rect x="546" y="156" width="11" height="14" rx="1.5"
                        fill="rgba(245,235,210,0.5)" transform="matrix(1,-0.5,0,1,0,0)"/>
                  <rect x="562" y="165" width="11" height="14" rx="1.5"
                        fill="rgba(200,160,60,0.55)" transform="matrix(1,-0.5,0,1,0,0)"/>
                  <rect x="546" y="176" width="11" height="14" rx="1.5"
                        fill="rgba(245,235,210,0.4)" transform="matrix(1,-0.5,0,1,0,0)"/>
                  {/* windows L */}
                  <rect x="498" y="128" width="11" height="14" rx="1.5"
                        fill="rgba(245,235,210,0.45)" transform="matrix(1,0.5,0,1,0,0)"/>
                  <rect x="513" y="120" width="11" height="14" rx="1.5"
                        fill="rgba(200,160,60,0.5)" transform="matrix(1,0.5,0,1,0,0)"/>
                </g>

                {/* Building 4: Medium right */}
                <g filter="url(#bldShadow)">
                  <polygon points="435,255 472,234 472,174 435,195" fill="#B09058"/>
                  <polygon points="435,195 472,174 508,194 471,215" fill="#E8CE80"/>
                  <polygon points="471,215 508,194 508,254 471,275" fill="#CCAA68"/>
                  <rect x="477" y="202" width="9" height="12" rx="1"
                        fill="rgba(245,235,210,0.45)" transform="matrix(1,-0.5,0,1,0,0)"/>
                  <rect x="491" y="210" width="9" height="12" rx="1"
                        fill="rgba(200,160,60,0.5)" transform="matrix(1,-0.5,0,1,0,0)"/>
                </g>

                {/* Building 5: Small front-left */}
                <g filter="url(#bldShadow)">
                  <polygon points="185,318 218,300 218,264 185,282" fill="#9C8044"/>
                  <polygon points="185,282 218,264 246,278 213,296" fill="#D8BE72"/>
                  <polygon points="213,296 246,278 246,314 213,332" fill="#B89858"/>
                </g>

                {/* Building 6: Small front-right */}
                <g filter="url(#bldShadow)">
                  <polygon points="446,298 478,280 478,248 446,266" fill="#9C8044"/>
                  <polygon points="446,266 478,248 506,262 474,280" fill="#DCC07A"/>
                  <polygon points="474,280 506,262 506,294 474,312" fill="#BEA05E"/>
                </g>

                {/* Building 7: tiny accent left-back */}
                <g>
                  <polygon points="190,158 215,144 215,120 190,134" fill="#A08848" opacity="0.7"/>
                  <polygon points="190,134 215,120 236,132 211,146" fill="#D4B86A" opacity="0.7"/>
                  <polygon points="211,146 236,132 236,156 211,170" fill="#BC9E5A" opacity="0.7"/>
                </g>

                {/* Building 8: tiny accent right-back */}
                <g>
                  <polygon points="420,155 442,143 442,120 420,132" fill="#A08848" opacity="0.7"/>
                  <polygon points="420,132 442,120 462,130 440,142" fill="#D4B86A" opacity="0.7"/>
                  <polygon points="440,142 462,130 462,152 440,164" fill="#BC9E5A" opacity="0.7"/>
                </g>

                {/* ── GLOWING ROUTE ── */}
                {/* Outer glow */}
                <path className="route-line" d="M 190 302 C 230 278 270 260 310 248 C 350 236 390 232 430 240 C 455 246 468 258 472 268"
                  fill="none" stroke="#E8A020" strokeWidth="6" strokeLinecap="round" opacity="0.25"
                  filter="url(#routeGlow)"/>
                {/* Main line */}
                <path className="route-line" d="M 190 302 C 230 278 270 260 310 248 C 350 236 390 232 430 240 C 455 246 468 258 472 268"
                  fill="none" stroke="#C8851A" strokeWidth="3.5" strokeLinecap="round" opacity="0.95"/>
                {/* Inner highlight */}
                <path className="route-glow" d="M 190 302 C 230 278 270 260 310 248 C 350 236 390 232 430 240 C 455 246 468 258 472 268"
                  fill="none" stroke="#FFD880" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>

                {/* Route start dot */}
                <circle cx="190" cy="302" r="6" fill="#C8851A"/>
                <circle cx="190" cy="302" r="11" fill="none" stroke="#C8851A" strokeWidth="1.5" opacity="0.3"/>
                <circle cx="190" cy="302" r="17" fill="none" stroke="#C8851A" strokeWidth="0.8" opacity="0.15"/>

                {/* ── DESTINATION PIN ── */}
                <g className="dest-pin">
                  <circle cx="472" cy="262" r="16" fill="#C8851A" opacity="0.12"/>
                  <circle cx="472" cy="262" r="10" fill="#C8851A" opacity="0.9"/>
                  <circle cx="472" cy="262" r="5"  fill="#FFE080"/>
                  <line x1="472" y1="272" x2="472" y2="286" stroke="#C8851A" strokeWidth="2" opacity="0.6" strokeLinecap="round"/>
                  {/* pin shadow */}
                  <ellipse cx="472" cy="290" rx="6" ry="2.5" fill="#8B6820" opacity="0.15"/>
                </g>

                {/* ── CAR ── */}
                <g className="car-group" filter="url(#carGlow)" transform="translate(290,230)">
                  {/* Ground shadow */}
                  <ellipse cx="24" cy="30" rx="36" ry="9" fill="#8B6820" opacity="0.18"/>

                  {/* Isometric car body */}
                  {/* Bottom base */}
                  <polygon points="-10,26 58,26 58,14 -10,14" fill="#181510" rx="2"/>
                  {/* Side skirt detail */}
                  <polygon points="-10,26 -10,14 -14,18 -14,24" fill="#0E0C0A"/>
                  <polygon points="58,14 58,26 62,22 62,16" fill="#0E0C0A"/>

                  {/* Main body */}
                  <polygon points="-10,14 58,14 52,4 -4,4" fill="#1E1C16"/>
                  {/* Roof */}
                  <polygon points="-4,4 52,4 46,-6 2,-6" fill="#1A1810"/>

                  {/* Windscreen front */}
                  <polygon points="2,-6 46,-6 50,2 -2,2" fill="#3D4A5C" opacity="0.9"/>
                  {/* Rear glass */}
                  <polygon points="-4,4 -2,2 -10,6 -10,10" fill="#3D4A5C" opacity="0.75"/>
                  {/* Side glass strip */}
                  <polygon points="-2,2 50,2 52,4 -4,4" fill="#4A566A" opacity="0.5"/>

                  {/* Left face of car (dark underside) */}
                  <polygon points="-10,6 -10,26 -14,24 -14,8" fill="#0A0908"/>
                  {/* Right face highlight */}
                  <polygon points="58,6 58,26 62,22 62,8" fill="#252218"/>

                  {/* WHEELS */}
                  {/* Front-left */}
                  <ellipse cx="-2" cy="27" rx="7" ry="4" fill="#2A2820"/>
                  <ellipse cx="-2" cy="27" rx="5" ry="2.8" fill="#383530"/>
                  <ellipse cx="-2" cy="27" rx="2.5" ry="1.5" fill="#888"/>
                  {/* Front-right */}
                  <ellipse cx="50" cy="27" rx="7" ry="4" fill="#2A2820"/>
                  <ellipse cx="50" cy="27" rx="5" ry="2.8" fill="#383530"/>
                  <ellipse cx="50" cy="27" rx="2.5" ry="1.5" fill="#888"/>
                  {/* Rear wheels (smaller, behind) */}
                  <ellipse cx="12" cy="28" rx="6" ry="3.2" fill="#222018"/>
                  <ellipse cx="38" cy="28" rx="6" ry="3.2" fill="#222018"/>

                  {/* Headlight */}
                  <ellipse cx="59" cy="10" rx="4" ry="2.5" fill="#FFE8A0" opacity="0.9"/>
                  <ellipse cx="59" cy="10" rx="8" ry="4" fill="#FFD060" opacity="0.2"/>
                  {/* Taillight */}
                  <ellipse cx="-11" cy="18" rx="3" ry="2" fill="#C83030" opacity="0.8"/>

                  {/* Chrome trim line */}
                  <line x1="-10" y1="19" x2="58" y2="19" stroke="#606050" strokeWidth="0.7" opacity="0.5"/>

                  {/* Side mirror */}
                  <polygon points="-12,6 -10,5 -10,8 -12,8" fill="#2A2820"/>

                  {/* Roof antenna */}
                  <line x1="42" y1="-6" x2="44" y2="-12" stroke="#444" strokeWidth="1" opacity="0.6"/>
                </g>

                {/* Ambient sparkle dots */}
                <circle cx="148" cy="340" r="2.5" fill="#C8851A" opacity="0.2"/>
                <circle cx="520" cy="310" r="2"   fill="#C8851A" opacity="0.18"/>
                <circle cx="340" cy="390" r="2"   fill="#C8851A" opacity="0.15"/>
                <circle cx="230" cy="368" r="1.5" fill="#C8851A" opacity="0.18"/>
                <circle cx="460" cy="360" r="1.5" fill="#C8851A" opacity="0.16"/>
                <circle cx="580" cy="270" r="1.8" fill="#C8851A" opacity="0.12"/>

                </g>
              </svg>

              {/* Floating tooltip */}
              <motion.div
                className="absolute top-[32%] left-[44%] bg-white rounded-2xl p-3 flex items-center gap-3 shadow-lg border border-amber-200/30 pointer-events-none"
                animate={{
                  y: [0, -7, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1.5,
                }}
              >
                <div className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-pulse shadow-lg" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Your ride is 2 min away</p>
                  <p className="text-xs text-gray-500">Ahmad · Toyota Corolla</p>
                </div>
              </motion.div>

              {/* Safe badge */}
              <motion.div
                className="absolute bottom-[22%] right-[6%] bg-white/90 backdrop-blur-sm border border-amber-200/30 rounded-full px-4 py-2 flex items-center gap-2 text-sm text-gray-600 pointer-events-none"
                animate={{
                  y: [0, -7, 0],
                }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 2,
                }}
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="font-medium">Safe & Verified</span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — HOW IT WORKS */}
        <section ref={howItWorksRef} className="py-24 relative z-10 border-t border-glass-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 
              className="text-4xl md:text-5xl font-display text-center mb-20 text-text-primary font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-soft-gold via-champagne to-amber-500 bg-clip-text text-transparent">Three steps to your ride</span>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] border-t-2 border-dashed border-soft-gold/30" />
              
              {[
                { step: '01', title: 'Set Your Location', desc: 'Enter pickup and drop-off in seconds' },
                { step: '02', title: 'Get Matched', desc: 'We find the nearest verified driver for you' },
                { step: '03', title: 'Ride & Rate', desc: 'Complete your trip, rate your experience' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <GlassCard tier={2} className="hiw-card p-8 relative overflow-hidden text-center flex flex-col items-center backdrop-blur-xl bg-glass-white border-glass-border hover:border-soft-gold/40 transition-all duration-300 hover:shadow-glow-lg">
                    <div className="absolute -top-6 -right-4 text-8xl font-display font-bold text-soft-gold/10 select-none pointer-events-none">
                      {item.step}
                    </div>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-soft-gold/20 to-champagne/20 border-2 border-soft-gold/30 flex items-center justify-center text-amber-600 mb-6 text-2xl font-display font-bold shadow-glow">
                      {item.step}
                    </div>
                    <h3 className="text-2xl font-semibold text-text-primary mb-3">{item.title}</h3>
                    <p className="text-text-secondary text-lg leading-relaxed">{item.desc}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 — VEHICLES */}
        <section className="py-24 bg-gradient-to-b from-transparent to-soft-beige/30 border-y border-glass-border relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 
              className="text-4xl md:text-5xl font-display text-center mb-20 text-text-primary font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-champagne via-amber-500 to-soft-gold bg-clip-text text-transparent">Choose your ride type</span>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: '🚗', title: 'Economy', desc: 'Comfortable sedans for everyday rides', price: 'From PKR 150' },
                { icon: '💼', title: 'Business', desc: 'Premium vehicles for important journeys', price: 'From PKR 280' },
                { icon: '🏍️', title: 'Bike', desc: 'Fast delivery and solo trips through traffic', price: 'From PKR 80' },
              ].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <GlassCard tier={2} tilt spotlight className="p-8 cursor-pointer group backdrop-blur-xl bg-glass-white border-glass-border hover:border-soft-gold/40 transition-all duration-300 hover:shadow-glow-lg">
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform origin-left duration-300">{v.icon}</div>
                    <h3 className="text-2xl font-semibold text-text-primary mb-3">{v.title}</h3>
                    <p className="text-text-secondary text-lg mb-6 leading-relaxed">{v.desc}</p>
                    <div className="text-amber-600 font-bold text-xl">{v.price}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — SAFETY */}
        <section className="py-24 relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-champagne/10 to-soft-gold/10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div 
              className="flex flex-col lg:flex-row items-center gap-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="w-28 h-28 shrink-0 rounded-3xl bg-gradient-to-br from-soft-gold to-champagne flex items-center justify-center p-1 shadow-glow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <div className="w-full h-full bg-warm-white rounded-2xl flex items-center justify-center">
                  <Shield size={48} className="text-amber-600" />
                </div>
              </motion.div>
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-4xl md:text-5xl font-display text-text-primary mb-6 font-bold">
                  <span className="bg-gradient-to-r from-soft-gold to-champagne bg-clip-text text-transparent">Your safety is our priority</span>
                </h2>
                <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4">
                  {[
                    { icon: CheckCircle, text: 'Verified Drivers', color: 'text-amber-600' },
                    { icon: Phone, text: 'Live Trip Sharing', color: 'text-amber-600' },
                    { icon: Clock, text: '24/7 Support', color: 'text-amber-600' }
                  ].map((item, index) => (
                    <motion.div 
                      key={item.text} 
                      className="flex items-center gap-3 text-text-secondary text-lg"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <item.icon size={20} className={item.color} />
                      <span className="text-text-primary font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="gradient-border" 
                  className="px-8 py-4 text-lg font-semibold backdrop-blur-xl bg-glass-white border-soft-gold/50 hover:border-soft-gold/70 text-text-primary shadow-glow"
                >
                  Learn More
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 5 — STATS */}
        <ParallaxWrapper speed={0.2} className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-display text-text-primary font-bold mb-4">
                <span className="bg-gradient-to-r from-amber-500 via-soft-gold to-champagne bg-clip-text text-transparent">Trusted by thousands</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">Join the growing community of satisfied riders across Pakistan</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: '24K+', label: 'Daily Rides', icon: Zap },
                { number: '4.8★', label: 'Average Rating', icon: Star },
                { number: '500+', label: 'Expert Drivers', icon: Users },
                { number: '3', label: 'Major Cities', icon: Globe },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <GlassCard tier={2} className="p-8 text-center backdrop-blur-xl bg-glass-white border-glass-border hover:border-soft-gold/40 transition-all duration-300 hover:shadow-glow">
                    <stat.icon className="w-8 h-8 text-amber-600 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-text-primary mb-2">{stat.number}</div>
                    <div className="text-text-secondary">{stat.label}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </ParallaxWrapper>

        {/* SECTION 6 — TESTIMONIALS */}
        <section className="py-24 bg-gradient-to-b from-transparent to-cream/30 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-display text-text-primary font-bold mb-4">
                <span className="bg-gradient-to-r from-champagne to-soft-gold bg-clip-text text-transparent">Love from our riders</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">Real experiences from real people</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Sarah Ahmed', role: 'Marketing Professional', text: 'The most comfortable and reliable ride service in Lahore. Drivers are professional and cars are always clean.', rating: 5 },
                { name: 'Ali Khan', role: 'Tech Entrepreneur', text: 'Game changer for my daily commute. The app is intuitive and booking takes seconds.', rating: 5 },
                { name: 'Fatima Noor', role: 'Medical Student', text: 'Safe, affordable, and always on time. Perfect for late night study sessions at the library.', rating: 5 },
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <GlassCard tier={2} className="p-8 backdrop-blur-xl bg-glass-white border-glass-border hover:border-soft-gold/40 transition-all duration-300 hover:shadow-glow">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-text-secondary mb-6 italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-soft-gold to-champagne flex items-center justify-center text-text-primary font-semibold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{testimonial.name}</div>
                        <div className="text-sm text-text-secondary">{testimonial.role}</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 7 — FOOTER */}
      <footer className="bg-gradient-to-b from-transparent to-soft-beige/50 backdrop-blur-xl border-t border-glass-border pt-16 pb-8 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <span className="text-3xl font-display font-bold mb-6 block">
                <span className="text-text-primary">Ride</span><span className="text-amber-600">Flow</span>
              </span>
              <p className="text-text-secondary text-lg max-w-xs mb-8 leading-relaxed">Elevating the standard of ride-hailing with unparalleled comfort and reliability.</p>
              <div className="flex gap-6">
                {[
                  { icon: '𝕏', label: 'Twitter' },
                  { icon: 'IG', label: 'Instagram' },
                  { icon: 'IN', label: 'LinkedIn' },
                ].map((social) => (
                  <motion.div 
                    key={social.label}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-full backdrop-blur-xl bg-glass-white border-glass-border flex items-center justify-center hover:bg-glass-white-strong hover:border-soft-gold/50 cursor-pointer transition-all duration-300 text-xl"
                  >{social.icon}</motion.div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-text-primary font-semibold mb-3 text-lg">Company</h4>
              {['About', 'Careers', 'Safety', 'Blog'].map(l => (
                <motion.a 
                  key={l} 
                  href="#" 
                  className="text-text-secondary hover:text-amber-600 text-lg w-fit transition-colors duration-300"
                  whileHover={{ x: 5 }}
                >
                  {l}
                </motion.a>
              ))}
            </div>
            <div>
              <h4 className="text-text-primary font-semibold mb-6 text-lg">Download the App</h4>
              <div className="flex flex-col gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard tier={2} className="flex items-center gap-4 p-4 cursor-pointer backdrop-blur-xl bg-glass-white border-glass-border hover:border-soft-gold/50 transition-all duration-300 hover:shadow-glow">
                    <div className="text-2xl"></div>
                    <div>
                      <div className="text-[11px] text-text-secondary leading-none">Download on the</div>
                      <div className="text-base font-semibold text-text-primary leading-tight">App Store</div>
                    </div>
                  </GlassCard>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard tier={2} className="flex items-center gap-4 p-4 cursor-pointer backdrop-blur-xl bg-glass-white border-glass-border hover:border-soft-gold/50 transition-all duration-300 hover:shadow-glow">
                    <div className="text-2xl text-green-600">▶</div>
                    <div>
                      <div className="text-[11px] text-text-secondary leading-none">GET IT ON</div>
                      <div className="text-base font-semibold text-text-primary leading-tight">Google Play</div>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            </div>
          </div>
          <div className="border-t border-glass-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
            <p>© 2026 RideFlow. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={authModal.isOpen} 
        mode={authModal.mode} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
      />
    </div>
  );
}
