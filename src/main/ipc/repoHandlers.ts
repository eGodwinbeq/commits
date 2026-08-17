import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { GitResult, RepoInfo } from '@shared/types'
import { execGit } from '../git/gitExecutor'
import { basename } from 'path'

async function validateRepo(path: string): Promise<GitResult<RepoInfo>> {
  const result = await execGit(path, ['rev-parse', '--show-toplevel'])
  if (result.code !== 0) {
    return {
      ok: false,
      error: {
        code: 'NOT_A_REPO',
        message: 'The selected folder is not a git repository.',
        stderr: result.stderr
      }
    }
  }
  const root = result.stdout.toString('utf-8').trim().replace(/\//g, '\\')
  return { ok: true, data: { path: root, name: basename(root) } }
}

export function registerRepoHandlers(): void {
  ipcMain.handle(IpcChannels.repoOpenFolderDialog, async (evt) => {
    const win = BrowserWindow.fromWebContents(evt.sender)
    const res = win
      ? await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  })

  ipcMain.handle(IpcChannels.repoValidate, async (_evt, path: string) => {
    return validateRepo(path)
  })
}
