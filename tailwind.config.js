/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A0F',
          surface: '#12121A',
          border: '#1E1E2E',
        },
        hand: {
          right: '#4A9EFF',
          left: '#A855F7',
        },
        key: {
          white: '#E8E8F0',
          black: '#1A1A2E',
        },
        feedback: {
          perfect: '#22C55E',
          good: '#EAB308',
          miss: '#EF4444',
        },
      },
      fontFamily: {
        display: ['"Space Mono"', 'ui-monospace', 'monospace'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
