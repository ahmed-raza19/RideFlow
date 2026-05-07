# RideFlow — Premium UI/UX Implementation Plan

> **Base**: design.md v1.0 (Warm Neutral Premium System)  
> **Upgrade Target**: High-end, futuristic, interactive — dark premium theme with layered depth  
> **Stack**: React 18 + TypeScript + Tailwind CSS + GSAP + Framer Motion + Three.js  
> **Version**: 2.0

---

## Overview

design.md v1.0 established a solid warm-neutral foundation: amber tokens, DM Serif Display, card components, role dashboards. This plan **layers a premium dark-mode upgrade** on top of that foundation — not a replacement. The result is a dual-theme system where the light mode (v1.0) remains intact for daytime/accessibility contexts, and the premium dark mode becomes the default flagship experience.

The upgrade targets three perceptual dimensions:

| Dimension | v1.0 State | v2.0 Target |
|-----------|-----------|-------------|
| **Depth** | Flat shadows, single-layer cards | Glassmorphism, layered Z-space, perspective transforms |
| **Motion** | CSS transitions, scroll-reveal | Spring physics, GSAP timelines, parallax, WebGL |
| **Premium Feel** | Clean warm minimal | Cinematic dark UI with amber/gold neon accents |

---

## Part 1 — UI/UX Strategy

### 1.1 Theme Architecture

Implement CSS custom property theming so both light (v1.0) and dark (v2.0) themes coexist and can be toggled without rewriting components.

```css
/* ── DARK PREMIUM THEME (v2.0 default) ── */
[data-theme="dark"] {
  /* Backgrounds — layered depth */
  --color-bg-base:       #0A0908;   /* Near-black, warm undertone */
  --color-bg-surface:    #111010;   /* Cards, panels */
  --color-bg-elevated:   #1A1917;   /* Modals, dropdowns */
  --color-bg-overlay:    rgba(0, 0, 0, 0.75);

  /* Glass layers */
  --glass-bg:            rgba(26, 25, 23, 0.65);
  --glass-bg-light:      rgba(255, 255, 255, 0.04);
  --glass-border:        rgba(255, 255, 255, 0.08);
  --glass-border-accent: rgba(217, 119, 6, 0.35);
  --glass-blur:          20px;
  --glass-blur-heavy:    40px;

  /* Text */
  --color-text-primary:  #F5F0E8;   /* Warm white — matches beige DNA */
  --color-text-secondary:#A89880;   /* Muted warm grey */
  --color-text-muted:    #5C5245;

  /* Amber/Gold accents — same hue family, boosted luminosity */
  --color-accent-600:    #D97706;   /* Base amber */
  --color-accent-500:    #F59E0B;   /* Hover */
  --color-accent-400:    #FBBF24;   /* Glow / highlight */
  --color-neon-amber:    #FFB800;   /* Neon version for glows */

  /* Secondary accent — deep copper/rose for variety */
  --color-accent-alt:    #C2410C;   /* Burnt orange — depth accent */

  /* Borders */
  --color-border:        rgba(255, 255, 255, 0.07);
  --color-border-focus:  rgba(217, 119, 6, 0.7);

  /* Shadows — amber-tinted for premium warmth */
  --shadow-sm:   0 1px 4px rgba(0,0,0,0.4);
  --shadow-md:   0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
  --shadow-lg:   0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
  --shadow-glow: 0 0 24px rgba(217, 119, 6, 0.25), 0 0 48px rgba(217, 119, 6, 0.12);
  --shadow-glow-intense: 0 0 16px rgba(251,191,36,0.5), 0 0 40px rgba(217,119,6,0.3);

  /* Perspective */
  --perspective-card:    1200px;
  --perspective-scene:   800px;
}
```

### 1.2 Typographic Upgrade

Retain DM Serif Display for headlines. Upgrade body to **DM Sans Variable** for optical sizing control. Add a monospace layer for data/stats.

```css
@import url('https://fonts.googleapis.com/css2?
  family=DM+Serif+Display:ital@0;1
  &family=DM+Sans:opsz,wght@9..40,300..700
  &family=DM+Mono:wght@400;500
  &display=swap'
);

:root {
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'DM Mono', 'Fira Code', monospace;

  /* Optical sizing — text renders sharper at small sizes */
  --font-feature-body: "kern" 1, "liga" 1, "calt" 1;
  --font-feature-display: "kern" 1, "liga" 1, "swsh" 1;
}

/* Headline glow effect on dark theme */
[data-theme="dark"] .display-hero {
  background: linear-gradient(135deg, #F5F0E8 0%, #D97706 60%, #FBBF24 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 32px rgba(217,119,6,0.3));
}
```

