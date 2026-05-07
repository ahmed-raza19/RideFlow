# RideFlow — Complete Design System & Implementation Guide

> **Version**: 1.0  
> **Theme**: Warm Neutral Premium  
> **Stack**: HTML5 / CSS3 / Vanilla JS (no framework dependency)

---

## 1. Design Philosophy

RideFlow is positioned as a **premium, human-centric** ride-hailing experience. Every design decision reinforces three values:

| Value | Expression |
|-------|-----------|
| **Warmth** | Amber/gold accents, beige backgrounds, rounded corners |
| **Trust** | High contrast text, clear hierarchy, no dark patterns |
| **Sophistication** | Generous whitespace, serif display headlines, restrained motion |

**What we avoid:**
- Purple/blue gradients (feels cold, generic tech)
- 3D abstract blobs or AI-generated decorative shapes
- Emojis used as icons (use SVG icon set instead)
- Alternating white/grey section backgrounds (creates visual boredom)
- Neon or saturated colors anywhere in the UI

---

## 2. Color System

```css
:root {
  /* ── Backgrounds ── */
  --color-bg-primary:    #FAF7F2;   /* Main page background — warm off-white */
  --color-bg-secondary:  #F5F0E8;   /* Section/card background — warm beige */
  --color-bg-elevated:   #FFFFFF;   /* Cards, modals, dropdowns */
  --color-bg-overlay:    rgba(31, 41, 55, 0.55); /* Modal backdrop */

  /* ── Text ── */
  --color-text-primary:  #1F2937;   /* Headings, body — charcoal */
  --color-text-secondary:#4B5563;   /* Subtext, captions */
  --color-text-muted:    #9CA3AF;   /* Placeholder, disabled */
  --color-text-inverse:  #FFFFFF;   /* Text on dark/amber backgrounds */

  /* ── Accent — Amber/Gold ── */
  --color-accent-600:    #D97706;   /* Primary buttons, active states */
  --color-accent-500:    #F59E0B;   /* Hover states, highlights */
  --color-accent-100:    #FEF3C7;   /* Soft amber backgrounds, badges */
  --color-accent-50:     #FFFBEB;   /* Very light amber tint */

  /* ── Borders ── */
  --color-border:        #E5DDD0;   /* Warm-tinted border (not cold grey) */
  --color-border-focus:  #D97706;   /* Input focus ring */

  /* ── Status ── */
  --color-success:       #059669;
  --color-warning:       #D97706;
  --color-error:         #DC2626;

  /* ── Shadows ── */
  --shadow-sm:   0 1px 3px rgba(31, 41, 55, 0.06), 0 1px 2px rgba(31, 41, 55, 0.04);
  --shadow-md:   0 4px 16px rgba(31, 41, 55, 0.08), 0 2px 6px rgba(31, 41, 55, 0.05);
  --shadow-lg:   0 12px 40px rgba(31, 41, 55, 0.12), 0 4px 12px rgba(31, 41, 55, 0.07);
  --shadow-xl:   0 24px 64px rgba(31, 41, 55, 0.16);
}
```

---

## 3. Typography

```css
/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');

:root {
  /* Display / Headlines */
  --font-display: 'DM Serif Display', Georgia, serif;

  /* Body / UI */
  --font-body:    'DM Sans', system-ui, -apple-system, sans-serif;

  /* Scale */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */
  --text-5xl:  3rem;       /* 48px */
  --text-6xl:  3.75rem;    /* 60px */

  /* Weights */
  --weight-light:   300;
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semibold:600;
  --weight-bold:    700;

  /* Line heights */
  --leading-tight:  1.2;
  --leading-snug:   1.35;
  --leading-normal: 1.5;
  --leading-relaxed:1.65;
}

/* Usage classes */
.display-hero    { font-family: var(--font-display); font-size: var(--text-6xl); line-height: var(--leading-tight); color: var(--color-text-primary); }
.display-section { font-family: var(--font-display); font-size: var(--text-4xl); line-height: var(--leading-snug);  color: var(--color-text-primary); }
.display-card    { font-family: var(--font-display); font-size: var(--text-2xl); line-height: var(--leading-snug);  color: var(--color-text-primary); }
.body-large      { font-family: var(--font-body);    font-size: var(--text-lg);  line-height: var(--leading-relaxed); color: var(--color-text-secondary); }
.body-base       { font-family: var(--font-body);    font-size: var(--text-base);line-height: var(--leading-normal);  color: var(--color-text-secondary); }
.label           { font-family: var(--font-body);    font-size: var(--text-sm);  font-weight: var(--weight-semibold); letter-spacing: 0.05em; text-transform: uppercase; }
```

