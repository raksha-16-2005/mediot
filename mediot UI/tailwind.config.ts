import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cybersecurity Theme
        cyber: {
          50: '#f8f9fa',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b0f1a',
        },
      },
      backgroundColor: {
        'dark-primary': '#0b0f1a',
        'dark-secondary': '#1e293b',
        'dark-tertiary': '#374151',
      },
      borderColor: {
        'dark-light': '#334155',
        'dark-dark': '#1e293b',
      },
      textColor: {
        'dark-primary': '#f1f5f9',
        'dark-secondary': '#cbd5e1',
        'dark-tertiary': '#94a3b8',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
      boxShadow: {
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'dark-md': '0 4px 6px 0 rgba(0, 0, 0, 0.7)',
        'dark-lg': '0 10px 15px 0 rgba(0, 0, 0, 0.8)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#cbd5e1',
            a: {
              color: '#0284c7',
              '&:hover': {
                color: '#0ea5e9',
              },
            },
            h1: {
              color: '#f1f5f9',
              fontWeight: '700',
              fontSize: '2.5rem',
              lineHeight: '1.2',
              marginBottom: '1.5rem',
            },
            h2: {
              color: '#f1f5f9',
              fontWeight: '700',
              fontSize: '1.875rem',
            },
            h3: {
              color: '#f1f5f9',
              fontWeight: '700',
              fontSize: '1.5rem',
            },
            code: {
              color: '#e2e8f0',
              backgroundColor: '#374151',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
            },
            pre: {
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
            },
          },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideInUp: 'slideInUp 0.3s ease-out',
        slideInDown: 'slideInDown 0.3s ease-out',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
