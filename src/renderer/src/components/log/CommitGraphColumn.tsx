import type { GraphRow } from '../../graph/types'

const LANE_WIDTH = 16
const ROW_HEIGHT = 28
const LANE_COLORS = [
  '#3574f0',
  '#57965c',
  '#c9a03f',
  '#a571e6',
  '#3fa6c9',
  '#e05555',
  '#e08a3f',
  '#5cc9a0',
  '#c95c9f',
  '#8fc93f',
  '#c93f6f',
  '#3f6fc9'
]

interface Props {
  row: GraphRow
  prevRow: GraphRow | undefined
  nextRow: GraphRow | undefined
}

export function CommitGraphColumn({ row, prevRow }: Props): React.JSX.Element {
  const width = Math.max(row.laneCount * LANE_WIDTH + LANE_WIDTH, LANE_WIDTH * 2)
  const cx = (lane: number): number => lane * LANE_WIDTH + LANE_WIDTH / 2
  const midY = ROW_HEIGHT / 2

  const color = (lane: number): string => LANE_COLORS[lane % LANE_COLORS.length]

  const passThroughLanes = new Set<number>()
  if (prevRow) {
    for (const e of prevRow.edges) {
      if (e.toLane !== row.lane && e.toLane === e.fromLane) passThroughLanes.add(e.toLane)
    }
  }

  return (
    <svg width={width} height={ROW_HEIGHT} className="shrink-0 overflow-visible">
      {/* pass-through vertical lines for lanes not involved in this row's node */}
      {Array.from({ length: row.laneCount }).map((_, lane) => {
        if (lane === row.lane) return null
        return (
          <line
            key={`pt-${lane}`}
            x1={cx(lane)}
            y1={0}
            x2={cx(lane)}
            y2={ROW_HEIGHT}
            stroke={color(lane)}
            strokeWidth={2}
            opacity={0.5}
          />
        )
      })}

      {/* incoming edge from previous row into this row's node */}
      {prevRow?.edges.some((e) => e.toLane === row.lane) && (
        <line
          x1={cx(row.lane)}
          y1={0}
          x2={cx(row.lane)}
          y2={midY}
          stroke={color(row.lane)}
          strokeWidth={2}
        />
      )}

      {/* outgoing edges from this row's node to parents (possibly other lanes) */}
      {row.edges.map((e, i) => (
        <path
          key={i}
          d={`M ${cx(e.fromLane)} ${midY} L ${cx(e.toLane)} ${ROW_HEIGHT}`}
          stroke={color(e.type === 'straight' ? e.fromLane : e.toLane)}
          strokeWidth={2}
          fill="none"
        />
      ))}

      <circle
        cx={cx(row.lane)}
        cy={midY}
        r={4.5}
        fill={color(row.lane)}
        stroke="rgb(var(--ide-panel))"
        strokeWidth={1.5}
      />
    </svg>
  )
}

export { ROW_HEIGHT }