---

## 4. Spacing & Layout

```css
:root {
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   18px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  --container-max: 1200px;
  --container-pad: clamp(1rem, 5vw, 3rem);
}

.container {
  width: 100%;
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-pad);
}
```

---

## 5. Component Library

### 5.1 Buttons

```css
/* ── Base Button ── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
  font-size: var(--text-base);
  line-height: 1;
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

/* Primary — Amber fill */
.btn-primary {
  background: var(--color-accent-600);
  color: var(--color-text-inverse);
  padding: var(--space-3) var(--space-6);
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.28);
}
.btn-primary:hover {
  background: var(--color-accent-500);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(217, 119, 6, 0.38);
}
.btn-primary:active  { transform: translateY(0); }

/* Secondary — Outlined */
.btn-secondary {
  background: transparent;
  color: var(--color-accent-600);
  border-color: var(--color-accent-600);
  padding: var(--space-3) var(--space-6);
}
.btn-secondary:hover {
  background: var(--color-accent-50);
  transform: translateY(-1px);
}

/* Ghost — Text only */
.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
  padding: var(--space-2) var(--space-4);
}
.btn-ghost:hover { color: var(--color-accent-600); }

/* Social — Google/Apple */
.btn-social {
  width: 100%;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  font-weight: var(--weight-medium);
}
.btn-social:hover { background: var(--color-bg-secondary); }

/* Sizes */
.btn-sm { font-size: var(--text-sm); padding: var(--space-2) var(--space-4); }
.btn-lg { font-size: var(--text-lg); padding: var(--space-4) var(--space-8); }
```

### 5.2 Form Inputs

```css
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }

.form-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.form-input {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  width: 100%;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  outline: none;
}
.form-input::placeholder { color: var(--color-text-muted); }
.form-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}
.form-input.error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.10);
}

.form-hint  { font-size: var(--text-xs); color: var(--color-text-muted); }
.form-error { font-size: var(--text-xs); color: var(--color-error); }
```

### 5.3 Cards

```css
.card {
  background: var(--color-bg-elevated);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-accent-500);
}

.card-vehicle {
  text-align: center;
  border-top: 3px solid transparent;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
}
.card-vehicle:hover {
  border-top-color: var(--color-accent-600);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}
```

### 5.4 Divider with Label

```css
.divider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
```

### 5.5 Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}
.badge-amber {
  background: var(--color-accent-100);
  color: var(--color-accent-600);
}
.badge-success {
  background: #D1FAE5;
  color: var(--color-success);
}
```

---

## 6. Landing Page — Section Specifications

### 6.1 Navbar

**Structure:**
```
[Logo: RideFlow]    [Ride] [Drive] [Safety] [Support]    [Sign In] [Sign Up]
```

**Specs:**
- Height: 72px
- Background: `#FAF7F2` with `backdrop-filter: blur(12px)` when sticky
- Bottom border: `1px solid var(--color-border)` on scroll
- Logo: DM Serif Display, 22px, `#1F2937`. Optional amber dot or slash after "Flow"
- Nav links: DM Sans Medium 15px, `#4B5563`, hover → `#D97706`
- Sign In: Ghost button style
- Sign Up: `btn-primary btn-sm`
- Mobile: hamburger collapses to full-width drawer

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(250, 247, 242, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}
.navbar.scrolled { border-bottom-color: var(--color-border); }

