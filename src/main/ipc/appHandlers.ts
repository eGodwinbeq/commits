import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { Theme } from '@shared/types'

const OVERLAY_COLORS: Record<Theme, { color: string; symbolColor: string }> = {
  dark: { color: '#1e1f22', symbolColor: '#dfe1e5' },
  light: { color: '#f2f2f2', symbolColor: '#1e1e1e' }
} as const

export function registerAppHandlers(): void {
  ipcMain.handle(IpcChannels.appSetTitleBarTheme, (evt, theme: Theme) => {
    const win = BrowserWindow.fromWebContents(evt.sender)
    // setTitleBarOverlay is Windows/Linux-only and throws on platforms/window configs that
    // don't support it (e.g. macOS) - this is purely cosmetic, so failing silently is fine.
    try {
      win?.setTitleBarOverlay({ ...OVERLAY_COLORS[theme], height: 40 })
    } catch {
      // no-op
    }
  })
}
