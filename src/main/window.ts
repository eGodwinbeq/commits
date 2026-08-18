import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1e1f22',
    icon: join(__dirname, '../../build/icon.png'),
    // Windows/Linux draw the native title bar at a fixed ~32px height. Using 'hidden' +
    // titleBarOverlay keeps the native min/max/close buttons but lets us pick the height
    // of the strip they sit in, so it can be taller than the OS default.
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1e1f22',
      symbolColor: '#dfe1e5',
      height: 40
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}