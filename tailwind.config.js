/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/*.js'],
  theme: {
    extend: {
      colors: {
        charcoal: { DEFAULT: '#1C1917', deep: '#0C0A09', soft: '#44403C' },
        gold: { DEFAULT: '#B08D3E', light: '#C9A961', pale: '#E8DCC3' },
        cream: { DEFAULT: '#FAF7F2', warm: '#F3EEE5' },
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Didot', 'serif'],
        body: ['Jost', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.25em',
        wide2: '0.12em',
      },
    },
  },
  plugins: [],
};
