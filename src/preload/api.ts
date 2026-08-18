import { ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type {
  AiStatus,
  Branch,
  Commit,
  DiffFile,
  GithubAuthEvent,
  GitResult,
  PrMergeMethod,
  PrStateFilter,
  PullRequest,
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
  trustDirectory: (path: string): Promise<GitResult<void>> =>
    ipcRenderer.invoke(IpcChannels.repoTrustDirectory, path),
  getCommitCount: (path: string): Promise<GitResult<number>> =>
    ipcRenderer.invoke(IpcChannels.repoCommitCount, path),

  getLog: (
    repoPath: string,
    opts?: { maxCount?: number; skip?: number; branch?: string }
  ): Promise<GitResult<Commit[]>> => ipcRenderer.invoke(IpcChannels.gitLog, repoPath, opts),
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

  checkout: (
    repoPath: string,
    ref: string,
    kind?: 'local' | 'remote' | 'tag'
  ): Promise<GitResult<string>> => ipcRenderer.invoke(IpcChannels.gitCheckout, repoPath, ref, kind),
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
    ipcRenderer.invoke(IpcChannels.gitFetch, repoPath, remote),

  listPullRequests: (repoPath: string, state?: PrStateFilter): Promise<GitResult<PullRequest[]>> =>
    ipcRenderer.invoke(IpcChannels.prList, repoPath, state),
  getPullRequest: (repoPath: string, number: number): Promise<GitResult<PullRequest>> =>
    ipcRenderer.invoke(IpcChannels.prGet, repoPath, number),
  getPullRequestDiff: (repoPath: string, number: number): Promise<GitResult<DiffFile[]>> =>
    ipcRenderer.invoke(IpcChannels.prDiff, repoPath, number),
  createPullRequest: (
    repoPath: string,
    opts: {
      title: string
      body: string
      base: string
      head?: string
      draft?: boolean
      reviewers?: string[]
      labels?: string[]
    }
  ): Promise<GitResult<PullRequest>> => ipcRenderer.invoke(IpcChannels.prCreate, repoPath, opts),
  mergePullRequest: (
    repoPath: string,
    number: number,
    opts: { method: PrMergeMethod; deleteBranch?: boolean }
  ): Promise<GitResult<void>> => ipcRenderer.invoke(IpcChannels.prMerge, repoPath, number, opts),
  closePullRequest: (repoPath: string, number: number): Promise<GitResult<void>> =>
    ipcRenderer.invoke(IpcChannels.prClose, repoPath, number),

  generateCommitMessage: (repoPath: string): Promise<GitResult<string>> =>
    ipcRenderer.invoke(IpcChannels.aiGenerateCommitMessage, repoPath),
  getAiStatus: (): Promise<GitResult<AiStatus>> => ipcRenderer.invoke(IpcChannels.aiGetStatus),
  setAiApiKey: (key: string): Promise<GitResult<void>> =>
    ipcRenderer.invoke(IpcChannels.aiSetApiKey, key),
  clearAiApiKey: (): Promise<GitResult<void>> => ipcRenderer.invoke(IpcChannels.aiClearApiKey),
  testClaudeCli: (): Promise<GitResult<string>> => ipcRenderer.invoke(IpcChannels.aiTestClaudeCli),
  launchClaudeSignIn: (): Promise<GitResult<void>> =>
    ipcRenderer.invoke(IpcChannels.aiLaunchClaudeSignIn),

  startGithubDeviceAuth: (): Promise<void> => ipcRenderer.invoke(IpcChannels.ghStartDeviceAuth),
  cancelGithubDeviceAuth: (): Promise<void> => ipcRenderer.invoke(IpcChannels.ghCancelDeviceAuth),
  onGithubAuthEvent: (callback: (event: GithubAuthEvent) => void): (() => void) => {
    const listener = (_evt: IpcRendererEvent, data: GithubAuthEvent): void => callback(data)
    ipcRenderer.on(IpcChannels.ghAuthEvent, listener)
    return () => ipcRenderer.removeListener(IpcChannels.ghAuthEvent, listener)
  }
}

export type GitApi = typeof gitApi
