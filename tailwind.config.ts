import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#1e1f22',
          panel: '#2b2d30',
          panelAlt: '#26282b',
          border: '#393b40',
          text: '#dfe1e5',
          textDim: '#8a8c8f',
          accent: '#3574f0',
          accentDim: '#2b5cd9',
          hover: '#323438',
          selected: '#2e436e',
          green: '#57965c',
          red: '#e05555',
          yellow: '#c9a03f',
          purple: '#a571e6',
          cyan: '#3fa6c9'
        }
      }
    }
  },
  plugins: []
} satisfies Config
