/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F0F4',
          100: '#66D9FF', // Cyan
          200: '#8FBAD1',
          300: '#1EA7FF', // Electric Blue
          400: '#4A7CAE',
          500: '#0047AB', // Royal Blue
          600: '#20497F',
          700: '#002F6C', // Navy Blue
          800: '#001C4D', // Midnight Blue
          900: '#0A2244',
          950: '#091932', // Dark Background
        },
        slate: {
          50: '#FFFFFF', // White
          100: '#F4F4F3',
          200: '#E5E4E0',
          300: '#D1D0C9',
          400: '#C8CCD2', // Silver
          500: '#7A8088', // Steel Gray
          600: '#54534E',
          700: '#42413D',
          800: '#2E2F33', // Dark Gray
          900: '#20242B', // Charcoal
          950: '#0B0B0B', // Black
        }
      },
    },
  },
  plugins: [],
}
