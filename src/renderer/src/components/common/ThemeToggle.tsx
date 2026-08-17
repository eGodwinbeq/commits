import { useThemeStore } from '../../store/themeStore'
import { IconMoon, IconSun } from './icons'

export function ThemeToggle(): React.JSX.Element {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  return (
    <button
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ide-textDim hover:bg-ide-hover hover:text-ide-text"
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
    >
      {theme === 'dark' ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
    </button>
  )
}
