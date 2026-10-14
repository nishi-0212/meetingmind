/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08090a',
        fg: '#f7f8f8',
        muted: '#8a8f98',
        line: 'rgba(255,255,255,0.08)',
        lavender: '#c4b5fd',
        pink: '#f9a8d4',
        mint: '#a7f3d0',
        sky: '#bae6fd',
        peach: '#fdba8c',
        butter: '#fde68a',
      },
    },
  },
  plugins: [],
}