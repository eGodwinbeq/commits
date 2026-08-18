import { useUiStore } from '../../store/uiStore'
import { IconActivity, IconChanges, IconLog, IconPullRequest } from '../common/icons'
import { useStatusStore } from '../../store/statusStore'

const ITEMS = [
  { key: 'changes', label: 'Changes', icon: IconChanges },
  { key: 'log', label: 'Log', icon: IconLog },
  { key: 'pullRequests', label: 'Pull Requests', icon: IconPullRequest },
  { key: 'activity', label: 'Activity', icon: IconActivity }
] as const

export function SideNav(): React.JSX.Element {
  const activeTab = useUiStore((s) => s.activeTab)
  const setActiveTab = useUiStore((s) => s.setActiveTab)
  const status = useStatusStore((s) => s.status)
  const changesCount =
    (status?.staged.length ?? 0) + (status?.unstaged.length ?? 0) + (status?.untracked.length ?? 0)

  return (
    <div className="flex flex-col gap-0.5 border-b border-ide-border p-2">
      {ITEMS.map(({ key, label, icon: Icon }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            className={`group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-100 ${
              active
                ? 'bg-ide-accent/15 text-ide-accent'
                : 'text-ide-textDim hover:bg-ide-hover hover:text-ide-text'
            }`}
            onClick={() => setActiveTab(key)}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-ide-accent' : 'text-ide-textDim group-hover:text-ide-text'}`} />
            <span className="flex-1 text-left">{label}</span>
            {key === 'changes' && changesCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  active ? 'bg-ide-accent text-white' : 'bg-ide-hover text-ide-textDim'
                }`}
              >
                {changesCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
