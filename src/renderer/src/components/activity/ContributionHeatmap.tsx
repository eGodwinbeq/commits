import { useMemo } from 'react'
import type { Commit } from '@shared/types'
import { computeHeatmap } from '../../lib/activityStats'

const CELL = 11
const GAP = 3
const LABEL_COL_WIDTH = 24
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

// References the theme-aware --ide-heat-* CSS variables (see index.css) rather than fixed
// hex values, so the heatmap follows the active light/dark theme automatically.
function intensityColor(count: number, max: number): string {
  if (count === 0 || max === 0) return 'rgb(var(--ide-heat-0))'
  const ratio = count / max
  if (ratio > 0.75) return 'rgb(var(--ide-heat-4))'
  if (ratio > 0.5) return 'rgb(var(--ide-heat-3))'
  if (ratio > 0.25) return 'rgb(var(--ide-heat-2))'
  return 'rgb(var(--ide-heat-1))'
}

export function ContributionHeatmap({ commits }: { commits: Commit[] }): React.JSX.Element {
  const heatmap = useMemo(() => computeHeatmap(commits, 53), [commits])
  const width = LABEL_COL_WIDTH + heatmap.weekCount * (CELL + GAP)
  const height = 7 * (CELL + GAP)

  return (
    <div className="overflow-x-auto p-4">
      <svg width={width} height={height + 16} className="overflow-visible">
        {heatmap.monthLabels.map((m, i) => (
          <text
            key={i}
            x={LABEL_COL_WIDTH + m.weekIndex * (CELL + GAP)}
            y={10}
            className="fill-ide-textDim text-[10px]"
          >
            {m.label}
          </text>
        ))}
        <g transform={`translate(${LABEL_COL_WIDTH}, 16)`}>
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text key={i} x={-6} y={i * (CELL + GAP) + CELL - 1} textAnchor="end" className="fill-ide-textDim text-[9px]">
                {label}
              </text>
            ) : null
          )}
          {heatmap.days.map((day) => (
            <rect
              key={day.date}
              x={day.weekIndex * (CELL + GAP)}
              y={day.dayOfWeek * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={2}
              fill={intensityColor(day.count, heatmap.maxCount)}
            >
              <title>
                {day.count} commit{day.count === 1 ? '' : 's'} on {day.date}
              </title>
            </rect>
          ))}
        </g>
      </svg>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-ide-textDim">
        <span>Less</span>
        {[0, 0.2, 0.45, 0.7, 1].map((r, i) => (
          <span
            key={i}
            className="inline-block h-[10px] w-[10px] rounded-sm"
            style={{ backgroundColor: intensityColor(Math.round(r * heatmap.maxCount) || (r > 0 ? 1 : 0), heatmap.maxCount || 1) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