### 1.3 Spatial Hierarchy — Z-Layers

Define explicit layering so depth reads correctly across all components:

```
Z-Layer 0: Page background         — #0A0908
Z-Layer 1: Section surfaces        — #111010 (2px subtle elevation)
Z-Layer 2: Cards / panels          — #1A1917 (glass over surface)
Z-Layer 3: Sticky navbar           — glass blur over layer 2
Z-Layer 4: Floating CTAs, toasts   — pronounced shadow
Z-Layer 5: Modals / drawers        — full backdrop blur
Z-Layer 6: Tooltips                — max elevation
```

Map this to CSS z-index scale:
```css
:root {
  --z-base:    0;
  --z-card:    10;
  --z-sticky:  50;
  --z-float:   100;
  --z-modal:   200;
  --z-tooltip: 300;
}
```

### 1.4 Grid Principles

- Desktop: 12-column grid, 24px gutters, 1200px max
- Intentional asymmetry: hero uses 5/7 split instead of 6/6
- Break grid deliberately for accent elements (amber rule lines, oversized numbers)
- Section padding: `clamp(5rem, 10vw, 9rem)` — generous vertical breathing room

---

## Part 2 — Component Design System

### 2.1 Glassmorphism Card System

Three glass tiers with different blur/opacity levels:

```css
/* Tier 1 — Subtle glass (info cards, steps) */
.glass-1 {
  background: rgba(26, 25, 23, 0.6);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

/* Tier 2 — Feature glass (vehicle cards, dashboard panels) */
.glass-2 {
  background: rgba(20, 19, 18, 0.72);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.09);
  border-top: 1px solid rgba(255,255,255,0.14);
  box-shadow:
    var(--shadow-lg),
    inset 0 1px 0 rgba(255,255,255,0.06);
}

/* Tier 3 — Premium glass (modals, hero card, featured) */
.glass-3 {
  background: rgba(15, 14, 13, 0.82);
  backdrop-filter: blur(40px) saturate(180%) brightness(1.05);
  -webkit-backdrop-filter: blur(40px) saturate(180%) brightness(1.05);
  border: 1px solid rgba(217,119,6,0.18);
  border-top: 1px solid rgba(217,119,6,0.3);
  box-shadow:
    0 32px 80px rgba(0,0,0,0.7),
    0 0 0 1px rgba(255,255,255,0.04),
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 0 40px rgba(217,119,6,0.08);
}

/* Amber glass variant — for active/selected states */
.glass-amber {
  background: rgba(217, 119, 6, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(217,119,6,0.3);
  box-shadow: 0 0 24px rgba(217,119,6,0.15), inset 0 1px 0 rgba(251,191,36,0.1);
}
```

### 2.2 Premium Button System

Five button archetypes — each with distinct hover morphing behavior:

```css
/* ── 1. Amber Solid (primary CTA) ── */
.btn-primary {
  background: var(--color-accent-600);
  color: #0A0908;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  padding: 14px 32px;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease;
}
.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.btn-primary::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #FBBF24, #D97706, #C2410C);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.25s ease;
  filter: blur(8px);
}
.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-glow-intense);
}
.btn-primary:hover::before { opacity: 1; }
.btn-primary:hover::after  { opacity: 0.7; }
.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

/* ── 2. Glass Button (secondary/nav) ── */
.btn-glass {
  background: var(--glass-bg-light);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  color: var(--color-text-primary);
  border-radius: var(--radius-full);
  padding: 13px 28px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease;
}
.btn-glass:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(217,119,6,0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(217,119,6,0.2);
}

/* ── 3. Gradient Border Button ── */
.btn-gradient-border {
  background: transparent;
  color: var(--color-accent-400);
  border: none;
  border-radius: var(--radius-full);
  padding: 13px 28px;
  position: relative;
  isolation: isolate;
}
.btn-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  padding: 1.5px;
  background: linear-gradient(135deg, #FBBF24, #D97706, #C2410C);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
}
.btn-gradient-border:hover {
  background: rgba(217,119,6,0.08);
  transform: translateY(-1px);
}

/* ── 4. Neon Glow Button (accent action, driver accept) ── */
.btn-neon {
  background: var(--color-accent-600);
  color: #000;
  font-weight: 700;
  border-radius: var(--radius-md);
  padding: 14px 32px;
  border: none;
  position: relative;
  transition: all 0.2s ease;
  text-shadow: 0 0 12px rgba(255,184,0,0.6);
}
.btn-neon:hover {
  background: var(--color-neon-amber);
  box-shadow:
    0 0 12px rgba(255,184,0,0.6),
    0 0 32px rgba(255,184,0,0.35),
    0 0 64px rgba(255,184,0,0.15);
  transform: translateY(-2px);
}

/* ── 5. Icon Button (close, toggle) ── */
.btn-icon {
  width: 40px; height: 40px;
  background: var(--glass-bg-light);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
  color: var(--color-text-secondary);
}
.btn-icon:hover {
  background: rgba(217,119,6,0.12);
  border-color: rgba(217,119,6,0.3);
  color: var(--color-accent-400);
  transform: scale(1.08);
}
```

