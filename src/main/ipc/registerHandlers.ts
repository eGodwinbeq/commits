import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import { registerRepoHandlers } from './repoHandlers'
import { registerGitReadHandlers } from './gitReadHandlers'
import { registerGitWriteHandlers } from './gitWriteHandlers'

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.appPing, () => 'pong')

  registerRepoHandlers()
  registerGitReadHandlers()
  registerGitWriteHandlers()
}
