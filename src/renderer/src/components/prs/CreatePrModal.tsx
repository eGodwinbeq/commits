import { useMemo, useState } from 'react'
import { useBranchStore, currentBranchName } from '../../store/branchStore'
import { useRepoStore } from '../../store/repoStore'
import { usePrStore } from '../../store/prStore'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

export function CreatePrModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  const branches = useBranchStore((s) => s.branches)
  const create = usePrStore((s) => s.create)
  const isMutating = usePrStore((s) => s.isMutating)

  const head = currentBranchName(branches)
  const localBranches = useMemo(
    () => branches.filter((b) => b.kind === 'local' && b.name !== head),
    [branches, head]
  )
  const defaultBase =
    localBranches.find((b) => b.name === 'main' || b.name === 'master')?.name ??
    localBranches[0]?.name ??
    ''

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [base, setBase] = useState(defaultBase)
  const [draft, setDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (): Promise<void> => {
    if (!repoPath || !title.trim() || !base) return
    setError(null)
    const result = await create(repoPath, { title: title.trim(), body, base, draft })
    if (!result.ok) {
      setError(result.message)
      return
    }
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-3 text-[15px] font-semibold text-ide-text">New Pull Request</h2>

      <div className="mb-3 flex items-center gap-2 text-[12px] text-ide-textDim">
        <span className="rounded border border-ide-border px-1.5 py-0.5 font-mono">
          {head ?? '?'}
        </span>
        <span>into</span>
        <select
          className="rounded border border-ide-border bg-ide-bg px-1.5 py-0.5 font-mono text-ide-text outline-none"
          value={base}
          onChange={(e) => setBase(e.target.value)}
        >
          {localBranches.length === 0 && <option value="">No other local branches</option>}
          {localBranches.map((b) => (
            <option key={b.refName} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <input
        autoFocus
        className="mb-2 w-full rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[13px] text-ide-text outline-none"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="mb-2 h-28 w-full resize-none rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[13px] text-ide-text outline-none"
        placeholder="Description (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <label className="mb-3 flex items-center gap-2 text-[12px] text-ide-textDim">
        <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
        Create as draft
      </label>

      {error && <div className="mb-3 text-[12px] text-ide-red">{error}</div>}

      <div className="flex justify-end gap-2">
        <Button variant="default" disabled={isMutating} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={isMutating}
          disabled={!title.trim() || !base}
          onClick={submit}
        >
          Create Pull Request
        </Button>
      </div>
    </Modal>
  )
}
