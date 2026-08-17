import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import { registerAppHandlers } from './appHandlers'
import { registerRepoHandlers } from './repoHandlers'
import { registerGitReadHandlers } from './gitReadHandlers'
import { registerGitWriteHandlers } from './gitWriteHandlers'

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.appPing, () => 'pong')

  registerAppHandlers()
  registerRepoHandlers()
  registerGitReadHandlers()
  registerGitWriteHandlers()
}
