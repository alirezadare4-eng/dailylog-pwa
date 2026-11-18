/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb', // اصلی آبی
          600: '#1d4ed8',
          700: '#1e40af',
        },
        success: {
          500: '#10b981', // سبز انجام شده
          600: '#059669',
        },
        pending: {
          500: '#f97316', // نارنجی نیمه تمام
          600: '#ea580c',
        }
      }
    },
  },
  plugins: [],
}

