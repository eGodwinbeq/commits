import type { Commit } from '@shared/types'

export interface HeatmapDay {
  date: string // YYYY-MM-DD
  count: number
  weekIndex: number
  dayOfWeek: number // 0 = Sunday
}

export interface HeatmapData {
  days: HeatmapDay[]
  weekCount: number
  maxCount: number
  monthLabels: { weekIndex: number; label: string }[]
}

export interface WeeklyBar {
  weekStart: string // YYYY-MM-DD
  label: string
  count: number
}

// Builds the key from local wall-clock date components rather than toISOString() (UTC) -
// mixing the two causes an off-by-one-day mismatch depending on the machine's timezone
// and time of day, since the grid is built with local setDate() calls.
function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Builds a GitHub-style contribution calendar: one column per week, going back `weeks` weeks. */
export function computeHeatmap(commits: Commit[], weeks = 53): HeatmapData {
  const counts = new Map<string, number>()
  for (const commit of commits) {
    const key = toDateKey(new Date(commit.date))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const today = startOfDay(new Date())
  // Align the grid end to the upcoming Saturday so full weeks render, like GitHub.
  const endOfWeek = new Date(today)
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()))

  const totalDays = weeks * 7
  const start = new Date(endOfWeek)
  start.setDate(start.getDate() - (totalDays - 1))

  const days: HeatmapDay[] = []
  const monthLabels: { weekIndex: number; label: string }[] = []
  let lastMonth = -1

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    const weekIndex = Math.floor(i / 7)
    const dayOfWeek = date.getDay()
    const key = toDateKey(date)

    if (dayOfWeek === 0 && date.getMonth() !== lastMonth && date <= today) {
      lastMonth = date.getMonth()
      monthLabels.push({
        weekIndex,
        label: date.toLocaleDateString(undefined, { month: 'short' })
      })
    }

    days.push({
      date: key,
      count: date > today ? 0 : (counts.get(key) ?? 0),
      weekIndex,
      dayOfWeek
    })
  }

  const maxCount = days.reduce((max, d) => Math.max(max, d.count), 0)

  return { days, weekCount: weeks, maxCount, monthLabels }
}

/** Buckets commits into weekly totals for the last `weeks` weeks, oldest first. */
export function computeWeeklyBars(commits: Commit[], weeks = 26): WeeklyBar[] {
  const today = startOfDay(new Date())
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay())

  const bars: WeeklyBar[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart)
    weekStart.setDate(weekStart.getDate() - i * 7)
    bars.push({
      weekStart: toDateKey(weekStart),
      label: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: 0
    })
  }

  const weekStartMs = bars.map((b) => new Date(b.weekStart).getTime())

  for (const commit of commits) {
    const t = startOfDay(new Date(commit.date)).getTime()
    for (let i = weekStartMs.length - 1; i >= 0; i--) {
      if (t >= weekStartMs[i]) {
        bars[i].count += 1
        break
      }
    }
  }

  return bars
}
