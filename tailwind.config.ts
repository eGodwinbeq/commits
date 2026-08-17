import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ide: {
          // JetBrains New UI (Darcula) palette
          bg: '#1e1f22', // ToolWindow.background / main window
          panel: '#2b2d30', // MainToolbar.background / EditorTabs.background
          panelAlt: '#1e1f22', // Tree.background - tool window content is the base bg, not lighter
          border: '#393b40', // Separator/Border
          text: '#dfe1e5', // Label.foreground
          textDim: '#6f737a', // Label.disabledForeground / secondary
          accent: '#3574f0', // Button primary / Link
          accentDim: '#3369d6', // Button primary pressed
          hover: '#2b2d30', // List.hoverBackground
          selected: '#2e436e', // List/Tree.selectionBackground (focused)
          selectedInactive: '#393b40', // List/Tree.selectionBackground (unfocused)
          green: '#499c54', // FileStatus.ADDED
          red: '#db5c5c', // FileStatus.DELETED / error
          yellow: '#d6ae58', // FileStatus.MODIFIED (warning-style accent)
          purple: '#b99bf8',
          cyan: '#3fa6c9'
        }
      }
    }
  },
  plugins: []
} satisfies Config
