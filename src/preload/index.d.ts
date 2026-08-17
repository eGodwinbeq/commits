import type { ElectronAPI } from '@electron-toolkit/preload'
import type { GitApi } from './api'

declare global {
  interface Window {
    electron: ElectronAPI
    gitApi: GitApi
  }
}
