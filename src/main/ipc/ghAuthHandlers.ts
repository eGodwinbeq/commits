import { ipcMain, shell } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import { cancelGithubDeviceAuth, startGithubDeviceAuth } from '../gh/deviceAuth'

export function registerGhAuthHandlers(): void {
  ipcMain.handle(IpcChannels.ghStartDeviceAuth, (evt) => {
    startGithubDeviceAuth((event) => {
      if (event.type === 'code' && event.url) {
        shell.openExternal(event.url)
      }
      if (!evt.sender.isDestroyed()) {
        evt.sender.send(IpcChannels.ghAuthEvent, event)
      }
    })
  })

  ipcMain.handle(IpcChannels.ghCancelDeviceAuth, () => {
    cancelGithubDeviceAuth()
  })
}
