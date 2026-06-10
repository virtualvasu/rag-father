/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "var(--color-primary, #6366F1)",
        "primary-light": "var(--color-primary-light, #818CF8)",
        "primary-dim": "var(--color-primary-dim, #4F46E5)",
        "secondary": "var(--color-secondary, #F59E0B)",
        "secondary-dim": "var(--color-secondary-dim, #D97706)",
        "accent": "var(--color-accent, #10B981)",
        "error": "var(--color-error, #EF4444)",
        "surface-dark": "var(--color-surface-dark, #0A0A0F)",
        "surface": "var(--color-surface, #111118)",
        "surface-high": "var(--color-surface-high, #1A1A24)",
        "surface-highest": "var(--color-surface-highest, #252530)",
        "border": "var(--color-border, #2A2A3A)",
        "text-primary": "var(--color-text-primary, #F0F0F5)",
        "text-secondary": "var(--color-text-secondary, #8B8BA0)",
        "text-muted": "var(--color-text-muted, #55556A)",
        
        // Aliasing the old names that are used throughout the app for now
        // This will prevent everything from breaking while we migrate
        "on-surface": "var(--color-text-primary, #F0F0F5)",
        "on-surface-variant": "var(--color-text-secondary, #8B8BA0)",
        "outline-variant": "var(--color-border, #2A2A3A)",
        "surface-container": "var(--color-surface-high, #1A1A24)",
        "surface-variant": "var(--color-surface-highest, #252530)",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      fontFamily: {
        "sans": ["DM Sans", "sans-serif"],
        "display": ["Sora", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
        
        // Map old font classes to new ones for backwards compatibility
        "body-lg": ["DM Sans", "sans-serif"],
        "headline-lg-mobile": ["Sora", "sans-serif"],
        "headline-md": ["Sora", "sans-serif"],
        "body-sm": ["DM Sans", "sans-serif"],
        "label-md": ["DM Sans", "sans-serif"],
        "label-sm": ["DM Sans", "sans-serif"],
        "headline-xl": ["Sora", "sans-serif"],
        "body-md": ["DM Sans", "sans-serif"],
        "headline-lg": ["Sora", "sans-serif"],
      },
      backgroundSize: {
        '300%': '300%',
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'shimmer': 'shimmer 2.5s ease-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'glow-pulse': 'glow-pulse 2s infinite',
        'flow': 'flow 2s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '50%': { boxShadow: '0 0 10px 2px rgba(99, 102, 241, 0.8)' },
        },
        'flow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
