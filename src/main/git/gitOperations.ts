import { execGit } from './gitExecutor'
import type { GitResult } from '@shared/types'

async function run(repoPath: string, args: string[]): Promise<GitResult<string>> {
  const result = await execGit(repoPath, args)
  if (result.code !== 0) {
    return {
      ok: false,
      error: {
        code: 'GIT_ERROR',
        message: `git ${args[0]} failed`,
        stderr: result.stderr
      }
    }
  }
  return { ok: true, data: result.stdout.toString('utf-8') }
}

export const stageFile = (repoPath: string, path: string) => run(repoPath, ['add', '--', path])

export const unstageFile = (repoPath: string, path: string) =>
  run(repoPath, ['restore', '--staged', '--', path])

export const discardChanges = (repoPath: string, path: string) =>
  run(repoPath, ['checkout', '--', path])

export const commit = (repoPath: string, message: string, opts: { amend?: boolean } = {}) => {
  const args = ['commit', '-m', message]
  if (opts.amend) args.push('--amend')
  return run(repoPath, args)
}

export const checkout = (repoPath: string, ref: string) => run(repoPath, ['checkout', ref])

export const createBranch = (
  repoPath: string,
  name: string,
  startPoint?: string,
  doCheckout?: boolean
) => {
  const args = [doCheckout ? 'checkout' : 'branch', doCheckout ? '-b' : '', name]
    .filter(Boolean)
  if (startPoint) args.push(startPoint)
  return run(repoPath, args)
}

export const renameBranch = (repoPath: string, oldName: string, newName: string) =>
  run(repoPath, ['branch', '-m', oldName, newName])

export const deleteBranch = (repoPath: string, name: string, force?: boolean) =>
  run(repoPath, ['branch', force ? '-D' : '-d', name])

export const merge = (repoPath: string, sourceRef: string) => run(repoPath, ['merge', sourceRef])

export const rebase = (repoPath: string, ontoRef: string) => run(repoPath, ['rebase', ontoRef])

export const push = (
  repoPath: string,
  opts: { remote: string; branch: string; setUpstream?: boolean; force?: boolean }
) => {
  const args = ['push']
  if (opts.setUpstream) args.push('-u')
  if (opts.force) args.push('--force-with-lease')
  args.push(opts.remote, opts.branch)
  return run(repoPath, args)
}

export const pull = (repoPath: string, opts: { remote: string; branch: string; rebase?: boolean }) => {
  const args = ['pull']
  if (opts.rebase) args.push('--rebase')
  args.push(opts.remote, opts.branch)
  return run(repoPath, args)
}

export const fetch = (repoPath: string, remote?: string) =>
  run(repoPath, remote ? ['fetch', remote] : ['fetch', '--all'])
