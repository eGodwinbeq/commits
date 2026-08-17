import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { gitApi } from './api'

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('gitApi', gitApi)
} else {
  // @ts-expect-error fallback for non-isolated context (should not happen, sandbox is on)
  window.electron = electronAPI
  // @ts-expect-error fallback
  window.gitApi = gitApi
}