### 2.3 Form Input System — Dark Premium

```css
.form-input-dark {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  padding: 14px 16px;
  font-family: var(--font-body);
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
  outline: none;
  width: 100%;
}
.form-input-dark::placeholder { color: var(--color-text-muted); }
.form-input-dark:focus {
  background: rgba(217,119,6,0.05);
  border-color: rgba(217,119,6,0.5);
  box-shadow:
    0 0 0 3px rgba(217,119,6,0.12),
    0 0 16px rgba(217,119,6,0.08);
}

/* Animated label (float-up on focus) */
.form-field {
  position: relative;
  margin-bottom: 24px;
}
.form-field label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 1rem;
  pointer-events: none;
  transition:
    top 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    font-size 0.2s ease,
    color 0.2s ease;
}
.form-field input:focus ~ label,
.form-field input:not(:placeholder-shown) ~ label {
  top: 8px;
  font-size: 0.7rem;
  color: var(--color-accent-400);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.form-field input:focus { padding-top: 22px; padding-bottom: 6px; }
```

### 2.4 Navigation — Sticky Glass Navbar

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky);
  height: 72px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

/* State: at top */
.navbar[data-state="top"] {
  background: transparent;
  border-bottom: 1px solid transparent;
}

/* State: scrolled */
.navbar[data-state="scrolled"] {
  background: rgba(10, 9, 8, 0.82);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 32px rgba(0,0,0,0.4);
}

/* Animated underline on nav links */
.nav-link {
  position: relative;
  color: rgba(245,240,232,0.7);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  padding: 4px 0;
  transition: color 0.2s ease;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1.5px;
  background: linear-gradient(to right, var(--color-accent-600), var(--color-accent-400));
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 1px;
}
.nav-link:hover { color: var(--color-accent-400); }
.nav-link:hover::after { width: 100%; }
```

### 2.5 Vehicle Cards — 3D Tilt + Glow

```css
.vehicle-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 32px 28px;
  cursor: pointer;
  transform-style: preserve-3d;
  transform: perspective(var(--perspective-card)) rotateX(0) rotateY(0);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* Gradient sweep on hover — implemented via JS mousemove */
