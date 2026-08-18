import { useState } from 'react'
import type { PrMergeMethod, PullRequest } from '@shared/types'
import { useRepoStore } from '../../store/repoStore'
import { usePrStore } from '../../store/prStore'
import { Button } from '../common/Button'
import { SearchableSelect } from '../common/SearchableSelect'

const METHOD_LABEL: Record<PrMergeMethod, string> = {
  merge: 'Create a merge commit',
  squash: 'Squash and merge',
  rebase: 'Rebase and merge'
}

export function PrMergeControls({ pr }: { pr: PullRequest }): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  const merge = usePrStore((s) => s.merge)
  const close = usePrStore((s) => s.close)
  const isMutating = usePrStore((s) => s.isMutating)

  const [method, setMethod] = useState<PrMergeMethod>('squash')
  const [deleteBranch, setDeleteBranch] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (pr.state !== 'open') return <></>

  const onMerge = async (): Promise<void> => {
    if (!repoPath) return
    if (
      !window.confirm(
        `${METHOD_LABEL[method]} for #${pr.number} "${pr.title}" into ${pr.baseRefName}?${
          deleteBranch ? ` The "${pr.headRefName}" branch will be deleted after merging.` : ''
        }`
      )
    )
      return
    setError(null)
    const result = await merge(repoPath, method, deleteBranch)
    if (!result.ok) setError(result.message)
  }

  const onClose = async (): Promise<void> => {
    if (!repoPath) return
    if (!window.confirm(`Close #${pr.number} "${pr.title}" without merging?`)) return
    setError(null)
    const result = await close(repoPath)
    if (!result.ok) setError(result.message)
  }

  return (
    <div className="border-t border-ide-border px-4 py-3">
      {pr.mergeable === 'CONFLICTING' && (
        <div className="mb-2 text-[12px] text-ide-red">
          This branch has conflicts that must be resolved before merging.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <SearchableSelect
          className="w-52"
          value={method}
          onChange={(v) => setMethod(v as PrMergeMethod)}
          options={(Object.keys(METHOD_LABEL) as PrMergeMethod[]).map((m) => ({
            value: m,
            label: METHOD_LABEL[m]
          }))}
        />
        <Button variant="primary" loading={isMutating} onClick={onMerge}>
          Merge Pull Request
        </Button>
        <label className="flex items-center gap-1.5 text-[12px] text-ide-textDim">
          <input
            type="checkbox"
            checked={deleteBranch}
            onChange={(e) => setDeleteBranch(e.target.checked)}
          />
          Delete branch after merge
        </label>
        <Button variant="ghost" className="ml-auto text-ide-red" disabled={isMutating} onClick={onClose}>
          Close
        </Button>
      </div>
      {error && <div className="mt-2 text-[12px] text-ide-red">{error}</div>}
    </div>
  )
}
