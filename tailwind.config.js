/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0908',
          surface: '#111010',
          elevated: '#1A1917',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          neon: '#FFB800',
        },
        copper: '#C2410C',
        warm: {
          white: '#F5F0E8',
          muted: '#A89880',
          faint: '#5C5245',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-border': 'pulseBorder 2s ease infinite',
        shake: 'shake 0.4s ease',
      },
      keyframes: {
        pulseGlow: {
          '0%,100%': { 'box-shadow': '0 0 12px rgba(217,119,6,0.2)' },
          '50%': { 'box-shadow': '0 0 32px rgba(217,119,6,0.5)' },
        },
        shimmer: {
          '0%': { 'background-position': '-500px 0' },
          '100%': { 'background-position': '500px 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseBorder: {
          '0%,100%': { 'border-color': 'rgba(245,158,11,0.6)' },
          '50%': { 'border-color': 'rgba(217,119,6,1)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
