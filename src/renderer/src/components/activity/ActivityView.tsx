import { useLogStore } from '../../store/logStore'
import { ContributionHeatmap } from './ContributionHeatmap'
import { CommitBarChart } from './CommitBarChart'

export function ActivityView(): React.JSX.Element {
  const commits = useLogStore((s) => s.commits)

  if (commits.length === 0) {
    return <div className="p-4 text-ide-textDim">No commits yet.</div>
  }

  return (
    <div className="h-full overflow-auto">
      <div className="border-b border-ide-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ide-textDim">
        Commits per week
      </div>
      <CommitBarChart commits={commits} />
      <div className="border-y border-ide-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ide-textDim">
        Contribution activity
      </div>
      <ContributionHeatmap commits={commits} />
    </div>
  )
}