.vehicle-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(217, 119, 6, 0.07),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: inherit;
  pointer-events: none;
}
.vehicle-card:hover::before { opacity: 1; }
.vehicle-card:hover {
  border-color: rgba(217, 119, 6, 0.4);
  box-shadow:
    var(--shadow-lg),
    0 0 32px rgba(217, 119, 6, 0.12),
    inset 0 1px 0 rgba(255,255,255,0.08);
}
```

JavaScript for card tilt + radial gradient tracking:
```javascript
// vehicle-tilt.js
document.querySelectorAll('.vehicle-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const rotateX = ((y - cy) / cy) * -6;  // max ±6deg
    const rotateY = ((x - cx) / cx) * 6;

    card.style.transform =
      `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) scale(1)';
  });
});
```

### 2.6 Stats / KPI Cards — Animated Counters + Glow

```css
.stat-card-premium {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 28px 24px;
  position: relative;
  overflow: hidden;
}

/* Corner accent glow */
.stat-card-premium::after {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(217,119,6,0.2) 0%, transparent 70%);
  pointer-events: none;
}

.stat-value-large {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  background: linear-gradient(135deg, #F5F0E8, #D97706);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  letter-spacing: -0.02em;
}
```

---

## Part 3 — Animation & Interaction Layer

### 3.1 Library Stack

| Library | Version | Purpose | Bundle Impact |
|---------|---------|---------|--------------|
| **GSAP** | 3.12+ | Core timeline animations, scroll triggers, morphing | ~68kb |
| **GSAP ScrollTrigger** | (plugin) | Scroll-driven animations, parallax, pinning | +28kb |
| **GSAP Flip** | (plugin) | Layout transition morphing (vehicle selector) | +12kb |
| **Framer Motion** | 11+ | React component animations, spring physics | ~47kb (tree-shaken) |
| **Three.js** | r160+ | Hero WebGL scene, 3D car model | ~150kb base |
| **Lenis** | 1.1+ | Smooth scroll momentum (replaces native scroll) | ~8kb |
| **react-spring** | 9+ | Physics-based React state animations | ~38kb |

**Load strategy**: GSAP + Lenis critical. Three.js deferred via dynamic import after LCP. Framer Motion tree-shaken per component.

### 3.2 Page Load Sequence (GSAP Master Timeline)

```javascript
// page-load.js — fires on DOMContentLoaded
import { gsap } from 'gsap';

const masterTimeline = gsap.timeline({ defaults: { ease: 'expo.out' } });

masterTimeline
  // 1. Nav slides down
  .from('.navbar', { y: -72, opacity: 0, duration: 0.7 })

  // 2. Hero label fades in
  .from('.hero-label', { y: 12, opacity: 0, duration: 0.5 }, '-=0.3')

  // 3. H1 — words stagger in
  .from('.hero-headline .word', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    stagger: 0.08,
    ease: 'power3.out'
  }, '-=0.2')

  // 4. Subheadline + CTA
  .from(['.hero-sub', '.hero-actions'], {
    y: 20,
    opacity: 0,
    duration: 0.6,
    stagger: 0.15
  }, '-=0.3')

  // 5. Hero illustration slides in from right
  .from('.hero-illustration', {
    x: 80,
    opacity: 0,
    duration: 0.9,
    ease: 'expo.out'
  }, '-=0.7')

  // 6. Subtle ambient glow pulses in
  .from('.hero-glow', {
    scale: 0.7,
    opacity: 0,
    duration: 1.5,
    ease: 'sine.out'
  }, '-=0.8');
```

Word-splitting utility for headline animation:
```javascript
// Split headline text into .word spans for stagger
function splitWords(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.innerHTML = el.textContent
      .split(' ')
      .map(w => `<span class="word" style="display:inline-block">${w}</span>`)
      .join(' ');
  });
}
splitWords('.hero-headline');
```

### 3.3 Scroll-Triggered Animations (GSAP ScrollTrigger)

```javascript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// ── Section title reveal ──
gsap.utils.toArray('.section-title').forEach(title => {
  gsap.from(title, {
    scrollTrigger: { trigger: title, start: 'top 80%', toggleActions: 'play none none reverse' },
    y: 32, opacity: 0, duration: 0.75, ease: 'expo.out'
  });
});

// ── Cards stagger ──
gsap.utils.toArray('.card-group').forEach(group => {
  const cards = group.querySelectorAll('.card, .glass-2');
  gsap.from(cards, {
    scrollTrigger: { trigger: group, start: 'top 75%' },
    y: 48, opacity: 0, duration: 0.7,
    stagger: { amount: 0.4, from: 'start', ease: 'power2.out' },
    ease: 'expo.out'
  });
});

// ── Number counter animation ──
gsap.utils.toArray('[data-counter]').forEach(el => {
  const target = parseInt(el.dataset.counter);
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target, duration: 1.8, ease: 'power2.out',
        onUpdate() { el.textContent = Math.round(this.targets()[0].val).toLocaleString(); }
      });
    }
  });
});

// ── Parallax layers ──
gsap.utils.toArray('[data-parallax]').forEach(el => {
  const speed = parseFloat(el.dataset.parallax) || 0.3;
  gsap.to(el, {
    y: () => -(ScrollTrigger.maxScroll(window) * speed * 0.15),
    ease: 'none',
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true }
  });
});
```

### 3.4 Framer Motion — React Component Animations

**Spring physics configuration presets:**
```typescript
// motion-presets.ts
export const springs = {
  snappy:  { type: 'spring', stiffness: 400, damping: 28 },
  smooth:  { type: 'spring', stiffness: 200, damping: 30 },
  bouncy:  { type: 'spring', stiffness: 350, damping: 20, mass: 0.8 },
  slow:    { type: 'spring', stiffness: 80,  damping: 20 },
} as const;

export const fadeSlideUp = {
  initial:   { opacity: 0, y: 24 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -12 },
  transition: springs.smooth,
};

export const scaleIn = {
  initial:   { opacity: 0, scale: 0.92 },
  animate:   { opacity: 1, scale: 1 },
  exit:      { opacity: 0, scale: 0.95 },
  transition: springs.snappy,
};

export const modalVariants = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: springs.snappy },
  exit:    { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.18 } },
};

export const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};
```

**Modal component with AnimatePresence:**
```tsx
// AuthModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants, overlayVariants } from './motion-presets';

export function AuthModal({ isOpen, onClose, mode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            variants={overlayVariants}
            initial="hidden" animate="visible" exit="exit"
            onClick={onClose}
          />
          <motion.div
            className="modal-card glass-3"
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            role="dialog"
            aria-modal="true"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                variants={fadeSlideUp}
                initial="initial" animate="animate" exit="exit"
              >
                {mode === 'signin' ? <SignInForm /> : <SignUpForm />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Ride request card — spring physics bounce:**
```tsx
// RideRequestCard.tsx
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

export function RideRequestCard({ request, onAccept, onDecline }) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);
  const color = useTransform(x, [-100, 0, 100], ['#DC2626', '#D97706', '#059669']);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      className="ride-request-card glass-3"
      style={{ x: springX, opacity }}
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onAccept();
        else if (info.offset.x < -100) onDecline();
      }}
    >
      {/* Swipe hint indicators */}
      <motion.div className="swipe-indicator decline" style={{ opacity: useTransform(x, [-50, -150], [0, 1]) }}>✕ Decline</motion.div>
      <motion.div className="swipe-indicator accept"  style={{ opacity: useTransform(x, [50, 150], [0, 1]) }}>✓ Accept</motion.div>
      {/* Card content */}
    </motion.div>
  );
}
```

### 3.5 Lenis Smooth Scroll

```javascript
// smooth-scroll.js
import Lenis from 'lenis';

