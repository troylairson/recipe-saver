import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.vue',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4f0',
          100: '#fce8de',
          200: '#f8cdb7',
          500: '#e8622a',
          600: '#d4501b',
          700: '#c44a18',
        },
      },
      lineClamp: {
        2: '2',
        3: '3',
      },
    },
  },
} satisfies Config
