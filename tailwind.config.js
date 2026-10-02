/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/*.js'],
  theme: {
    extend: {
      colors: {
        // Boutique palette
        ink: { DEFAULT: '#0B0909', soft: '#151311' },
        ivory: '#F7F5F1',
        sand: '#EFECE6',
        line: '#E5E1D9',
        muted: '#77736D',
        text: '#171717',
        charcoal: { DEFAULT: '#1C1917', deep: '#0B0909', soft: '#44403C' },
        gold: { DEFAULT: '#C5A04A', dark: '#AE8B3A', light: '#D4B46A', pale: '#E8DCC3' },
        cream: { DEFAULT: '#F7F5F1', warm: '#F3EEE5' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Didot', 'serif'],
        body: ['Jost', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.25em',
        wide2: '0.12em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,23,23,0.04)',
        lift: '0 14px 30px -12px rgba(23,23,23,0.18)',
      },
    },
  },
  plugins: [],
};