const lenis = new Lenis({
  duration: 1.2,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.5,
});

// Sync with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### 3.6 Micro-Interaction Inventory

| Interaction | Trigger | Animation | Library |
|-------------|---------|-----------|---------|
| Button press | mousedown | scale(0.97) → release scale(1.04) → 1 | CSS |
| Nav link hover | mouseenter | underline width 0→100% | CSS transition |
| Card hover | mouseenter | translateY(-4px) + shadow shift | CSS + JS tilt |
| Input focus | focus | label float up + border amber glow | CSS + JS |
| Toggle switch | click | knob spring-slide + background morph | Framer Motion |
| Vehicle select | click | GSAP Flip layout transition | GSAP Flip |
| Modal open | trigger | scale + opacity + backdrop blur | Framer Motion |
| Number ticker | scroll-enter | 0 → target in 1.8s | GSAP counter |
| Loading state | data fetch | pulsing shimmer skeleton | CSS animation |
| Toast notification | event | slide in from top-right | Framer Motion |
| Ride request | arrival | pulse-border + bounce-in | GSAP + CSS |
| Map car pin | position update | smooth interpolated move | CSS transition |
| Online toggle | driver action | ripple + color flood | CSS + JS |

---

## Part 4 — 3D Integration Plan

### 4.1 Hero Section — Three.js Ambient Scene

A subtle, non-blocking 3D element in the hero background. Renders a slow-rotating abstract geometry using amber/gold color scheme. Deferred after LCP.

```javascript
// hero-3d.js — loaded dynamically post-LCP
import * as THREE from 'three';

class HeroScene {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,       // transparent background
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap at 1.5x
    this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    this.camera.position.set(0, 0, 5);

    this.buildGeometry();
    this.buildLights();
    this.bindMouseParallax();
    this.animate();
  }

  buildGeometry() {
    // Icosahedron wireframe — premium, not "blobby"
    const geo  = new THREE.IcosahedronGeometry(1.8, 1);
    const mat  = new THREE.MeshStandardMaterial({
      color: 0xD97706,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.35,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);

    // Wireframe overlay for depth
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xFBBF24,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    this.wire = new THREE.Mesh(geo, wireMat);
    this.scene.add(this.wire);
  }

  buildLights() {
    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.2);
    const point1  = new THREE.PointLight(0xD97706, 3, 10);
    const point2  = new THREE.PointLight(0xC2410C, 2, 8);
    point1.position.set(3, 2, 2);
    point2.position.set(-3, -1, 1);
    this.scene.add(ambient, point1, point2);
  }

  bindMouseParallax() {
    this.mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', e => {
      this.mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const t = performance.now() * 0.0003;

    this.mesh.rotation.x = t * 0.4 + this.mouse.y * 0.15;
    this.mesh.rotation.y = t * 0.6 + this.mouse.x * 0.15;
    this.wire.rotation.x = this.mesh.rotation.x;
    this.wire.rotation.y = this.mesh.rotation.y;

    this.renderer.render(this.scene, this.camera);
  }
}

// Deferred load — only after page LCP
window.addEventListener('load', () => {
  const canvas = document.querySelector('#hero-canvas');
  if (canvas) new HeroScene(canvas);
});
```

