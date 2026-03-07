/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd8',
          200: '#fad7af',
          300: '#f6b97d',
          400: '#f19248',
          500: '#ed7426',
          600: '#de5a1a',
          700: '#b84417',
          800: '#93371b',
          900: '#77301a',
          950: '#40150b',
        },
      },
    },
  },
  plugins: [],
}
