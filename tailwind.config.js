/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f5',
          100: '#fbe8ea',
          200: '#f7d5d8',
          300: '#f0b4ba',
          400: '#e58591',
          500: '#d75a6a',
          600: '#c23c4e',
          700: '#a32d3d',
          800: '#872835',
          900: '#722530',
          950: '#400f16',
        },
        gold: {
          500: '#d4af37',
          600: '#b89628',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        bengali: ['var(--font-solaiman)', 'SolaimanLipi', 'Kalpurush', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