**Canvas placement in hero:**
```html
<canvas
  id="hero-canvas"
  aria-hidden="true"
  style="
    position: absolute;
    right: -5%;
    top: 50%;
    transform: translateY(-50%);
    width: 520px;
    height: 520px;
    pointer-events: none;
    opacity: 0.6;
  "
></canvas>
```

### 4.2 Dashboard Map — 3D Perspective Tilt

The map panel in both Rider and Driver dashboards uses a subtle CSS 3D perspective tilt to give depth — no WebGL required here.

```css
.map-panel {
  border-radius: 20px;
  overflow: hidden;
  transform: perspective(800px) rotateX(4deg);
  transform-origin: top center;
  box-shadow:
    0 24px 64px rgba(0,0,0,0.5),
    0 0 0 1px rgba(255,255,255,0.05);
  transition: transform 0.4s ease;
}
.map-panel:hover {
  transform: perspective(800px) rotateX(0deg);
}

/* Gradient overlay at bottom for depth effect */
.map-panel::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 40%;
  background: linear-gradient(to top, rgba(10,9,8,0.6), transparent);
  pointer-events: none;
}
```

### 4.3 Vehicle Selector — 3D Card Flip (GSAP Flip)

When a user switches vehicle type in the rider dashboard, the selected card "flips" to reveal pricing details.

```javascript
// vehicle-flip.js
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
gsap.registerPlugin(Flip);

let activeCard = null;

document.querySelectorAll('.vehicle-option').forEach(card => {
  card.addEventListener('click', function() {
    if (activeCard === this) return;

    const state = Flip.getState('.vehicle-option');
    activeCard?.classList.remove('expanded');
    this.classList.add('expanded');
    activeCard = this;

    Flip.from(state, {
      duration: 0.5,
      ease: 'expo.out',
      absolute: true,
      onEnter: els => gsap.from(els, { opacity: 0, scale: 0.96, duration: 0.3 }),
      onLeave: els => gsap.to(els,   { opacity: 0, scale: 0.96, duration: 0.3 }),
    });
  });
});
```

### 4.4 Admin Dashboard — Earnings Chart (Canvas + GSAP)

Use a custom canvas chart (or Chart.js with amber theming) with GSAP-driven draw animation:

```javascript
// earnings-chart.js — custom canvas draw with GSAP
function drawAmberLineChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Gradient fill under line
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0,   'rgba(217,119,6,0.35)');
  gradient.addColorStop(0.7, 'rgba(217,119,6,0.05)');
  gradient.addColorStop(1,   'rgba(217,119,6,0)');

  // GSAP-animated draw progress
  const progress = { value: 0 };
  gsap.to(progress, {
    value: 1, duration: 1.6, ease: 'power3.out',
    onUpdate() {
      ctx.clearRect(0, 0, W, H);
      drawPartialLine(ctx, data, progress.value, gradient, W, H);
    },
    scrollTrigger: { trigger: canvas, start: 'top 80%' }
  });
}
```

### 4.5 Performance Gates for 3D

```javascript
// performance-gate.js
const shouldUse3D = (() => {
  // Skip on low-end devices
  const memory    = navigator.deviceMemory;           // GB
  const cores     = navigator.hardwareConcurrency;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return false;
  if (memory && memory < 4) return false;
  if (cores && cores < 4)   return false;

  // Check WebGL support
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch { return false; }
})();

if (shouldUse3D) {
  import('./hero-3d.js');
}
```

---

## Part 5 — Styling Approach

### 5.1 Architecture Decision

**Choice: Custom CSS Properties + Tailwind CSS (utility layer)**

Rationale:
- CSS custom properties handle theming (light/dark switch with one attribute)
- Tailwind handles utility spacing, flex/grid — eliminates repetitive layout CSS
- No Tailwind resets conflict with our glass components since we use `@layer components`
- Critical CSS (above-fold) inlined; rest loaded async

```
Styling stack:
  ├── tokens.css         (CSS vars — colors, spacing, typography)
  ├── base.css           (reset, body, smooth scroll)
  ├── components.css     (glass cards, buttons, forms — hand-crafted)
  ├── animations.css     (keyframes, transition utilities)
  └── tailwind.css       (utilities layer — spacing, flex, grid only)
```

