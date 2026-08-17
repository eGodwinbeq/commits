import { useUiStore } from '../../store/uiStore'

export function SideNav(): React.JSX.Element {
  const activeTab = useUiStore((s) => s.activeTab)
  const setActiveTab = useUiStore((s) => s.setActiveTab)

  return (
    <div className="border-b border-ide-border py-1">
      {(['changes', 'log'] as const).map((tab) => (
        <button
          key={tab}
          className={`block w-full px-3 py-1.5 text-left text-[13px] capitalize ${
            activeTab === tab
              ? 'bg-ide-selected font-medium text-ide-text'
              : 'text-ide-textDim hover:bg-ide-hover hover:text-ide-text'
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
