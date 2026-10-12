/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nep: {
          bg: '#F7F7F5',
          card: '#FFFFFF',
          dark: '#18181B',
          muted: '#8E8E93',
          border: '#EBEBEB',
          accent: '#E07A5F',
        }
      },
      transitionTimingFunction: {
        'ios-spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ios-reel': 'cubic-bezier(0.12, 0.9, 0.18, 1)',
      },
    },
  },
  plugins: [],
}