### 5.2 Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0A0908',
          surface: '#111010',
          elevated:'#1A1917',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          neon: '#FFB800',
        },
        text: {
          warm:  '#F5F0E8',
          muted: '#A89880',
        }
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        'xl2': '20px',
        'xl3': '28px',
      },
      backdropBlur: {
        xs: '4px',
        xl: '40px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s linear infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(217,119,6,0.2)' },
          '50%':      { boxShadow: '0 0 32px rgba(217,119,6,0.5)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ]
};
```

### 5.3 Critical CSS Inlining Strategy

Inline these styles in `<head>` (< 8kb total):
- CSS variable declarations (`:root` block)
- Body background + font declarations
- Navbar initial state
- Hero text styles (prevents FOUT)

Everything else loads via `<link rel="stylesheet" media="print" onload="this.media='all'">`.

---

## Part 6 — Performance Considerations

### 6.1 Animation Performance Rules

| Rule | Implementation |
|------|---------------|
| Only animate `transform` and `opacity` on DOM elements | Never animate `width`, `height`, `top`, `left` |
| Use `will-change: transform` on elements that animate | Apply only during active animation, remove after |
| Cap canvas pixel ratio at 1.5× | `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))` |
| Pause animations when tab not visible | `document.addEventListener('visibilitychange', ...)` |
| Debounce mousemove handlers at 16ms | `requestAnimationFrame` debounce pattern |
| Reduce animation duration on battery saver | `navigator.getBattery().then(b => b.charging)` |

### 6.2 Asset Optimization

```
Images:
  ├── Hero illustration → SVG (zero bytes for icons)
  ├── Car images → WebP, srcset 1x/2x, loading="lazy"
  ├── Avatar thumbnails → 64×64px WebP, preloaded
  └── Map tiles → external CDN (Mapbox/Google)

Fonts:
  ├── Subset to Latin + display characters only (saves ~60%)
  ├── preconnect to fonts.googleapis.com
  ├── font-display: swap on all families
  └── Variable fonts: one file covers all weights

3D / Canvas:
  ├── Three.js split via dynamic import()
  ├── Canvas renders at half size, CSS scaled 2× for blur scenes
  └── Intersection Observer pauses render loop when off-screen
```

### 6.3 Bundle Size Targets

| Chunk | Target | Strategy |
|-------|--------|----------|
| Critical CSS | < 8kb gzip | Inline in `<head>` |
| Main JS bundle | < 80kb gzip | Tree-shaking, code-split |
| GSAP (with plugins) | < 40kb gzip | Import only used plugins |
| Framer Motion | < 25kb gzip | Per-component import |
| Three.js | < 80kb gzip | Dynamic import, deferred |
| Total page weight | < 350kb gzip | Lazy load everything below fold |

### 6.4 Loading States — Skeleton Screens

Replace spinners with skeleton screens that mirror real content layout:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 0%,
    rgba(255,255,255,0.08) 40%,
    rgba(255,255,255,0.04) 100%
  );
  background-size: 500px 100%;
  animation: shimmer 1.8s linear infinite;
  border-radius: var(--radius-md);
}
.skeleton-text  { height: 1em;  width: 60%; }
.skeleton-title { height: 1.5em; width: 80%; }
.skeleton-card  { height: 160px; }
```

### 6.5 Reduced Motion Compliance

```css
@media (prefers-reduced-motion: reduce) {
  /* Kill all CSS animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Kill Lenis smooth scroll */
  html { scroll-behavior: auto !important; }
}
```

```javascript
// GSAP global reduced motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0);  // freeze all GSAP
}
```

---

## Part 7 — Implementation Steps

### Phase 0 — Foundation (Days 1–2)

- [ ] Bootstrap React 18 + TypeScript project with Vite
- [ ] Install dependencies: `gsap`, `framer-motion`, `lenis`, `three`, `@types/three`
- [ ] Configure Tailwind with custom token extension from Section 5.2
- [ ] Create `tokens.css` with all CSS variables (light + dark theme)
- [ ] Set `data-theme="dark"` on `<html>` by default; persist preference to `localStorage`
- [ ] Configure Vite aliases: `@components`, `@hooks`, `@styles`, `@3d`
- [ ] Set up Google Fonts with `preconnect` and font-display swap
- [ ] Initialize Lenis + GSAP ticker sync

### Phase 1 — Core Components (Days 3–5)

- [ ] Build `Button` component (5 variants from Section 2.2) with Framer Motion hover
- [ ] Build `GlassCard` component (3 tiers) with optional tilt prop
- [ ] Build `FormInput` component with floating label animation
- [ ] Build `Modal` base with `AnimatePresence` backdrop + card entry
- [ ] Build `SignInModal` and `SignUpModal` using Modal base
- [ ] Build `Navbar` with scroll-state detection + glass transition
- [ ] Build `Badge`, `Toggle`, `Skeleton` components
- [ ] Add card tilt system (Section 2.5 JS) as `useTilt` React hook
- [ ] Add radial gradient mouse-tracking as `useSpotlight` hook

### Phase 2 — Landing Page (Days 6–9)

