import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { GitResult, Commit, Branch, RepoStatus, DiffFile } from '@shared/types'
import { getLog } from '../git/gitLog'
import { getBranches } from '../git/gitBranches'
import { getStatus } from '../git/gitStatus'
import { getWorkingDiff, getCommitDiff } from '../git/gitDiff'

async function safe<T>(fn: () => Promise<T>): Promise<GitResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    return {
      ok: false,
      error: { code: 'GIT_ERROR', message: err instanceof Error ? err.message : String(err) }
    }
  }
}

export function registerGitReadHandlers(): void {
  ipcMain.handle(
    IpcChannels.gitLog,
    (_evt, repoPath: string, opts?: { maxCount?: number; skip?: number }): Promise<GitResult<Commit[]>> =>
      safe(() => getLog(repoPath, opts))
  )

  ipcMain.handle(
    IpcChannels.gitBranches,
    (_evt, repoPath: string): Promise<GitResult<Branch[]>> => safe(() => getBranches(repoPath))
  )

  ipcMain.handle(
    IpcChannels.gitStatus,
    (_evt, repoPath: string): Promise<GitResult<RepoStatus>> => safe(() => getStatus(repoPath))
  )

  ipcMain.handle(
    IpcChannels.gitDiff,
    (
      _evt,
      repoPath: string,
      opts: { path?: string; staged?: boolean }
    ): Promise<GitResult<DiffFile[]>> => safe(() => getWorkingDiff(repoPath, opts))
  )

  ipcMain.handle(
    IpcChannels.gitShow,
    (_evt, repoPath: string, sha: string): Promise<GitResult<DiffFile[]>> =>
      safe(() => getCommitDiff(repoPath, sha))
  )
}
