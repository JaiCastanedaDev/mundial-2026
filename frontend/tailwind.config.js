/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1B4332',
        'primary-light': '#2D6A4F',
        accent: '#F4A261',
        'accent-dark': '#E76F51',
        live: '#EF4444',
        success: '#22C55E',
        warning: '#F59E0B',
        surface: '#FFFFFF',
        muted: '#64748B',
        border: '#E2E8F0',
        ink: '#0F172A',
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        display: ['"Barlow Condensed"', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 18px 50px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        pitch:
          'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), transparent 28%), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        pitch: '220px 220px, 32px 32px, 32px 32px',
      },
    },
  },
  plugins: [],
}
