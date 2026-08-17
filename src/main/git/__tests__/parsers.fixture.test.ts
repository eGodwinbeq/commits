import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execSync } from 'child_process'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { getLog } from '../gitLog'
import { getBranches } from '../gitBranches'
import { getStatus } from '../gitStatus'

let repo: string

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'gitdesk-fixture-'))
  const run = (cmd: string): void => {
    execSync(cmd, { cwd: repo, stdio: 'ignore' })
  }
  run('git init -q -b main')
  run('git config user.email test@test.com')
  run('git config user.name Test')
  execSync('git commit -q -m init --allow-empty', { cwd: repo, stdio: 'ignore' })
  run('git checkout -q -b feature')
  execSync('git commit -q -m "feature work" --allow-empty', { cwd: repo, stdio: 'ignore' })
  run('git checkout -q main')
  run('git merge --no-ff -q feature -m "merge feature"')
  execSync('git tag v1.0', { cwd: repo, stdio: 'ignore' })
})

afterAll(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('getLog', () => {
  it('parses commits with parents and refs, unaffected by the field separator', async () => {
    const commits = await getLog(repo, { maxCount: 10 })
    expect(commits.length).toBe(3)

    const merge = commits.find((c) => c.subject === 'merge feature')
    expect(merge?.parents.length).toBe(2)
    expect(merge?.authorName).toBe('Test')
    expect(merge?.refs.some((r) => r.name === 'main')).toBe(true)

    const initCommit = commits.find((c) => c.subject === 'init')
    expect(initCommit).toBeDefined()
    expect(initCommit?.parents).toEqual([])
  })
})

describe('getBranches', () => {
  it('parses local branches with correct HEAD flag', async () => {
    const branches = await getBranches(repo)
    const local = branches.filter((b) => b.kind === 'local')
    expect(local.map((b) => b.name).sort()).toEqual(['feature', 'main'])
    expect(local.find((b) => b.name === 'main')?.isHead).toBe(true)
    expect(local.find((b) => b.name === 'feature')?.isHead).toBe(false)
  })

  it('parses tags', async () => {
    const branches = await getBranches(repo)
    expect(branches.some((b) => b.kind === 'tag' && b.name === 'v1.0')).toBe(true)
  })
})

describe('getStatus', () => {
  it('reports clean tree with no changes', async () => {
    const status = await getStatus(repo)
    expect(status.branch).toBe('main')
    expect(status.staged).toEqual([])
    expect(status.unstaged).toEqual([])
    expect(status.untracked).toEqual([])
  })

  it('detects untracked, staged, and modified files', async () => {
    const fs = await import('fs')
    fs.writeFileSync(join(repo, 'untracked.txt'), 'x')
    fs.writeFileSync(join(repo, 'staged.txt'), 'x')
    execSync('git add staged.txt', { cwd: repo, stdio: 'ignore' })

    const status = await getStatus(repo)
    expect(status.untracked.map((f) => f.path)).toContain('untracked.txt')
    expect(status.staged.map((f) => f.path)).toContain('staged.txt')
  })
})
