import { useState } from 'react'
import { Button } from '../common/Button'
import { useRepoStore } from '../../store/repoStore'
import { useStatusStore } from '../../store/statusStore'
import { useCommitMessageStore } from '../../store/commitMessageStore'
import { invalidate } from '../../lib/invalidate'

export function CommitMessageBox(): React.JSX.Element {
  const message = useCommitMessageStore((s) => s.message)
  const setMessage = useCommitMessageStore((s) => s.setMessage)
  const clearMessage = useCommitMessageStore((s) => s.clear)
  const [busy, setBusy] = useState<'commit' | 'amend' | null>(null)
  const repoPath = useRepoStore((s) => s.repoPath)
  const status = useStatusStore((s) => s.status)
  const stagedCount = status?.staged.length ?? 0

  const doCommit = async (amend = false): Promise<void> => {
    if (!repoPath || !message.trim()) return
    setBusy(amend ? 'amend' : 'commit')
    const result = await window.gitApi.commit(repoPath, message.trim(), { amend })
    setBusy(null)
    if (!result.ok) {
      window.alert(result.error.message)
      return
    }
    clearMessage()
    await invalidate(repoPath, ['log', 'status', 'branches'])
  }

  return (
    <div className="border-t border-ide-border p-2">
      <textarea
        className="h-20 w-full resize-none rounded border border-ide-border bg-ide-panelAlt p-2 text-[13px] text-ide-text outline-none focus:border-ide-accent"
        placeholder="Commit message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-ide-textDim">{stagedCount} file(s) staged</span>
        <div className="flex gap-2">
          <Button
            variant="default"
            loading={busy === 'amend'}
            disabled={busy !== null}
            onClick={() => doCommit(true)}
          >
            Amend
          </Button>
          <Button
            variant="primary"
            loading={busy === 'commit'}
            disabled={busy !== null || !message.trim() || stagedCount === 0}
            onClick={() => doCommit(false)}
          >
            Commit
          </Button>
        </div>
      </div>
    </div>
  )
}
