import { useEffect, useState } from 'react'
import { Button } from '../common/Button'
import { IconSparkle } from '../common/icons'
import { useRepoStore } from '../../store/repoStore'
import { useStatusStore } from '../../store/statusStore'
import { useCommitMessageStore } from '../../store/commitMessageStore'
import { useAiStore } from '../../store/aiStore'
import { invalidate } from '../../lib/invalidate'
import { SettingsModal } from '../layout/SettingsModal'

export function CommitMessageBox(): React.JSX.Element {
  const message = useCommitMessageStore((s) => s.message)
  const setMessage = useCommitMessageStore((s) => s.setMessage)
  const clearMessage = useCommitMessageStore((s) => s.clear)
  const [busy, setBusy] = useState<'commit' | 'amend' | 'generate' | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const repoPath = useRepoStore((s) => s.repoPath)
  const status = useStatusStore((s) => s.status)
  const stagedCount = status?.staged.length ?? 0

  const aiStatus = useAiStore((s) => s.status)
  const refreshAiStatus = useAiStore((s) => s.refresh)
  const aiConnected = !!(aiStatus?.hasApiKey || aiStatus?.cliAvailable)

  useEffect(() => {
    if (!aiStatus) refreshAiStatus()
  }, [aiStatus, refreshAiStatus])

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

  const generateMessage = async (): Promise<void> => {
    if (!repoPath) return
    if (!aiConnected) {
      setShowSettings(true)
      return
    }
    setBusy('generate')
    const result = await window.gitApi.generateCommitMessage(repoPath)
    setBusy(null)
    if (!result.ok) {
      if (result.error.code === 'CLAUDE_NOT_CONFIGURED') {
        setShowSettings(true)
        return
      }
      window.alert(result.error.message)
      return
    }
    setMessage(result.data)
  }

  return (
    <div className="border-t border-ide-border p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-ide-textDim">{stagedCount} file(s) staged</span>
        <Button
          variant="ghost"
          loading={busy === 'generate'}
          disabled={busy !== null || stagedCount === 0}
          onClick={generateMessage}
          title={
            aiConnected
              ? 'Generate a commit message from the staged diff'
              : 'Connect an AI provider in Settings to generate commit messages'
          }
        >
          {busy !== 'generate' && <IconSparkle className="h-3.5 w-3.5 text-ide-accent" />}
          {aiConnected ? 'Generate with AI' : 'Connect AI to Generate'}
        </Button>
      </div>
      <textarea
        className="h-20 w-full resize-none rounded border border-ide-border bg-ide-panelAlt p-2 text-[13px] text-ide-text outline-none focus:border-ide-accent"
        placeholder="Commit message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="mt-2 flex items-center justify-end gap-2">
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
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
