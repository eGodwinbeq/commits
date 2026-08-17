import type { GraphRow } from '../../graph/types'
import { CommitGraphColumn, ROW_HEIGHT } from './CommitGraphColumn'
import { RefBadge } from './RefBadge'
import { formatRelativeDate, shortSha } from '../../lib/formatters'

interface Props {
  row: GraphRow
  prevRow: GraphRow | undefined
  nextRow: GraphRow | undefined
  isSelected: boolean
  isWorkingTreeRow?: boolean
  onClick: () => void
}

export function CommitRow({
  row,
  prevRow,
  nextRow,
  isSelected,
  isWorkingTreeRow,
  onClick
}: Props): React.JSX.Element {
  const { commit } = row
  return (
    <div
      className={`flex cursor-pointer items-center border-b border-ide-border/40 px-2 text-[13px] ${
        isSelected ? 'bg-ide-selected' : 'hover:bg-ide-hover'
      }`}
      style={{ height: ROW_HEIGHT }}
      onClick={onClick}
    >
      <CommitGraphColumn row={row} prevRow={prevRow} nextRow={nextRow} />
      <div className="flex min-w-0 flex-1 items-center gap-1 px-2">
        {commit.refs.map((ref, i) => (
          <RefBadge key={i} ref={ref} />
        ))}
        <span className={`truncate ${isWorkingTreeRow ? 'italic text-ide-textDim' : ''}`}>
          {commit.subject}
        </span>
      </div>
      <div className="w-36 shrink-0 truncate px-2 text-ide-textDim">{commit.authorName}</div>
      <div className="w-20 shrink-0 px-2 text-ide-textDim">{formatRelativeDate(commit.date)}</div>
      <div className="w-16 shrink-0 px-2 font-mono text-ide-textDim">{shortSha(commit.sha)}</div>
    </div>
  )
}
