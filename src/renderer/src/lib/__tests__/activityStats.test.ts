import { describe, expect, it } from 'vitest'
import { computeHeatmap, computeWeeklyBars } from '../activityStats'
import type { Commit } from '@shared/types'

function commitOn(iso: string): Commit {
  return {
    sha: iso,
    parents: [],
    authorName: 'a',
    authorEmail: 'a@a.com',
    date: iso,
    subject: 'x',
    refs: []
  }
}

function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

describe('computeHeatmap', () => {
  it('counts multiple commits on the same day into one cell', () => {
    const now = new Date()
    const heatmap = computeHeatmap([commitOn(now.toISOString()), commitOn(now.toISOString())], 4)
    const cell = heatmap.days.find((d) => d.date === localDateKey(now))
    expect(cell?.count).toBe(2)
  })

  it('produces weeks*7 day cells', () => {
    const heatmap = computeHeatmap([], 10)
    expect(heatmap.days.length).toBe(70)
  })

  it('zeroes out future days', () => {
    const future = new Date()
    future.setDate(future.getDate() + 3)
    const heatmap = computeHeatmap([commitOn(future.toISOString())], 4)
    const cell = heatmap.days.find((d) => d.date === localDateKey(future))
    expect(cell?.count).toBe(0)
  })
})

describe('computeWeeklyBars', () => {
  it('buckets a commit into the correct week and returns requested week count', () => {
    const bars = computeWeeklyBars([commitOn(new Date().toISOString())], 6)
    expect(bars.length).toBe(6)
    const total = bars.reduce((sum, b) => sum + b.count, 0)
    expect(total).toBe(1)
    expect(bars[bars.length - 1].count).toBe(1)
  })

  it('ignores commits older than the requested window', () => {
    const old = new Date()
    old.setFullYear(old.getFullYear() - 2)
    const bars = computeWeeklyBars([commitOn(old.toISOString())], 4)
    const total = bars.reduce((sum, b) => sum + b.count, 0)
    expect(total).toBe(0)
  })
})
