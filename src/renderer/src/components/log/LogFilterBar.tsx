import { useMemo } from 'react'
import { useLogStore } from '../../store/logStore'
import { useBranchStore } from '../../store/branchStore'
import { useRepoStore } from '../../store/repoStore'
import { SearchableSelect } from '../common/SearchableSelect'
import { IconClose, IconSearch } from '../common/icons'

export function LogFilterBar(): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  const commits = useLogStore((s) => s.commits)
  const branch = useLogStore((s) => s.branch)
  const filters = useLogStore((s) => s.filters)
  const setBranch = useLogStore((s) => s.setBranch)
  const setFilters = useLogStore((s) => s.setFilters)
  const clearFilters = useLogStore((s) => s.clearFilters)
  const branches = useBranchStore((s) => s.branches)

  const branchOptions = useMemo(
    () => [
      { value: '', label: 'All branches' },
      ...branches
        .filter((b) => b.kind !== 'tag')
        .map((b) => ({ value: b.name, label: b.name, description: b.kind }))
    ],
    [branches]
  )

  const authorOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const c of commits) {
      if (!seen.has(c.authorEmail)) seen.set(c.authorEmail, c.authorName)
    }
    return [
      { value: '', label: 'All authors' },
      ...Array.from(seen.entries()).map(([email, name]) => ({
        value: email,
        label: name,
        description: email
      }))
    ]
  }, [commits])

  const hasActiveFilters =
    !!filters.search || !!filters.authorEmail || !!filters.since || !!filters.until || !!branch

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ide-border px-2 py-1.5">
      <div className="flex min-w-[160px] flex-1 items-center gap-1.5 rounded border border-ide-border bg-ide-bg px-2 py-1">
        <IconSearch className="h-3.5 w-3.5 shrink-0 text-ide-textDim" />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Search messages, author, sha…"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-ide-text outline-none placeholder:text-ide-textDim"
        />
      </div>

      <SearchableSelect
        className="w-40"
        value={branch ?? ''}
        onChange={(v) => repoPath && setBranch(repoPath, v || null)}
        options={branchOptions}
      />

      <SearchableSelect
        className="w-44"
        value={filters.authorEmail ?? ''}
        onChange={(v) => setFilters({ authorEmail: v || null })}
        options={authorOptions}
      />

      <input
        type="date"
        value={filters.since ?? ''}
        onChange={(e) => setFilters({ since: e.target.value || null })}
        className="rounded border border-ide-border bg-ide-bg px-2 py-1 text-[12px] text-ide-text outline-none"
        title="Since"
      />
      <span className="text-[12px] text-ide-textDim">to</span>
      <input
        type="date"
        value={filters.until ?? ''}
        onChange={(e) => setFilters({ until: e.target.value || null })}
        className="rounded border border-ide-border bg-ide-bg px-2 py-1 text-[12px] text-ide-text outline-none"
        title="Until"
      />

      {hasActiveFilters && (
        <button
          className="flex items-center gap-1 rounded px-2 py-1 text-[12px] text-ide-textDim hover:bg-ide-hover hover:text-ide-text"
          onClick={() => {
            clearFilters()
            if (repoPath && branch) setBranch(repoPath, null)
          }}
        >
          <IconClose className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  )
}
