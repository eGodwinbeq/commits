import { useEffect, useState } from 'react'
import { useAiStore } from '../../store/aiStore'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

export function SettingsModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const status = useAiStore((s) => s.status)
  const isLoading = useAiStore((s) => s.isLoading)
  const refresh = useAiStore((s) => s.refresh)
  const saveApiKey = useAiStore((s) => s.saveApiKey)
  const removeApiKey = useAiStore((s) => s.removeApiKey)

  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSave = async (): Promise<void> => {
    if (!key.trim()) return
    setSaving(true)
    setError(null)
    const result = await saveApiKey(key.trim())
    setSaving(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setKey('')
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-3 text-[15px] font-semibold text-ide-text">Settings</h2>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ide-textDim">
        AI Commit Messages
      </div>

      {isLoading && !status && (
        <div className="text-[12px] text-ide-textDim">Checking connection…</div>
      )}

      {status && (
        <div className="mb-3 space-y-1.5 text-[12px]">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${status.hasApiKey ? 'bg-ide-green' : 'bg-ide-textDim'}`}
            />
            <span className="text-ide-text">
              Anthropic API key: {status.hasApiKey ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${status.cliAvailable ? 'bg-ide-green' : 'bg-ide-textDim'}`}
            />
            <span className="text-ide-textDim">
              Claude Code CLI:{' '}
              {status.cliAvailable ? `Detected (${status.cliVersion ?? 'unknown version'})` : 'Not detected'}
            </span>
          </div>
        </div>
      )}

      <p className="mb-2 text-[12px] text-ide-textDim">
        Paste an Anthropic API key to connect &quot;Generate with AI&quot; to Claude. The key is
        encrypted with your OS keychain and stored only on this device - it&apos;s sent directly
        to Anthropic&apos;s API and nowhere else.
      </p>

      <div className="mb-2 flex gap-2">
        <input
          type="password"
          autoFocus
          className="min-w-0 flex-1 rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[13px] text-ide-text outline-none"
          placeholder="sk-ant-…"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave()
          }}
        />
        <Button variant="primary" loading={saving} disabled={!key.trim()} onClick={onSave}>
          Save
        </Button>
      </div>
      {status?.hasApiKey && (
        <button className="mb-2 text-[12px] text-ide-red hover:underline" onClick={removeApiKey}>
          Remove saved key
        </button>
      )}
      {error && <div className="mb-2 text-[12px] text-ide-red">{error}</div>}

      <p className="mb-3 text-[12px] text-ide-textDim">
        Prefer not to store a key here? Install the{' '}
        <a
          className="text-ide-accent hover:underline"
          href="https://claude.com/product/claude-code"
          onClick={(e) => {
            e.preventDefault()
            window.open('https://claude.com/product/claude-code', '_blank')
          }}
        >
          Claude Code CLI
        </a>{' '}
        and sign in - Commits falls back to it automatically whenever no API key is set.
      </p>

      <div className="flex justify-end">
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
