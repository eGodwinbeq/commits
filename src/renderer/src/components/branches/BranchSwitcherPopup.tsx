import { useMemo, useState } from 'react'
import { useBranchStore } from '../../store/branchStore'
import { useRepoStore } from '../../store/repoStore'
import { useUiStore } from '../../store/uiStore'
import { invalidate } from '../../lib/invalidate'

export function BranchSwitcherPopup(): React.JSX.Element | null {
  const open = useUiStore((s) => s.branchSwitcherOpen)
  const setOpen = useUiStore((s) => s.setBranchSwitcherOpen)
  const branches = useBranchStore((s) => s.branches)
  const repoPath = useRepoStore((s) => s.repoPath)
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      branches
        .filter((b) => b.kind !== 'tag')
        .filter((b) => b.name.toLowerCase().includes(query.toLowerCase())),
    [branches, query]
  )

  if (!open) return null

  const checkout = async (name: string): Promise<void> => {
    if (!repoPath) return
    const result = await window.gitApi.checkout(repoPath, name)
    if (!result.ok) window.alert(result.error.message)
    await invalidate(repoPath, ['log', 'branches', 'status'])
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24" onClick={() => setOpen(false)}>
      <div
        className="w-[420px] rounded border border-ide-border bg-ide-panel shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          className="w-full border-b border-ide-border bg-transparent px-3 py-2 text-[13px] text-ide-text outline-none"
          placeholder="Search branches…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
            if (e.key === 'Enter' && filtered.length > 0) checkout(filtered[0].name)
          }}
        />
        <div className="max-h-96 overflow-auto py-1">
          {filtered.map((b) => (
            <button
              key={b.refName}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] hover:bg-ide-selected"
              onClick={() => checkout(b.name)}
            >
              <span className={b.isHead ? 'font-semibold text-ide-accent' : 'text-ide-text'}>
                {b.name}
              </span>
              <span className="text-[11px] text-ide-textDim">{b.kind}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-ide-textDim">No branches found</div>
          )}
        </div>
      </div>
    </div>
  )
}
