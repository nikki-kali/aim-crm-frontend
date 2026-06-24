/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fafa',
          100: '#ccf1f2',
          200: '#99e2e6',
          600: '#06babe',
          700: '#207290',
        },
        teal: {
          50:  '#f0fdfc',
          100: '#ccfbf6',
          200: '#99f6f0',
          400: '#2dd4cc',
          500: '#06babe',
          600: '#0597a0',
          700: '#047882',
        },
        navy: {
          600: '#278ab0',
          700: '#207290',
          800: '#1a5c74',
          900: '#0f3d50',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark:    '#1e2433',
        },
      },
      boxShadow: {
        'card':     '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md':  '0 4px 12px 0 rgba(0,0,0,0.08), 0 1px 3px -1px rgba(0,0,0,0.04)',
        'card-lg':  '0 8px 24px 0 rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.06)',
        'glow':     '0 0 0 3px rgba(6,186,190,0.18)',
        'glow-sm':  '0 0 0 2px rgba(6,186,190,0.12)',
        'inner-sm': 'inset 0 1px 2px 0 rgba(0,0,0,0.04)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0'  },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)'    },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1'   },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        shimmer:     'shimmer 1.6s ease-in-out infinite',
        'fade-in':   'fade-in 0.3s ease-out',
        'scale-in':  'scale-in 0.2s ease-out',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
      },
      backgroundImage: {
        shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
        'shimmer-dark': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}
