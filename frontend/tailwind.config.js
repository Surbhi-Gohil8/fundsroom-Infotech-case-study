/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0dbe9',
          300: '#a7bdd6',
          400: '#7799bd',
          500: '#5479a3',
          600: '#415f87',
          700: '#354d6e',
          800: '#2f425c',
          900: '#2a394f',
          950: '#1b2434',
        },
      },
    },
  },
  plugins: [],
}
