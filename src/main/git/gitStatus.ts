import { execGit } from './gitExecutor'
import type { FileStatusCode, RepoStatus } from '@shared/types'

function xyToStatus(x: string, y: string): { staged?: FileStatusCode; unstaged?: FileStatusCode } {
  const map: Record<string, FileStatusCode> = {
    M: 'modified',
    A: 'added',
    D: 'deleted',
    R: 'renamed',
    C: 'copied'
  }
  return {
    staged: x !== '.' && map[x] ? map[x] : undefined,
    unstaged: y !== '.' && map[y] ? map[y] : undefined
  }
}

export async function getStatus(repoPath: string): Promise<RepoStatus> {
  const result = await execGit(repoPath, ['status', '--porcelain=v2', '--branch', '-z'])
  if (result.code !== 0) {
    throw new Error(`git status failed: ${result.stderr}`)
  }

  const text = result.stdout.toString('utf-8')
  const records = text.split('\x00').filter((r) => r.length > 0)

  const status: RepoStatus = {
    branch: null,
    upstream: null,
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
    conflicted: []
  }

  let i = 0
  while (i < records.length) {
    const record = records[i]

    if (record.startsWith('# branch.head ')) {
      status.branch = record.replace('# branch.head ', '').trim()
    } else if (record.startsWith('# branch.upstream ')) {
      status.upstream = record.replace('# branch.upstream ', '').trim()
    } else if (record.startsWith('# branch.ab ')) {
      const m = record.match(/\+(\d+) -(\d+)/)
      if (m) {
        status.ahead = parseInt(m[1], 10)
        status.behind = parseInt(m[2], 10)
      }
    } else if (record.startsWith('1 ')) {
      // ordinary changed entry: 1 XY sub mH mI mW hH hI path
      const parts = record.split(' ')
      const xy = parts[1]
      const path = parts.slice(8).join(' ')
      const { staged, unstaged } = xyToStatus(xy[0], xy[1])
      if (staged) status.staged.push({ path, status: staged })
      if (unstaged) status.unstaged.push({ path, status: unstaged })
    } else if (record.startsWith('2 ')) {
      // rename/copy entry: 2 XY sub mH mI mW hH hI X<score> path<sep>origPath
      const parts = record.split(' ')
      const xy = parts[1]
      const path = parts.slice(9).join(' ')
      i++
      const origPath = records[i] ?? ''
      const { staged, unstaged } = xyToStatus(xy[0], xy[1])
      if (staged) status.staged.push({ path, origPath, status: 'renamed' })
      if (unstaged) status.unstaged.push({ path, origPath, status: unstaged ?? 'renamed' })
    } else if (record.startsWith('u ')) {
      // unmerged/conflicted: u XY sub m1 m2 m3 mW h1 h2 h3 path
      const parts = record.split(' ')
      const path = parts.slice(10).join(' ')
      status.conflicted.push({ path, status: 'conflicted' })
    } else if (record.startsWith('? ')) {
      const path = record.slice(2)
      status.untracked.push({ path, status: 'untracked' })
    }

    i++
  }

  return status
}