.nav-logo {
  font-family: var(--font-display);
  font-size: 1.375rem;
  color: var(--color-text-primary);
  text-decoration: none;
}
.nav-logo span { color: var(--color-accent-600); } /* "Flow" in amber */
```

---

### 6.2 Hero Section

**Content:**
- Pre-headline label: `PREMIUM RIDE-HAILING` (label class, amber)
- H1: `Your ride. Your flow.` (DM Serif Display, 64px desktop / 40px mobile)
- Subheadline: `Premium vehicles, professional drivers, and seamless booking. Warm service, every ride.` (DM Sans, 18px, secondary color)
- CTA: `Request a Ride` (btn-primary btn-lg) + secondary `Learn More` (btn-ghost)
- Visual: SVG illustration — a minimal top-down view of a sleek car on a road with warm amber headlights, or a phone mockup showing the app UI

**Layout:** 2-column grid (text left, illustration right) on desktop. Single column on mobile.

```css
.hero {
  padding-block: var(--space-32) var(--space-24);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-16);
  align-items: center;
}
@media (max-width: 768px) {
  .hero { grid-template-columns: 1fr; padding-block: var(--space-16); }
  .hero-visual { order: -1; }
}

.hero-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent-600);
  margin-bottom: var(--space-4);
}
.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  line-height: 1.1;
  color: var(--color-text-primary);
  margin-bottom: var(--space-5);
}
.hero-sub {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
  max-width: 46ch;
  margin-bottom: var(--space-8);
}
.hero-actions { display: flex; gap: var(--space-4); flex-wrap: wrap; }
```

---

### 6.3 How It Works

**Content:**
- Section title: `How RideFlow Works`
- 3 steps in a row:

| # | Icon | Title | Description |
|---|------|-------|-------------|
| 1 | Smartphone SVG | Open the App | Download RideFlow and create your account in minutes |
| 2 | Map pin SVG | Set Your Destination | Enter where you're going — we'll find the best route |
| 3 | Car SVG | Ride in Comfort | Your driver arrives, you relax and enjoy the journey |

**Visual treatment:** Each step has a large amber-tinted circular icon container, a step number in small muted text, title in display font, description in body font.

```css
.how-it-works {
  padding-block: var(--space-24);
  background: var(--color-bg-secondary);
}
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
  position: relative;
}
/* Connector line between steps on desktop */
.steps-grid::before {
  content: '';
  position: absolute;
  top: 36px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(to right, var(--color-border), var(--color-accent-100), var(--color-border));
}
.step-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-full);
  background: var(--color-accent-100);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-5);
}
.step-icon-wrap svg { color: var(--color-accent-600); width: 28px; height: 28px; }
```

---

### 6.4 Vehicle Options

**Content:** 3 cards

| Card | Icon | Price | Description |
|------|------|-------|-------------|
| Economy | Small sedan SVG | From $8 | Comfortable rides at great value |
| Premium | Luxury sedan SVG | From $18 | Executive vehicles, top-rated drivers |
| SUV | Large SUV SVG | From $24 | Spacious comfort for groups & luggage |

**Design notes:**
- Background: `#FAF7F2`
- Cards: white background, warm border, amber top border on hover
- Each card has a `Most Popular` badge on the Premium tier
- CTA per card: `Select [Type]` button (secondary style)

```css
.vehicles { padding-block: var(--space-24); }
.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}
.vehicle-icon-wrap {
  width: 64px;
  height: 64px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}
.vehicle-price {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--color-accent-600);
  margin-block: var(--space-2) var(--space-3);
}
```

---

### 6.5 Safety Banner

