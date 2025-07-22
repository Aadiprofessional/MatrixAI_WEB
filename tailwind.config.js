/** @type {import('tailwindcss').Config} */
module.exports = {
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulse: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        glow: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.3)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        beam: {
          '0%': { opacity: 0, transform: 'translateX(-100%)' },
          '50%': { opacity: 0.7 },
          '100%': { opacity: 0, transform: 'translateX(100%)' },
        },
        verticalBeam: {
          '0%': { opacity: 0, transform: 'translateY(-100%)' },
          '50%': { opacity: 0.7 },
          '100%': { opacity: 0, transform: 'translateY(100%)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        gridMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulse: 'pulse 4s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite',
        rotate: 'rotate 20s linear infinite',
        beam: 'beam 3s ease-in-out infinite',
        verticalBeam: 'verticalBeam 4s ease-in-out infinite',
        fadeIn: 'fadeIn 1s ease-in-out',
        gridMove: 'gridMove 2s linear infinite',
      },
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