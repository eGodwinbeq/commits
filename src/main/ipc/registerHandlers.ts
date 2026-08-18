import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import { registerAppHandlers } from './appHandlers'
import { registerRepoHandlers } from './repoHandlers'
import { registerGitReadHandlers } from './gitReadHandlers'
import { registerGitWriteHandlers } from './gitWriteHandlers'
import { registerPrHandlers } from './prHandlers'
import { registerAiHandlers } from './aiHandlers'
import { registerGhAuthHandlers } from './ghAuthHandlers'

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.appPing, () => 'pong')

  registerAppHandlers()
  registerRepoHandlers()
  registerGitReadHandlers()
  registerGitWriteHandlers()
  registerPrHandlers()
  registerAiHandlers()
  registerGhAuthHandlers()
}
