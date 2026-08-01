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
        obsidian: {
          950: '#06090F',
          900: '#090D16',
          850: '#0F1626',
          800: '#141E33',
          700: '#1F2C47',
        },
        afzal: {
          DEFAULT: '#06B6D4', // Cyan 500
          glow: '#22D3EE',
          dark: '#0891B2',
        },
        amrin: {
          DEFAULT: '#8B5CF6', // Violet 500
          glow: '#A78BFA',
          dark: '#7C3AED',
        },
        heart: {
          DEFAULT: '#F43F5E', // Rose 500
          glow: '#FB7185',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s infinite ease-in-out',
        'float': 'float 6s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.4))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.6))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
