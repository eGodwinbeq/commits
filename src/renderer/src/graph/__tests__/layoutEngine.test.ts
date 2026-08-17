import { describe, expect, it } from 'vitest'
import { computeGraphLayout } from '../layoutEngine'
import type { Commit } from '@shared/types'

function commit(sha: string, parents: string[]): Commit {
  return {
    sha,
    parents,
    authorName: 'a',
    authorEmail: 'a@a.com',
    date: '2024-01-01T00:00:00Z',
    subject: sha,
    refs: []
  }
}

describe('computeGraphLayout', () => {
  it('keeps a single linear history on one lane', () => {
    const rows = computeGraphLayout([commit('c3', ['c2']), commit('c2', ['c1']), commit('c1', [])])
    expect(rows.every((r) => r.lane === 0)).toBe(true)
  })

  it('assigns a separate lane to a diverging branch', () => {
    // c3 (branch tip) and c2 (main tip) both descend from c1; git log --all order:
    // newest first across both branches.
    const rows = computeGraphLayout([
      commit('c3', ['c1']),
      commit('c2', ['c1']),
      commit('c1', [])
    ])
    const lanes = new Set(rows.slice(0, 2).map((r) => r.lane))
    expect(lanes.size).toBe(2)
  })

  it('records two merge edges for a merge commit', () => {
    const rows = computeGraphLayout([
      commit('merge', ['main-1', 'feature-1']),
      commit('feature-1', ['base']),
      commit('main-1', ['base']),
      commit('base', [])
    ])
    const mergeRow = rows[0]
    expect(mergeRow.edges.length).toBe(2)
  })

  it('frees and reuses a lane after a branch tip is reached', () => {
    const rows = computeGraphLayout([
      commit('c3', ['c1']),
      commit('c2', ['c1']),
      commit('c1', [])
    ])
    // after both tips are consumed into c1, only one lane should remain active
    expect(rows[2].lane).toBeLessThan(2)
  })
})
