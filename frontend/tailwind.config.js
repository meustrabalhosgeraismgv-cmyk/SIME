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
        primary: {
          DEFAULT: 'rgb(33 150 243 / <alpha-value>)',
          50: 'rgb(227 242 253 / <alpha-value>)',
          100: 'rgb(187 222 251 / <alpha-value>)',
          200: 'rgb(144 202 249 / <alpha-value>)',
          300: 'rgb(100 181 246 / <alpha-value>)',
          400: 'rgb(66 165 245 / <alpha-value>)',
          500: 'rgb(33 150 243 / <alpha-value>)',
          600: 'rgb(30 136 229 / <alpha-value>)',
          700: 'rgb(25 118 210 / <alpha-value>)',
          800: 'rgb(21 101 192 / <alpha-value>)',
          900: 'rgb(13 71 161 / <alpha-value>)',
          dark: 'rgb(13 71 161 / <alpha-value>)',
          light: 'rgb(158 202 255 / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(43 91 181 / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(76 175 80 / <alpha-value>)',
          50: 'rgb(232 245 233 / <alpha-value>)',
          100: 'rgb(200 230 201 / <alpha-value>)',
          500: 'rgb(76 175 80 / <alpha-value>)',
          600: 'rgb(67 160 71 / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(255 152 0 / <alpha-value>)',
          50: 'rgb(255 243 224 / <alpha-value>)',
          100: 'rgb(255 224 178 / <alpha-value>)',
          500: 'rgb(255 152 0 / <alpha-value>)',
          600: 'rgb(251 140 0 / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(244 67 54 / <alpha-value>)',
          50: 'rgb(255 235 238 / <alpha-value>)',
          100: 'rgb(255 205 210 / <alpha-value>)',
          500: 'rgb(244 67 54 / <alpha-value>)',
          600: 'rgb(229 57 53 / <alpha-value>)',
        },
        surface: {
          DEFAULT: '#F4F6F8',
          dim: '#E8ECF0',
          bright: '#FFFFFF',
          dark: {
            DEFAULT: '#121820',
            dim: '#1A2332',
            bright: '#1E293B',
          }
        },
        navy: {
          50: 'rgb(232 234 240 / <alpha-value>)',
          100: 'rgb(197 202 214 / <alpha-value>)',
          200: 'rgb(158 165 184 / <alpha-value>)',
          300: 'rgb(119 128 154 / <alpha-value>)',
          400: 'rgb(89 99 131 / <alpha-value>)',
          500: 'rgb(59 71 108 / <alpha-value>)',
          600: 'rgb(53 64 100 / <alpha-value>)',
          700: 'rgb(45 55 88 / <alpha-value>)',
          800: 'rgb(38 46 77 / <alpha-value>)',
          900: 'rgb(25 31 59 / <alpha-value>)',
          950: 'rgb(15 21 42 / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
        'float': '0 20px 40px -12px rgba(0,0,0,0.15)',
        'glass': '0 8px 32px 0 rgba(31,38,135,0.07)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
