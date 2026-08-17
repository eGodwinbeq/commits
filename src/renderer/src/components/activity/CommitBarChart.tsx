import { useMemo } from 'react'
import type { Commit } from '@shared/types'
import { computeWeeklyBars } from '../../lib/activityStats'

const BAR_WIDTH = 14
const GAP = 6
const CHART_HEIGHT = 140

export function CommitBarChart({ commits }: { commits: Commit[] }): React.JSX.Element {
  const bars = useMemo(() => computeWeeklyBars(commits, 26), [commits])
  const max = Math.max(1, ...bars.map((b) => b.count))
  const width = bars.length * (BAR_WIDTH + GAP)

  return (
    <div className="overflow-x-auto p-4">
      <svg width={width} height={CHART_HEIGHT + 24} className="overflow-visible">
        {bars.map((bar, i) => {
          const barHeight = Math.max(bar.count > 0 ? 2 : 0, (bar.count / max) * CHART_HEIGHT)
          const x = i * (BAR_WIDTH + GAP)
          const y = CHART_HEIGHT - barHeight
          return (
            <g key={bar.weekStart}>
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                rx={2}
                className={bar.count > 0 ? 'fill-ide-accent' : 'fill-ide-border'}
              >
                <title>
                  {bar.count} commit{bar.count === 1 ? '' : 's'} - week of {bar.label}
                </title>
              </rect>
              {i % 4 === 0 && (
                <text
                  x={x}
                  y={CHART_HEIGHT + 16}
                  className="fill-ide-textDim text-[10px]"
                >
                  {bar.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