```css
.safety-banner {
  background: var(--color-bg-secondary);   /* #F5F0E8 */
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding-block: var(--space-12);
}
.safety-content {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  justify-content: center;
  text-align: center;
}
.safety-icon {
  width: 56px; height: 56px;
  background: var(--color-accent-100);
  border-radius: var(--radius-full);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
```

**HTML:**
```html
<section class="safety-banner">
  <div class="container">
    <div class="safety-content">
      <div class="safety-icon">
        <!-- Shield/Checkmark SVG, color: #D97706 -->
      </div>
      <div>
        <h3 style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 0.5rem;">
          Safety first. Trip tracking &amp; 24/7 support.
        </h3>
        <p style="color: var(--color-text-secondary); max-width: 50ch; margin: 0 auto;">
          Every ride is GPS-tracked. Share your trip in real-time with loved ones. 
          Our safety team is available around the clock.
        </p>
      </div>
    </div>
  </div>
</section>
```

---

### 6.6 Footer

**Structure:**
```
[Logo + tagline]   [Product: Ride, Drive, Business]   [Company: About, Careers, Press]   [Support: Help, Safety, Contact]

——————————————————————————————————————————————

© 2025 RideFlow Inc.   [Terms] [Privacy] [Cookies]         [Twitter] [Instagram] [LinkedIn]
```

```css
.footer {
  background: var(--color-text-primary);   /* Dark footer for contrast */
  color: rgba(255,255,255,0.6);
  padding-block: var(--space-16) var(--space-8);
}
.footer-logo { color: #FFFFFF; font-family: var(--font-display); font-size: 1.25rem; }
.footer a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: var(--text-sm); }
.footer a:hover { color: var(--color-accent-500); }
```

---

## 7. Authentication Pages

### 7.1 Modal System

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.modal-overlay.active { opacity: 1; pointer-events: all; }

.modal-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  transform: translateY(16px);
  transition: transform 0.25s ease;
}
.modal-overlay.active .modal-card { transform: translateY(0); }

