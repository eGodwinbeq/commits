import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type {
  Branch,
  Commit,
  DiffFile,
  GitResult,
  RepoInfo,
  RepoStatus,
  Theme
} from '@shared/types'

export const gitApi = {
  ping: (): Promise<string> => ipcRenderer.invoke(IpcChannels.appPing),
  setTitleBarTheme: (theme: Theme): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.appSetTitleBarTheme, theme),

  openFolderDialog: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.repoOpenFolderDialog),
  validateRepo: (path: string): Promise<GitResult<RepoInfo>> =>
    ipcRenderer.invoke(IpcChannels.repoValidate, path),

  getLog: (repoPath: string, opts?: { maxCount?: number; skip?: number }): Promise<GitResult<Commit[]>> =>
    ipcRenderer.invoke(IpcChannels.gitLog, repoPath, opts),
  getBranches: (repoPath: string): Promise<GitResult<Branch[]>> =>
    ipcRenderer.invoke(IpcChannels.gitBranches, repoPath),
  getStatus: (repoPath: string): Promise<GitResult<RepoStatus>> =>
    ipcRenderer.invoke(IpcChannels.gitStatus, repoPath),
  getDiff: (
    repoPath: string,
    opts: { path?: string; staged?: boolean }
  ): Promise<GitResult<DiffFile[]>> => ipcRenderer.invoke(IpcChannels.gitDiff, repoPath, opts),
  getShow: (repoPath: string, sha: string): Promise<GitResult<DiffFile[]>> =>
    ipcRenderer.invoke(IpcChannels.gitShow, repoPath, sha),

  stageFile: (repoPath: string, path: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitStageFile, repoPath, path),
  unstageFile: (repoPath: string, path: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitUnstageFile, repoPath, path),
  stagePaths: (repoPath: string, paths: string[]): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitStagePaths, repoPath, paths),
  unstagePaths: (repoPath: string, paths: string[]): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitUnstagePaths, repoPath, paths),
  discardChanges: (repoPath: string, path: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitDiscardChanges, repoPath, path),
  commit: (repoPath: string, message: string, opts?: { amend?: boolean }): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitCommit, repoPath, message, opts),

  checkout: (repoPath: string, ref: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitCheckout, repoPath, ref),
  createBranch: (
    repoPath: string,
    name: string,
    startPoint?: string,
    doCheckout?: boolean
  ): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitCreateBranch, repoPath, name, startPoint, doCheckout),
  renameBranch: (repoPath: string, oldName: string, newName: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitRenameBranch, repoPath, oldName, newName),
  deleteBranch: (repoPath: string, name: string, force?: boolean): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitDeleteBranch, repoPath, name, force),
  merge: (repoPath: string, sourceRef: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitMerge, repoPath, sourceRef),
  rebase: (repoPath: string, ontoRef: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitRebase, repoPath, ontoRef),
  push: (
    repoPath: string,
    opts: { remote: string; branch: string; setUpstream?: boolean; force?: boolean }
  ): Promise<GitResult<string>> => ipcRenderer.invoke(IpcChannels.gitPush, repoPath, opts),
  pull: (
    repoPath: string,
    opts: { remote: string; branch: string; rebase?: boolean }
  ): Promise<GitResult<string>> => ipcRenderer.invoke(IpcChannels.gitPull, repoPath, opts),
  fetch: (repoPath: string, remote?: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.gitFetch, repoPath, remote)
}

export type GitApi = typeof gitApi
