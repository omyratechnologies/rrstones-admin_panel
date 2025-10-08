/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-light))",
          lighter: "hsl(var(--primary-lighter))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
          lighter: "hsl(var(--success-lighter))",
          hover: "hsl(var(--success-hover))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          light: "hsl(var(--warning-light))",
          lighter: "hsl(var(--warning-lighter))",
          hover: "hsl(var(--warning-hover))",
          dark: "hsl(var(--warning-dark))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
          light: "hsl(var(--error-light))",
          lighter: "hsl(var(--error-lighter))",
          hover: "hsl(var(--error-hover))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          light: "hsl(var(--info-light))",
          lighter: "hsl(var(--info-lighter))",
          hover: "hsl(var(--info-hover))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic status colors
        'status-active': "hsl(var(--status-active))",
        'status-inactive': "hsl(var(--status-inactive))",
        'status-pending': "hsl(var(--status-pending))",
        'status-completed': "hsl(var(--status-completed))",
        'status-cancelled': "hsl(var(--status-cancelled))",
        'status-processing': "hsl(var(--status-processing))",
        // Granite management colors
        'granite-variant': {
          DEFAULT: "hsl(var(--granite-variant))",
          hover: "hsl(var(--granite-variant-hover))",
          light: "hsl(var(--granite-variant-light))",
          lighter: "hsl(var(--granite-variant-lighter))",
          dark: "hsl(var(--granite-variant-dark))",
        },
        'granite-specific': {
          DEFAULT: "hsl(var(--granite-specific))",
          hover: "hsl(var(--granite-specific-hover))",
          light: "hsl(var(--granite-specific-light))",
          lighter: "hsl(var(--granite-specific-lighter))",
          dark: "hsl(var(--granite-specific-dark))",
        },
        'granite-product': {
          DEFAULT: "hsl(var(--granite-product))",
          hover: "hsl(var(--granite-product-hover))",
          light: "hsl(var(--granite-product-light))",
          lighter: "hsl(var(--granite-product-lighter))",
          dark: "hsl(var(--granite-product-dark))",
        },
        'granite-value': "hsl(var(--granite-value))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-primary": {
          '0%, 100%': { backgroundColor: "hsl(var(--primary-lighter))" },
          '50%': { backgroundColor: "hsl(var(--primary-light))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-primary": "pulse-primary 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
