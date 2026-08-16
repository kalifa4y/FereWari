/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#03045E',
          primary: '#023E8A',
          vibrant: '#0077B6',
          medium: '#0096C7',
          cyan: '#00B4D8',
          cyanSoft: '#48CAE4',
          subtle: '#90E0EF',
          card: '#ADE8F4',
          pale: '#CAF0F8',
          bg: '#F8FCFE',
          alert: '#E63946',
          alertDark: '#D90429',
        }
      },
      fontFamily: {
        display: ['"Darker Grotesque"', 'sans-serif'],
        sans: ['"Google Sans Flex"', '"Product Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(3, 4, 94, 0.08)',
        'card': '0 8px 30px rgba(3, 4, 94, 0.06)',
        'glow': '0 0 25px rgba(0, 180, 216, 0.35)',
      }
    },
  },
  plugins: [],
}
