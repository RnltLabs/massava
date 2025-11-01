import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Massava Wellness Color Palette
        sage: {
          50: '#f3f6f3',
          100: '#e7ede7',
          200: '#c3d4c3',
          300: '#9fbb9f',
          400: '#7ba27b',
          500: '#5c8a5c',
          600: '#4a6f4a',
          700: '#3d5a3d',
          800: '#314831',
          900: '#263826',
          950: '#1a2a1a',
        },
        earth: {
          50: '#faf9f6',
          100: '#f5f3ed',
          200: '#e6e1d2',
          300: '#d7cfb7',
          400: '#b9a88b',
          500: '#9b815f',
          600: '#7d6a4f',
          700: '#665741',
          800: '#524635',
          900: '#43392c',
          950: '#2a2419',
        },
        sand: {
          50: '#fdfcf9',
          100: '#fbf9f3',
          200: '#f5f0e1',
          300: '#efe7cf',
          400: '#e3d5ab',
          500: '#d7c387',
          600: '#c1a66b',
          700: '#a18757',
          800: '#826c48',
          900: '#6a583c',
          950: '#453821',
        },
        wellness: {
          green: '#5c8a5c',
          earth: '#9b815f',
          sand: '#d7c387',
          sage: '#9fbb9f',
          light: '#f5f3ed',
          dark: '#2a2419',
        },
        terracotta: {
          50: '#fef3f1',
          100: '#fce5e1',
          200: '#f9cbc3',
          300: '#f4a59a',
          400: '#c77965',
          500: '#B56550',  // PRIMARY
          600: '#a25847',
          700: '#8a4a3c',
          800: '#713d33',
          900: '#5d332b',
          950: '#321a16',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'check': 'checkmark 0.3s ease-out',
        'progress': 'progress 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        checkmark: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
