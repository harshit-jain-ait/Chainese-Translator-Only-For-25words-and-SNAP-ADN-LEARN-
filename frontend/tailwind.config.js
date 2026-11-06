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
        terracotta: {
          50: '#FDF6F4',
          100: '#FCECE8',
          200: '#F9D5CC',
          300: '#F5B4A3',
          400: '#EE8368',
          500: '#E54D2E', // Primary signature vermilion / terracotta
          600: '#D33E20',
          700: '#B03017',
          800: '#8E2916',
          900: '#4C1D15',
        },
        slatebg: {
          light: '#F8F9FA',
          cardLight: '#FFFFFF',
          dark: '#121316',
          cardDark: '#1A1C20',
          elevatedDark: '#23262D',
          borderDark: '#2C3038',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        chinese: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

