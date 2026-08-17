import { useEffect } from 'react'
import { invalidate } from './invalidate'

const POLL_INTERVAL_MS = 5000

/** Keeps repo state fresh while the app window is focused - catches commits/changes
 * made outside the app (a terminal, another tool) without the user having to hit Refresh. */
export function useAutoRefresh(repoPath: string | null): void {
  useEffect(() => {
    if (!repoPath) return

    const refresh = (): void => {
      if (document.hasFocus()) invalidate(repoPath, ['log', 'branches', 'status'])
    }

    window.addEventListener('focus', refresh)
    const interval = setInterval(refresh, POLL_INTERVAL_MS)

    return () => {
      window.removeEventListener('focus', refresh)
      clearInterval(interval)
    }
  }, [repoPath])
}
