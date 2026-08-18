import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { GitResult, RepoInfo } from '@shared/types'
import { execGit } from '../git/gitExecutor'
import { basename } from 'path'
import { homedir } from 'os'

const DUBIOUS_OWNERSHIP_RE = /detected dubious ownership in repository at '([^']+)'/i

async function validateRepo(path: string): Promise<GitResult<RepoInfo>> {
  const result = await execGit(path, ['rev-parse', '--show-toplevel'])
  if (result.code !== 0) {
    const dubious = result.stderr.match(DUBIOUS_OWNERSHIP_RE)
    if (dubious) {
      return {
        ok: false,
        error: {
          code: 'UNSAFE_REPO',
          message:
            'Git flagged this repository as unsafe because it is owned by a different user account.',
          stderr: result.stderr,
          path: dubious[1]
        }
      }
    }
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

async function trustDirectory(path: string): Promise<GitResult<void>> {
  const result = await execGit(homedir(), ['config', '--global', '--add', 'safe.directory', path])
  if (result.code !== 0) {
    return {
      ok: false,
      error: {
        code: 'GIT_ERROR',
        message: 'Failed to mark this directory as safe.',
        stderr: result.stderr
      }
    }
  }
  return { ok: true, data: undefined }
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

  ipcMain.handle(IpcChannels.repoTrustDirectory, async (_evt, path: string) => {
    return trustDirectory(path)
  })
}