- [ ] **Hero section**: text + Three.js canvas (gated by performance check)
- [ ] **How It Works**: 3-step grid with connector line + scroll-triggered stagger
- [ ] **Vehicle Options**: 3 glass cards with tilt, hover glow, amber border
- [ ] **Safety Banner**: beige band, icon + text, scroll reveal
- [ ] **Footer**: dark background, warm text, social icons
- [ ] Wire page-load GSAP master timeline (Section 3.2)
- [ ] Wire all scroll-triggered animations (Section 3.3)
- [ ] Implement Lenis smooth scroll
- [ ] Test at 320px, 768px, 1280px, 1920px

### Phase 3 — Authentication Pages (Days 10–11)

- [ ] Modal open/close state management (Zustand or React Context)
- [ ] Sign In modal with form validation (react-hook-form + zod)
- [ ] Sign Up modal with password strength bar + phone input
- [ ] Animated tab-switch between Sign In ↔ Sign Up (Framer Motion `mode="wait"`)
- [ ] Social button hover effects
- [ ] Form submission loading state (spinner inside button)
- [ ] Error state animations (shake on invalid submit)

### Phase 4 — Role Dashboards (Days 12–18)

**Rider Dashboard (Days 12–14):**
- [ ] Sidebar / bottom nav based on viewport
- [ ] Search box with location autocomplete (debounced)
- [ ] Vehicle selector with GSAP Flip transition
- [ ] Map panel with 3D perspective tilt
- [ ] Trip history cards with skeleton loading
- [ ] Animated counter for stats (rides taken, saved destinations)

**Driver Dashboard (Days 15–16):**
- [ ] Online/offline toggle with spring animation + ripple effect
- [ ] Incoming ride request card with swipe-to-respond (Framer Motion drag)
- [ ] Stat cards with GSAP counter animation on scroll-enter
- [ ] Earnings chart (canvas, amber gradient, GSAP draw animation)
- [ ] Active trip tracking view

**Admin Dashboard (Days 17–18):**
- [ ] Dark sidebar navigation with active indicator animation
- [ ] KPI grid with animated counters + delta badges
- [ ] Revenue line chart (Chart.js, amber theme, draw animation)
- [ ] Data table with sortable columns + row hover state
- [ ] Live trip feed (simulated WebSocket, new rows slide in)

### Phase 5 — Polish & Performance (Days 19–21)

- [ ] Audit all animations against reduced-motion media query
- [ ] Run Lighthouse on all 5 pages, target: Performance > 90
- [ ] Implement critical CSS inlining (Section 5.3)
- [ ] Set up lazy loading for all below-fold images
- [ ] Verify WCAG AA contrast ratios in dark theme
- [ ] Cross-browser test: Chrome, Safari, Firefox, Edge
- [ ] Device test: iPhone 14, iPad Pro, Samsung S24, MacBook
- [ ] Performance gate for Three.js (Section 4.5)
- [ ] Remove all `will-change` declarations not actively needed
- [ ] Final bundle analysis with `vite-bundle-analyzer`

---

## Appendix A — Color Palette Reference (Dark Premium)

```
Primary Backgrounds:
  #0A0908  Base (near-black, warm)
  #111010  Surface
  #1A1917  Elevated

Amber Accent Scale:
  #C2410C  Deep copper-orange (depth accent)
  #D97706  Amber 600 (primary)
  #F59E0B  Amber 500 (hover)
  #FBBF24  Amber 400 (highlights, gradients)
  #FFB800  Neon amber (glow effects only)
  #FEF3C7  Amber 100 (light tint backgrounds)

Text:
  #F5F0E8  Warm white (primary)
  #A89880  Warm grey (secondary)
  #5C5245  Muted (placeholder, disabled)

Glass:
  rgba(26, 25, 23, 0.65)   Glass bg
  rgba(255,255,255, 0.04)  Glass bg light
  rgba(255,255,255, 0.08)  Glass border
  rgba(217,119,6,  0.35)  Glass border accent

Status:
  #059669  Success green
  #DC2626  Error red
```

## Appendix B — Quick Dependency Install

```bash
# Core
npm install gsap @gsap/react framer-motion lenis

# 3D
npm install three @types/three

# Forms
npm install react-hook-form zod @hookform/resolvers

# UI utilities
npm install clsx tailwind-merge

# Charts
npm install chart.js react-chartjs-2

# Dev
npm install -D tailwindcss @tailwindcss/forms vite-bundle-visualizer
```

---

*RideFlow Implementation Plan v2.0 — Premium Dark UI Upgrade*  
*Base: design.md v1.0 | Animation: GSAP + Framer Motion | 3D: Three.js | Scroll: Lenis*
