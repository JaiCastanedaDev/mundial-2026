/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#031f16',
        'primary-light': '#0b3125',
        accent: '#f4cf8b',
        'accent-dark': '#d7b06c',
        live: '#ff6b57',
        success: '#7ed9a3',
        warning: '#f0c36d',
        surface: '#163228',
        muted: '#93a59b',
        border: '#355347',
        ink: '#e8f0ea',
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        display: ['"Barlow Condensed"', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 20px 60px rgba(0, 0, 0, 0.28)',
      },
      backgroundImage: {
        pitch:
          'radial-gradient(circle at 50% 35%, rgba(244,207,139,0.08), transparent 30%), radial-gradient(circle at 20% 20%, rgba(20,60,45,0.55), transparent 42%), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        pitch: '240px 240px, 240px 240px, 32px 32px, 32px 32px',
      },
    },
  },
  plugins: [],
}