.modal-close {
  position: absolute;
  top: var(--space-5);
  right: var(--space-5);
  background: var(--color-bg-secondary);
  border: none;
  border-radius: var(--radius-full);
  width: 32px; height: 32px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex; align-items: center; justify-content: center;
}
```

---

### 7.2 Sign In Modal — Full Spec

```
┌─────────────────────────────────────────────┐
│                                          [×] │
│                                             │
│   Welcome Back                              │
│   Sign in to continue your journey          │
│                                             │
│   Email or Phone Number                     │
│   [___________________________________]     │
│                                             │
│   Password                                  │
│   [________________________] [👁]           │
│                                             │
│   Forgot your password?                [→]  │
│                                             │
│   [        Sign In          ]               │
│                                             │
│   ─────────── or ─────────────             │
│                                             │
│   [G]  Continue with Google                 │
│   [𝐀]  Continue with Apple                  │
│                                             │
│   Don't have an account? Sign Up →          │
└─────────────────────────────────────────────┘
```

**Implementation notes:**
- `Welcome Back` → DM Serif Display 28px
- Subtext → DM Sans 14px secondary color
- Password field has show/hide toggle (eye icon, SVG)
- `Forgot your password?` → `var(--color-accent-600)`, right-aligned
- Sign In button → full-width `btn-primary btn-lg`
- Social buttons stacked vertically, left-aligned icons
- Switch to Sign Up → inline link at bottom

---

### 7.3 Sign Up Modal — Full Spec

```
┌─────────────────────────────────────────────┐
│                                          [×] │
│                                             │
│   Create Account                            │
│   Join thousands of happy riders            │
│                                             │
│   Full Name                                 │
│   [___________________________________]     │
│                                             │
│   Email Address                             │
│   [___________________________________]     │
│                                             │
│   Phone Number                              │
│   [+1 ▼] [_____________________________]    │
│                                             │
│   Create Password                           │
│   [________________________] [👁]           │
│   ████░░░░  Moderate strength               │
│                                             │
│   [        Sign Up           ]              │
│                                             │
│   ─────────── or ─────────────             │
│   [G]  Continue with Google                 │
│   [𝐀]  Continue with Apple                  │
│                                             │
│   By signing up, you agree to our          │
│   Terms of Service and Privacy Policy       │
│                                             │
│   Already have an account? Sign In →        │
└─────────────────────────────────────────────┘
```

**Password strength bar:**
```css
.password-strength { margin-top: var(--space-2); }
.strength-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-1);
}
.strength-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease, background 0.3s ease;
}
/* Weak: 25% red | Fair: 50% amber | Good: 75% yellow | Strong: 100% green */
```

**Phone field with country code:**
```css
.phone-group { display: flex; gap: var(--space-2); }
.country-select {
  flex: 0 0 88px;
  /* Styled same as form-input */
}
```

---

## 8. User Role Dashboards

### 8.1 Rider Dashboard

**Post-login landing screen. Primary actions are booking a ride and tracking current trip.**

#### Layout
```
┌─────────────────────────────────────────────┐
│ NAVBAR: Logo | [Home] [Rides] [Account]  [👤]│
├─────────────────────────────────────────────┤
│                                             │
│  Good morning, Sarah. ☀                    │
│  Where are you headed today?               │
│                                             │
│  [📍 Current location          ]            │
│  [🏁 Where to?                 ]            │
│                                             │
│  ─── QUICK DESTINATIONS ───                │
│  [🏠 Home]  [💼 Work]  [⭐ Saved]           │
│                                             │
├──────────────────────┬──────────────────────┤
│  VEHICLE SELECTOR    │   MAP / ETA PREVIEW   │
│                      │                       │
│  ○ Economy    $8     │   [Warm-tone map       │
│  ● Premium   $18  ← │    with car pins       │
│  ○ SUV       $24     │    and route line]     │
│                      │                       │
├──────────────────────┴──────────────────────┤
│  RECENT ACTIVITY                            │
│  [Trip card] → Home to Airport  $34  Mon    │
│  [Trip card] → Downtown Office  $12  Fri    │
└─────────────────────────────────────────────┘
```

#### CSS additions for Rider Dashboard
```css
.dashboard-greeting {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-text-primary);
}

.search-box-group {
  background: var(--color-bg-elevated);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}
.search-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
}
.search-row + .search-row {
  border-top: 1px solid var(--color-border);
}
.search-dot {
  width: 10px; height: 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.dot-origin { background: var(--color-accent-600); }
.dot-dest   { background: var(--color-text-primary); }

.quick-dest-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-elevated);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all 0.18s ease;
}
.quick-dest-btn:hover {
  border-color: var(--color-accent-600);
  color: var(--color-accent-600);
}

.vehicle-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.18s ease;
}
.vehicle-option.selected {
  background: var(--color-accent-50);
  border-color: var(--color-accent-600);
}

