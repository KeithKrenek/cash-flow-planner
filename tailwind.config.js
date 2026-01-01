/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        'surface-hover': '#222222',
        border: '#2a2a2a',
        'border-focus': '#3b82f6',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a0a0a0',
        'text-muted': '#666666',
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        success: '#22c55e',
        'success-muted': 'rgba(34, 197, 94, 0.1)',
        danger: '#ef4444',
        'danger-muted': 'rgba(239, 68, 68, 0.1)',
        warning: '#f59e0b',
        'warning-muted': 'rgba(245, 158, 11, 0.1)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        lg: ['16px', '24px'],
        xl: ['18px', '28px'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      boxShadow: {
        modal:
          '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        dropdown:
          '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
