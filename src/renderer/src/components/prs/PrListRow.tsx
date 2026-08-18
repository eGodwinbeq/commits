import type { PullRequest } from '@shared/types'
import { formatRelativeDate } from '../../lib/formatters'
import { PrStateBadge } from './PrStateBadge'

export function PrListRow({
  pr,
  isSelected,
  onClick
}: {
  pr: PullRequest
  isSelected: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <div
      className={`cursor-pointer border-b border-ide-border/40 px-3 py-2 text-[13px] ${
        isSelected ? 'bg-ide-selected' : 'hover:bg-ide-hover'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 truncate font-medium text-ide-text">{pr.title}</span>
        <span className="shrink-0 text-ide-textDim">#{pr.number}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-ide-textDim">
        <PrStateBadge pr={pr} />
        <span className="truncate">{pr.author}</span>
        <span>·</span>
        <span className="shrink-0">{formatRelativeDate(pr.updatedAt)}</span>
      </div>
      <div className="mt-1 truncate font-mono text-[11px] text-ide-textDim">
        {pr.headRefName} → {pr.baseRefName}
      </div>
    </div>
  )
}