.trip-history-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-3);
  transition: box-shadow 0.18s ease;
}
.trip-history-card:hover { box-shadow: var(--shadow-sm); }
```

#### Rider Sub-pages

**My Rides (history):**
- Filter tabs: All | Upcoming | Completed | Cancelled
- Each trip card shows: origin → destination, date/time, driver name + avatar, vehicle type, fare, status badge
- Completed trips show a `Rate Ride` button if unrated

**Account Settings:**
- Avatar with upload option
- Personal details form (name, email, phone)
- Payment methods: cards with add/remove
- Notification preferences (toggles)
- Saved places: Home, Work, + custom

---

### 8.2 Driver Dashboard

**Driver's primary view shows earnings, current ride request, and daily stats.**

#### Layout
```
┌─────────────────────────────────────────────┐
│ DRIVER NAVBAR: [≡] RideFlow  Today's Earnings│
│                               $124.50   [👤] │
├─────────────────────────────────────────────┤
│  ONLINE STATUS TOGGLE                       │
│  ●── ONLINE ──○  [You are accepting rides]  │
├──────────────┬──────────────────────────────┤
│  TODAY'S     │  STATS CARDS                 │
│  SUMMARY     │  ┌──────┐ ┌──────┐ ┌──────┐ │
│              │  │  12  │ │ 4.9★ │ │  6h  │ │
│  $124.50     │  │ Trips│ │Rating│ │Online│ │
│  earned      │  └──────┘ └──────┘ └──────┘ │
│              │                              │
├──────────────┴──────────────────────────────┤
│  MAP (current position, nearby requests)    │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │  🚗 INCOMING RIDE REQUEST         [!] │ │
│  │  Sarah M.  •  ⭐ 4.8  •  Economy      │ │
│  │  📍 Pickup: 14 Elm Street             │ │
│  │  🏁 Drop: City Airport  (18 min)      │ │
│  │  Estimated fare: $28–32              │ │
│  │  [  DECLINE  ]    [  ACCEPT  ]       │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  RECENT COMPLETED TRIPS                     │
│  [Trip rows...]                             │
└─────────────────────────────────────────────┘
```

#### CSS additions for Driver Dashboard
```css
.online-toggle-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-bg-elevated);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-6);
}

/* Toggle switch */
.toggle {
  width: 52px; height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
}
.toggle.on { background: var(--color-accent-600); }
.toggle-knob {
  width: 22px; height: 22px;
  background: white;
  border-radius: var(--radius-full);
  position: absolute;
  top: 3px; left: 3px;
  box-shadow: var(--shadow-sm);
  transition: left 0.2s ease;
}
.toggle.on .toggle-knob { left: 27px; }

