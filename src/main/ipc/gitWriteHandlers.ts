import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import * as gitOps from '../git/gitOperations'

export function registerGitWriteHandlers(): void {
  ipcMain.handle(IpcChannels.gitStageFile, (_evt, repoPath: string, path: string) =>
    gitOps.stageFile(repoPath, path)
  )
  ipcMain.handle(IpcChannels.gitUnstageFile, (_evt, repoPath: string, path: string) =>
    gitOps.unstageFile(repoPath, path)
  )
  ipcMain.handle(IpcChannels.gitStagePaths, (_evt, repoPath: string, paths: string[]) =>
    gitOps.stagePaths(repoPath, paths)
  )
  ipcMain.handle(IpcChannels.gitUnstagePaths, (_evt, repoPath: string, paths: string[]) =>
    gitOps.unstagePaths(repoPath, paths)
  )
  ipcMain.handle(IpcChannels.gitDiscardChanges, (_evt, repoPath: string, path: string) =>
    gitOps.discardChanges(repoPath, path)
  )
  ipcMain.handle(
    IpcChannels.gitCommit,
    (_evt, repoPath: string, message: string, opts?: { amend?: boolean }) =>
      gitOps.commit(repoPath, message, opts)
  )

  ipcMain.handle(
    IpcChannels.gitCheckout,
    (_evt, repoPath: string, ref: string, kind?: 'local' | 'remote' | 'tag') =>
      gitOps.checkout(repoPath, ref, kind)
  )
  ipcMain.handle(
    IpcChannels.gitCreateBranch,
    (_evt, repoPath: string, name: string, startPoint?: string, doCheckout?: boolean) =>
      gitOps.createBranch(repoPath, name, startPoint, doCheckout)
  )
  ipcMain.handle(
    IpcChannels.gitRenameBranch,
    (_evt, repoPath: string, oldName: string, newName: string) =>
      gitOps.renameBranch(repoPath, oldName, newName)
  )
  ipcMain.handle(
    IpcChannels.gitDeleteBranch,
    (_evt, repoPath: string, name: string, force?: boolean) =>
      gitOps.deleteBranch(repoPath, name, force)
  )
  ipcMain.handle(IpcChannels.gitMerge, (_evt, repoPath: string, sourceRef: string) =>
    gitOps.merge(repoPath, sourceRef)
  )
  ipcMain.handle(IpcChannels.gitRebase, (_evt, repoPath: string, ontoRef: string) =>
    gitOps.rebase(repoPath, ontoRef)
  )
  ipcMain.handle(
    IpcChannels.gitPush,
    (
      _evt,
      repoPath: string,
      opts: { remote: string; branch: string; setUpstream?: boolean; force?: boolean }
    ) => gitOps.push(repoPath, opts)
  )
  ipcMain.handle(
    IpcChannels.gitPull,
    (_evt, repoPath: string, opts: { remote: string; branch: string; rebase?: boolean }) =>
      gitOps.pull(repoPath, opts)
  )
  ipcMain.handle(IpcChannels.gitFetch, (_evt, repoPath: string, remote?: string) =>
    gitOps.fetch(repoPath, remote)
  )
}
