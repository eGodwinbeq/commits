import { useMemo, useState } from 'react'
import { useBranchStore, currentBranchName } from '../../store/branchStore'
import { useRepoStore } from '../../store/repoStore'
import { usePrStore } from '../../store/prStore'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { SearchableSelect } from '../common/SearchableSelect'

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function CreatePrModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  const branches = useBranchStore((s) => s.branches)
  const create = usePrStore((s) => s.create)
  const isMutating = usePrStore((s) => s.isMutating)

  const currentHead = currentBranchName(branches)
  const localBranches = useMemo(() => branches.filter((b) => b.kind === 'local'), [branches])

  const [head, setHead] = useState(currentHead ?? localBranches[0]?.name ?? '')
  const baseCandidates = useMemo(
    () => localBranches.filter((b) => b.name !== head),
    [localBranches, head]
  )
  const defaultBase =
    baseCandidates.find((b) => b.name === 'main' || b.name === 'master')?.name ??
    baseCandidates[0]?.name ??
    ''
  const [base, setBase] = useState(defaultBase)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [draft, setDraft] = useState(false)
  const [reviewers, setReviewers] = useState('')
  const [labels, setLabels] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pushing, setPushing] = useState(false)

  const headBranch = localBranches.find((b) => b.name === head)
  const needsPush = !headBranch?.upstream

  const submit = async (): Promise<void> => {
    if (!repoPath || !title.trim() || !base || !head) return
    setError(null)

    if (needsPush) {
      setPushing(true)
      const pushResult = await window.gitApi.push(repoPath, {
        remote: 'origin',
        branch: head,
        setUpstream: true
      })
      setPushing(false)
      if (!pushResult.ok) {
        setError(`Couldn't push "${head}" to origin: ${pushResult.error.message}`)
        return
      }
    }

    const result = await create(repoPath, {
      title: title.trim(),
      body,
      base,
      head,
      draft,
      reviewers: splitList(reviewers),
      labels: splitList(labels)
    })
    if (!result.ok) {
      setError(result.message)
      return
    }
    onClose()
  }

  const busy = isMutating || pushing

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-3 text-[15px] font-semibold text-ide-text">New Pull Request</h2>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-ide-textDim">From</div>
          <SearchableSelect
            value={head}
            onChange={setHead}
            placeholder="Select branch…"
            emptyLabel="No local branches"
            options={localBranches.map((b) => ({
              value: b.name,
              label: b.name,
              description: b.name === currentHead ? 'current branch' : undefined
            }))}
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wide text-ide-textDim">Into</div>
          <SearchableSelect
            value={base}
            onChange={setBase}
            placeholder="Select branch…"
            emptyLabel="No other local branches"
            options={baseCandidates.map((b) => ({ value: b.name, label: b.name }))}
          />
        </div>
      </div>

      {needsPush && head && (
        <div className="mb-3 rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[12px] text-ide-textDim">
          "{head}" hasn&apos;t been pushed yet - it will be pushed to origin first.
        </div>
      )}

      <input
        autoFocus
        className="mb-2 w-full rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[13px] text-ide-text outline-none"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="mb-2 h-24 w-full resize-none rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[13px] text-ide-text outline-none"
        placeholder="Description (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          className="w-full rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[12px] text-ide-text outline-none"
          placeholder="Reviewers (comma separated)"
          value={reviewers}
          onChange={(e) => setReviewers(e.target.value)}
        />
        <input
          className="w-full rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[12px] text-ide-text outline-none"
          placeholder="Labels (comma separated)"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
        />
      </div>

      <label className="mb-3 flex items-center gap-2 text-[12px] text-ide-textDim">
        <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
        Create as draft
      </label>

      {error && <div className="mb-3 text-[12px] text-ide-red">{error}</div>}

      <div className="flex justify-end gap-2">
        <Button variant="default" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={busy}
          disabled={!title.trim() || !base || !head}
          onClick={submit}
        >
          {pushing ? 'Pushing branch…' : 'Create Pull Request'}
        </Button>
      </div>
    </Modal>
  )
}