.stat-card {
  background: var(--color-bg-elevated);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  text-align: center;
}
.stat-value {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-text-primary);
  line-height: 1;
}
.stat-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.ride-request-card {
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-accent-500);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
  animation: pulse-border 2s ease infinite;
}
@keyframes pulse-border {
  0%, 100% { border-color: var(--color-accent-500); }
  50%       { border-color: var(--color-accent-600); }
}
.rider-info {
  display: flex; align-items: center; gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.rider-avatar {
  width: 44px; height: 44px;
  border-radius: var(--radius-full);
  background: var(--color-bg-secondary);
  object-fit: cover;
}
.request-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
.btn-decline {
  background: transparent;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  transition: all 0.18s ease;
}
.btn-decline:hover { border-color: var(--color-error); color: var(--color-error); }
.btn-accept {
  background: var(--color-accent-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 2px 8px rgba(217,119,6,0.3);
}
.btn-accept:hover { background: var(--color-accent-500); }
```

#### Driver Sub-pages

**Earnings:**
- Weekly/monthly earnings chart (line or bar, amber color)
- Breakdown table: date, trips, hours, gross, deductions, net
- Payout history and next payout date

**Trip History:**
- All completed trips with ratings received
- Duration, distance, fare per trip

**Vehicle & Documents:**
- Vehicle info card (make, model, plate)
- Document upload status: License ✓, Insurance ✓, Vehicle Inspection ⚠️

---

### 8.3 Admin Dashboard

**For internal operations: monitoring, users, disputes, analytics.**

#### Layout
```
┌──────────────────────────────────────────────────────┐
│  SIDEBAR              │  MAIN CONTENT                │
│  ─────────────────    │  ─────────────────────────   │
│  [≡] RideFlow Admin   │                              │
│                       │  Overview — May 2025         │
│  📊 Overview          │                              │
│  🚗 Live Map          │  KPI CARDS (4-grid)          │
│  👥 Users             │  ┌─────┐┌─────┐┌─────┐┌───┐ │
│  🧾 Trips             │  │4.2K ││$82K ││ 98% ││4.7│ │
│  💸 Payments          │  │Rides││Rev  ││Uptime││★  │ │
│  ⚠️  Disputes          │  └─────┘└─────┘└─────┘└───┘ │
│  📣 Notifications     │                              │
│  ⚙️  Settings          │  REVENUE CHART               │
│                       │  [Line chart, amber stroke]  │
│  ──────────────       │                              │
│  [Admin avatar]       │  RECENT TRIPS TABLE          │
│  Admin Name           │  [Sortable, paginated]       │
│  Super Admin          │                              │
└───────────────────────┴──────────────────────────────┘
```

#### CSS additions for Admin Dashboard
```css
.admin-layout {
  display: grid;
  grid-template-columns: 256px 1fr;
  min-height: 100vh;
}

.admin-sidebar {
  background: var(--color-text-primary); /* Dark sidebar */
  padding: var(--space-6) 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.sidebar-logo {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: white;
  padding: 0 var(--space-6) var(--space-6);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: var(--space-4);
}
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  color: rgba(255,255,255,0.6);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all 0.18s ease;
  border-left: 3px solid transparent;
  text-decoration: none;
}
.sidebar-nav-item:hover {
  color: rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.05);
}
.sidebar-nav-item.active {
  color: var(--color-accent-500);
  border-left-color: var(--color-accent-500);
  background: rgba(217,119,6,0.1);
}

.admin-main {
  background: var(--color-bg-primary);
  padding: var(--space-8) var(--space-10);
  overflow-y: auto;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}
.kpi-card {
  background: var(--color-bg-elevated);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
.kpi-card.highlight {
  background: var(--color-accent-600);
  border-color: transparent;
}
.kpi-card.highlight .kpi-value,
.kpi-card.highlight .kpi-label { color: white; }
.kpi-value {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-text-primary);
}
.kpi-delta {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.kpi-delta.up   { background: #D1FAE5; color: var(--color-success); }
.kpi-delta.down { background: #FEE2E2; color: var(--color-error); }

/* Data table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th {
  background: var(--color-bg-secondary);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-border);
}
.data-table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
.data-table tr:hover td { background: var(--color-bg-secondary); }
```

---

## 9. Motion & Animation Principles

```css
/* Global timing tokens */
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-slow: 380ms;
}

/* Page load: stagger reveal */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  animation: reveal-in var(--duration-slow) var(--ease-out-expo) forwards;
}
.reveal:nth-child(1) { animation-delay: 0ms; }
.reveal:nth-child(2) { animation-delay: 80ms; }
.reveal:nth-child(3) { animation-delay: 160ms; }
.reveal:nth-child(4) { animation-delay: 240ms; }

@keyframes reveal-in {
  to { opacity: 1; transform: translateY(0); }
}

/* Scroll-triggered reveal (IntersectionObserver) */
.scroll-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity var(--duration-slow) var(--ease-out-expo),
              transform var(--duration-slow) var(--ease-out-expo);
}
.scroll-reveal.visible { opacity: 1; transform: translateY(0); }
```

---

## 10. Responsive Breakpoints

```css
/* Mobile first */
/* xs:  < 480px  — single column, stacked everything */
/* sm:  ≥ 480px  — slightly more breathing room */
/* md:  ≥ 768px  — 2-column layouts, show sidebar partially */
/* lg:  ≥ 1024px — full desktop layout */
/* xl:  ≥ 1280px — wider containers */

@media (max-width: 767px) {
  .steps-grid        { grid-template-columns: 1fr; }
  .steps-grid::before{ display: none; }
  .vehicles-grid     { grid-template-columns: 1fr; }
  .kpi-grid          { grid-template-columns: repeat(2, 1fr); }
  .admin-layout      { grid-template-columns: 1fr; }
  .admin-sidebar     { display: none; } /* Replaced by bottom nav on mobile */
}

@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .request-actions { grid-template-columns: 1fr; }
}
```

---

## 11. Icon System

Use **Lucide Icons** (MIT licensed SVG set) for consistency. Key icons used:

| Context | Icon name |
|---------|-----------|
| Location / pickup | `map-pin` |
| Destination | `flag` |
| Car (economy) | `car` |
| Car (premium) | `car-front` |
| SUV | `truck` |
| Safety / shield | `shield-check` |
| Star / rating | `star` |
| Phone | `smartphone` |
| Route / direction | `navigation` |
| Driver online | `radio` |
| Earnings | `banknote` |
| Settings | `settings` |
| Close / X | `x` |
| Show password | `eye` / `eye-off` |
| Arrow right | `arrow-right` |
| Check success | `check-circle` |

**Usage:**
```html
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <!-- Lucide path data here -->
</svg>
```

```css
.icon { width: 20px; height: 20px; flex-shrink: 0; }
.icon-sm { width: 16px; height: 16px; }
.icon-lg { width: 24px; height: 24px; }
.icon-amber { color: var(--color-accent-600); }
.icon-muted { color: var(--color-text-muted); }
```

---

## 12. Accessibility Standards

- **Color contrast**: All text on backgrounds meets WCAG AA (4.5:1 for body, 3:1 for large text)
  - `#1F2937` on `#FAF7F2` → 11.8:1 ✓
  - `#FFFFFF` on `#D97706` → 3.1:1 ✓ (large text only — verify for small CTAs)
  - `#D97706` on `#FAF7F2` → 3.4:1 (use only for large/bold elements)
