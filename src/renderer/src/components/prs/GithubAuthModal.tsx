import { useEffect, useRef, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

type Status = 'starting' | 'waiting' | 'success' | 'error'

export function GithubAuthModal({
  onClose,
  onSuccess
}: {
  onClose: () => void
  onSuccess: () => void
}): React.JSX.Element {
  const [code, setCode] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('starting')
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const statusRef = useRef<Status>('starting')
  statusRef.current = status

  useEffect(() => {
    const unsubscribe = window.gitApi.onGithubAuthEvent((event) => {
      if (event.type === 'code') {
        setCode(event.code ?? null)
        setUrl(event.url ?? null)
        setStatus('waiting')
      } else if (event.type === 'done') {
        setStatus(event.ok ? 'success' : 'error')
        setMessage(event.message ?? null)
        if (event.ok) onSuccess()
      } else if (event.type === 'error') {
        setStatus('error')
        setMessage(event.message ?? null)
      }
    })
    window.gitApi.startGithubDeviceAuth()
    return () => {
      unsubscribe()
      if (statusRef.current === 'starting' || statusRef.current === 'waiting') {
        window.gitApi.cancelGithubDeviceAuth()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyCode = (): void => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-3 text-[15px] font-semibold text-ide-text">Sign in to GitHub</h2>

      {status === 'starting' && (
        <div className="text-[12px] text-ide-textDim">Starting sign-in…</div>
      )}

      {(status === 'waiting' || status === 'success') && code && (
        <>
          <p className="mb-2 text-[12px] text-ide-textDim">
            We opened github.com/login/device in your browser. Enter this code there to
            continue:
          </p>
          <div className="mb-3 flex items-center justify-between rounded border border-ide-border bg-ide-bg px-3 py-2">
            <span className="font-mono text-[18px] tracking-widest text-ide-text">{code}</span>
            <button className="text-[12px] text-ide-accent hover:underline" onClick={copyCode}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {url && status === 'waiting' && (
            <Button
              variant="default"
              className="mb-3"
              onClick={() => window.open(url, '_blank')}
            >
              Open github.com/login/device again
            </Button>
          )}
        </>
      )}

      {status === 'waiting' && (
        <div className="mb-3 flex items-center gap-2 text-[12px] text-ide-textDim">
          <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-ide-textDim border-t-transparent" />
          Waiting for you to authorize in the browser…
        </div>
      )}

      {status === 'success' && (
        <div className="mb-3 text-[13px] text-ide-green">Signed in to GitHub successfully.</div>
      )}

      {status === 'error' && (
        <div className="mb-3 text-[12px] text-ide-red">{message ?? 'Sign-in failed.'}</div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="default" onClick={onClose}>
          {status === 'success' ? 'Close' : 'Cancel'}
        </Button>
      </div>
    </Modal>
  )
}
