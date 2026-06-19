/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfc',
          100: '#ccfbf6',
          400: '#2dd4cc',
          500: '#06babe',
          600: '#0891b2',
        },
        navy: {
          700: '#207290',
          800: '#1a5c74',
          900: '#0f3d50',
        }
      }
    },
  },
  plugins: [],
}
