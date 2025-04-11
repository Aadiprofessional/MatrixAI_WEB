/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#cce3ff',
          200: '#99c7ff',
          300: '#66abff',
          400: '#338fff',
          500: '#0073ff',
          600: '#005cd9',
          700: '#0044a6',
          800: '#002d73',
          900: '#001540',
        },
        secondary: {
          50: '#f0f8ff',
          100: '#e1f0fe',
          200: '#c3e1fd',
          300: '#a4d1fc',
          400: '#86c2fa',
          500: '#68b3f9',
          600: '#4a9ef5',
          700: '#2c89f0',
          800: '#0e74e8',
          900: '#0d5bba',
        },
        dark: {
          50: '#e6e8ed',
          100: '#ccd0da',
          200: '#99a1b5',
          300: '#667290',
          400: '#33436b',
          500: '#001446',
          600: '#001033',
          700: '#000c26',
          800: '#000819',
          900: '#00040d',
        },
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
        medium: '0 6px 30px rgba(0, 0, 0, 0.1)',
        hard: '0 8px 40px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
} 