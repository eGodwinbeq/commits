import { useEffect, useState } from 'react'
import { useAiStore } from '../../store/aiStore'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

export function SettingsModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const status = useAiStore((s) => s.status)
  const isLoading = useAiStore((s) => s.isLoading)
  const statusError = useAiStore((s) => s.error)
  const refresh = useAiStore((s) => s.refresh)
  const saveApiKey = useAiStore((s) => s.saveApiKey)
  const removeApiKey = useAiStore((s) => s.removeApiKey)
  const isTestingCli = useAiStore((s) => s.isTestingCli)
  const cliTestResult = useAiStore((s) => s.cliTestResult)
  const testClaudeCli = useAiStore((s) => s.testClaudeCli)
  const launchClaudeSignIn = useAiStore((s) => s.launchClaudeSignIn)

  const [key, setKey] = useState('')
  const [keyError, setKeyError] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [signInMessage, setSignInMessage] = useState<string | null>(null)

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSaveKey = async (): Promise<void> => {
    if (!key.trim()) return
    setSavingKey(true)
    setKeyError(null)
    const result = await saveApiKey(key.trim())
    setSavingKey(false)
    if (!result.ok) {
      setKeyError(result.message)
      return
    }
    setKey('')
  }

  const onSignIn = async (): Promise<void> => {
    setSignInMessage(null)
    const result = await launchClaudeSignIn()
    setSignInMessage(
      result.ok
        ? 'Opened Claude Code in a terminal - finish signing in there, then click "Test Connection".'
        : result.message
    )
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

      {statusError && !isLoading && (
        <div className="mb-3 rounded border border-ide-red/40 bg-ide-red/10 p-2.5 text-[12px] text-ide-red">
          <div className="flex items-start justify-between gap-2">
            <span>Couldn&apos;t check AI connection status: {statusError}</span>
            <button className="shrink-0 text-ide-accent hover:underline" onClick={() => refresh()}>
              Retry
            </button>
          </div>
        </div>
      )}

      {status && (
        <div className="mb-3 rounded border border-ide-border p-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${status.cliAvailable ? 'bg-ide-green' : 'bg-ide-textDim'}`}
            />
            <span className="text-[13px] font-medium text-ide-text">Claude Code</span>
            <span className="text-[11px] text-ide-textDim">
              {status.cliAvailable ? `Detected (${status.cliVersion ?? 'unknown version'})` : 'Not detected'}
            </span>
          </div>

          {status.cliAvailable ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="default" loading={isTestingCli} onClick={testClaudeCli}>
                Test Connection
              </Button>
              <Button variant="ghost" onClick={onSignIn}>
                Open Claude Code to Sign In
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="default" onClick={() => refresh()}>
                Check Again
              </Button>
              <a
                className="text-[12px] text-ide-accent hover:underline"
                href="https://claude.com/product/claude-code"
                onClick={(e) => {
                  e.preventDefault()
                  window.open('https://claude.com/product/claude-code', '_blank')
                }}
              >
                Install Claude Code ↗
              </a>
            </div>
          )}

          {cliTestResult && (
            <div className={`mt-2 text-[12px] ${cliTestResult.ok ? 'text-ide-green' : 'text-ide-red'}`}>
              {cliTestResult.message}
            </div>
          )}
          {signInMessage && <div className="mt-2 text-[12px] text-ide-textDim">{signInMessage}</div>}
        </div>
      )}

      {!showApiKey ? (
        <button
          className="mb-1 text-[12px] text-ide-accent hover:underline"
          onClick={() => setShowApiKey(true)}
        >
          Or connect with an API key instead
        </button>
      ) : (
        <div className="rounded border border-ide-border p-2.5">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${status?.hasApiKey ? 'bg-ide-green' : 'bg-ide-textDim'}`}
            />
            <span className="text-[13px] font-medium text-ide-text">Anthropic API Key</span>
            <span className="text-[11px] text-ide-textDim">
              {status?.hasApiKey ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <p className="mb-2 text-[12px] text-ide-textDim">
            The key is encrypted with your OS keychain and stored only on this device - it&apos;s
            sent directly to Anthropic&apos;s API and nowhere else. Used automatically instead of
            Claude Code whenever it&apos;s set.
          </p>
          <div className="mb-1.5 flex gap-2">
            <input
              type="password"
              autoFocus
              className="min-w-0 flex-1 rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-[13px] text-ide-text outline-none"
              placeholder="sk-ant-…"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveKey()
              }}
            />
            <Button variant="primary" loading={savingKey} disabled={!key.trim()} onClick={onSaveKey}>
              Save
            </Button>
          </div>
          {status?.hasApiKey && (
            <button className="text-[12px] text-ide-red hover:underline" onClick={removeApiKey}>
              Remove saved key
            </button>
          )}
          {keyError && <div className="mt-1.5 text-[12px] text-ide-red">{keyError}</div>}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