- **Focus states**: Visible amber ring on all interactive elements (`box-shadow: 0 0 0 3px rgba(217,119,6,0.35)`)
- **ARIA**: Modal uses `role="dialog"` `aria-modal="true"` `aria-labelledby`; toggle uses `role="switch"` `aria-checked`
- **Keyboard**: All modals trappable; Escape closes; Tab cycles through focusable elements
- **Reduced motion**: 
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

---

## 13. File Structure

```
rideflow/
├── index.html              ← Landing page
├── css/
│   ├── tokens.css          ← Variables (colors, spacing, typography)
│   ├── base.css            ← Reset, body, container
│   ├── components.css      ← Buttons, inputs, cards, modals, badges
│   ├── layout.css          ← Navbar, footer, grid systems
│   └── animations.css      ← Keyframes, transitions, scroll-reveal
├── pages/
│   ├── rider-dashboard.html
│   ├── driver-dashboard.html
│   └── admin-dashboard.html
├── js/
│   ├── modal.js            ← Open/close sign in & sign up
│   ├── auth.js             ← Form validation, password strength
│   ├── dashboard.js        ← Role-based interactions
│   └── scroll.js           ← Navbar scroll state, reveal observer
├── icons/
│   └── [lucide SVG sprites]
└── assets/
    └── hero-illustration.svg
```

---

## 14. Quick Implementation Checklist

- [ ] Import DM Serif Display + DM Sans from Google Fonts
- [ ] Apply CSS variables from Section 2 to `:root`
- [ ] Remove all `#6366F1`, `#8B5CF6`, neon, blue-gradient references
- [ ] Replace generic grey backgrounds with `#FAF7F2` / `#F5F0E8`
- [ ] Update all primary buttons to amber `#D97706`
- [ ] Replace emoji icons with Lucide SVGs
- [ ] Add warm border color `#E5DDD0` to all cards/inputs
- [ ] Implement modal open/close with backdrop blur
- [ ] Add password strength indicator to Sign Up form
- [ ] Implement scroll-reveal with IntersectionObserver
- [ ] Verify focus states on all interactive elements
- [ ] Test responsive layout at 320px, 768px, 1280px
- [ ] Add `@media (prefers-reduced-motion)` block
- [ ] Validate WCAG AA contrast ratios
- [ ] Implement role-specific dashboard routing post-login

---

*RideFlow Design System v1.0 — Warm Neutral Premium Theme*  
*Fonts: DM Serif Display + DM Sans | Icons: Lucide | Colors: Amber/Gold + Beige*
