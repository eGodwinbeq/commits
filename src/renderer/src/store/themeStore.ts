import { create } from 'zustand'
import type { Theme } from '@shared/types'

const THEME_KEY = 'commits.theme'

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  window.gitApi.setTitleBarTheme(theme)
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const initialTheme = loadTheme()
// Applied eagerly at module load (before React mounts) so there's no flash of the wrong
// theme, rather than waiting for a component effect to run after first paint.
applyTheme(initialTheme)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme: Theme) => {
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
}))
