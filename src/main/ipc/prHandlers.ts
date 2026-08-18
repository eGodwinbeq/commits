import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { DiffFile, GitResult, PrMergeMethod, PrStateFilter, PullRequest } from '@shared/types'
import {
  closePullRequest,
  createPullRequest,
  getPullRequest,
  getPullRequestDiff,
  GhCliError,
  listPullRequests,
  mergePullRequest
} from '../gh/prOperations'

async function safe<T>(fn: () => Promise<T>): Promise<GitResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    if (err instanceof GhCliError) {
      return { ok: false, error: { code: err.code, message: err.message } }
    }
    return {
      ok: false,
      error: { code: 'GH_ERROR', message: err instanceof Error ? err.message : String(err) }
    }
  }
}

export function registerPrHandlers(): void {
  ipcMain.handle(
    IpcChannels.prList,
    (_evt, repoPath: string, state?: PrStateFilter): Promise<GitResult<PullRequest[]>> =>
      safe(() => listPullRequests(repoPath, state))
  )

  ipcMain.handle(
    IpcChannels.prGet,
    (_evt, repoPath: string, number: number): Promise<GitResult<PullRequest>> =>
      safe(() => getPullRequest(repoPath, number))
  )

  ipcMain.handle(
    IpcChannels.prDiff,
    (_evt, repoPath: string, number: number): Promise<GitResult<DiffFile[]>> =>
      safe(() => getPullRequestDiff(repoPath, number))
  )

  ipcMain.handle(
    IpcChannels.prCreate,
    (
      _evt,
      repoPath: string,
      opts: { title: string; body: string; base: string; draft?: boolean }
    ): Promise<GitResult<PullRequest>> => safe(() => createPullRequest(repoPath, opts))
  )

  ipcMain.handle(
    IpcChannels.prMerge,
    (
      _evt,
      repoPath: string,
      number: number,
      opts: { method: PrMergeMethod; deleteBranch?: boolean }
    ): Promise<GitResult<void>> => safe(() => mergePullRequest(repoPath, number, opts))
  )

  ipcMain.handle(
    IpcChannels.prClose,
    (_evt, repoPath: string, number: number): Promise<GitResult<void>> =>
      safe(() => closePullRequest(repoPath, number))
  )
}
