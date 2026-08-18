import { useState } from 'react'
import { useRepoStore } from '../../store/repoStore'
import { useBranchStore, currentBranchName } from '../../store/branchStore'
import { useUiStore } from '../../store/uiStore'
import { useTaskStore } from '../../store/taskStore'
import { Button } from '../common/Button'
import { ThemeToggle } from '../common/ThemeToggle'
import { IconGear } from '../common/icons'
import { invalidate } from '../../lib/invalidate'
import { SettingsModal } from './SettingsModal'

type BusyAction = 'push' | 'fetch' | 'pull' | 'refresh' | null

export function TopBar(): React.JSX.Element {
  const repoName = useRepoStore((s) => s.repoName)
  const repoPath = useRepoStore((s) => s.repoPath)
  const closeRepo = useRepoStore((s) => s.closeRepo)
  const branches = useBranchStore((s) => s.branches)
  const setBranchSwitcherOpen = useUiStore((s) => s.setBranchSwitcherOpen)
  const setActiveTask = useTaskStore((s) => s.setActiveTask)
  const head = currentBranchName(branches)
  const [busy, setBusy] = useState<BusyAction>(null)
  const [showSettings, setShowSettings] = useState(false)

  const run = async (action: BusyAction, label: string, fn: () => Promise<void>): Promise<void> => {
    setBusy(action)
    setActiveTask(label)
    try {
      await fn()
    } finally {
      setBusy(null)
      setActiveTask(null)
    }
  }

  const refresh = (): Promise<void> =>
    run('refresh', 'Refreshing…', async () => {
      if (repoPath) await invalidate(repoPath, ['log', 'branches', 'status'])
    })

  const fetch = (): Promise<void> =>
    run('fetch', 'Fetching…', async () => {
      if (!repoPath) return
      const result = await window.gitApi.fetch(repoPath)
      if (!result.ok) window.alert(result.error.message)
      if (repoPath) await invalidate(repoPath, ['log', 'branches', 'status'])
    })

  const pull = (): Promise<void> =>
    run('pull', 'Pulling…', async () => {
      if (!repoPath || !head) return
      const result = await window.gitApi.pull(repoPath, { remote: 'origin', branch: head })
      if (!result.ok) window.alert(result.error.message)
      await invalidate(repoPath, ['log', 'branches', 'status'])
    })

  const push = (): Promise<void> =>
    run('push', 'Pushing…', async () => {
      if (!repoPath || !head) return
      const result = await window.gitApi.push(repoPath, {
        remote: 'origin',
        branch: head,
        setUpstream: true
      })
      if (!result.ok) window.alert(result.error.message)
      await invalidate(repoPath, ['log', 'branches', 'status'])
    })

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 bg-ide-panel px-3">
      <span className="text-[13px] font-semibold text-ide-text">{repoName}</span>
      <button
        className="ml-2 rounded border border-ide-border bg-ide-hover px-2 py-1 text-[12px] hover:bg-ide-selected"
        onClick={() => setBranchSwitcherOpen(true)}
      >
        {head ?? 'detached HEAD'}
      </button>
      <div className="ml-auto flex gap-1.5">
        <Button variant="primary" loading={busy === 'push'} disabled={busy !== null} onClick={push}>
          Push
        </Button>
        <Button variant="default" loading={busy === 'fetch'} disabled={busy !== null} onClick={fetch}>
          Fetch
        </Button>
        <Button variant="default" loading={busy === 'pull'} disabled={busy !== null} onClick={pull}>
          Pull
        </Button>
        <Button variant="ghost" loading={busy === 'refresh'} disabled={busy !== null} onClick={refresh}>
          {busy !== 'refresh' && '⟳ '}Refresh
        </Button>
        <Button variant="ghost" onClick={closeRepo}>
          Close
        </Button>
        <button
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ide-textDim hover:bg-ide-hover hover:text-ide-text"
          title="Settings"
          onClick={() => setShowSettings(true)}
        >
          <IconGear className="h-4 w-4" />
        </button>
        <ThemeToggle />
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
