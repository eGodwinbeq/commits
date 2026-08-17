import type { Config } from 'tailwindcss'

// Colors are driven by CSS variables (see src/renderer/src/styles/index.css) so the whole
// app can switch between dark/light themes at runtime via a `data-theme` attribute, without
// needing per-component logic. The `<alpha-value>` placeholder is Tailwind's mechanism for
// making the `/opacity` class syntax (e.g. bg-ide-accent/15) work with CSS-variable colors.
function withOpacity(varName: string): string {
  return `rgb(var(${varName}) / <alpha-value>)`
}

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: withOpacity('--ide-bg'),
          panel: withOpacity('--ide-panel'),
          panelAlt: withOpacity('--ide-panel-alt'),
          border: withOpacity('--ide-border'),
          text: withOpacity('--ide-text'),
          textDim: withOpacity('--ide-text-dim'),
          accent: withOpacity('--ide-accent'),
          accentDim: withOpacity('--ide-accent-dim'),
          hover: withOpacity('--ide-hover'),
          selected: withOpacity('--ide-selected'),
          selectedInactive: withOpacity('--ide-selected-inactive'),
          green: withOpacity('--ide-green'),
          red: withOpacity('--ide-red'),
          yellow: withOpacity('--ide-yellow'),
          purple: withOpacity('--ide-purple'),
          cyan: withOpacity('--ide-cyan')
        }
      }
    }
  },
  plugins: []
} satisfies Config
