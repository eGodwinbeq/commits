import type { PullRequest } from '@shared/types'

export function PrStateBadge({ pr }: { pr: PullRequest }): React.JSX.Element {
  if (pr.isDraft) {
    return (
      <span className="rounded px-1.5 py-0.5 text-[11px] font-medium text-ide-textDim border border-ide-border">
        Draft
      </span>
    )
  }
  if (pr.state === 'merged') {
    return (
      <span className="rounded bg-ide-purple/20 px-1.5 py-0.5 text-[11px] font-medium text-ide-purple border border-ide-purple/40">
        Merged
      </span>
    )
  }
  if (pr.state === 'closed') {
    return (
      <span className="rounded bg-ide-red/20 px-1.5 py-0.5 text-[11px] font-medium text-ide-red border border-ide-red/40">
        Closed
      </span>
    )
  }
  return (
    <span className="rounded bg-ide-green/20 px-1.5 py-0.5 text-[11px] font-medium text-ide-green border border-ide-green/40">
      Open
    </span>
  )
}
