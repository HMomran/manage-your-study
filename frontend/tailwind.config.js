/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:   '#0A1931',
        teal:   '#00B4D8',
        crit:   '#E63946',
        mod:    '#F4A261',
        low:    '#57CC99',
        gold:   '#FFB703',
        muted:  '#8899AA',
        light:  '#E8EEF4',
        surface:'#F0F4F8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
