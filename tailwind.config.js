/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // 8pt-grid font sizes: 12 / 14 / 16 / 20 / 24 / 32
      fontSize: {
        '2rem': ['2rem', '1.4'],   // 32px — stat number
        '1.5rem': ['1.5rem', '1.4'], // 24px alt
      },
      // 8pt-grid line heights
      lineHeight: {
        title: '1.4',
        body: '1.6',
      },
      // 8pt-grid spacing overrides
      spacing: {
        '4.5': '1.125rem',  // 18px — reserved, avoid
      },
    },
  },
  plugins: [],
}
