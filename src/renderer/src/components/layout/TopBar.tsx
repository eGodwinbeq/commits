import { useRepoStore } from '../../store/repoStore'
import { useBranchStore, currentBranchName } from '../../store/branchStore'
import { useUiStore } from '../../store/uiStore'
import { Button } from '../common/Button'
import { invalidate } from '../../lib/invalidate'

export function TopBar(): React.JSX.Element {
  const repoName = useRepoStore((s) => s.repoName)
  const repoPath = useRepoStore((s) => s.repoPath)
  const closeRepo = useRepoStore((s) => s.closeRepo)
  const branches = useBranchStore((s) => s.branches)
  const setBranchSwitcherOpen = useUiStore((s) => s.setBranchSwitcherOpen)
  const head = currentBranchName(branches)

  const refresh = async (): Promise<void> => {
    if (repoPath) await invalidate(repoPath, ['log', 'branches', 'status'])
  }

  const fetch = async (): Promise<void> => {
    if (!repoPath) return
    const result = await window.gitApi.fetch(repoPath)
    if (!result.ok) window.alert(result.error.message)
    await refresh()
  }

  const pull = async (): Promise<void> => {
    if (!repoPath || !head) return
    const result = await window.gitApi.pull(repoPath, { remote: 'origin', branch: head })
    if (!result.ok) window.alert(result.error.message)
    await refresh()
  }

  const push = async (): Promise<void> => {
    if (!repoPath || !head) return
    const result = await window.gitApi.push(repoPath, {
      remote: 'origin',
      branch: head,
      setUpstream: true
    })
    if (!result.ok) window.alert(result.error.message)
    await refresh()
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-ide-border bg-ide-panel px-3">
      <span className="text-[13px] font-semibold text-ide-text">{repoName}</span>
      <button
        className="ml-2 rounded border border-ide-border bg-ide-hover px-2 py-1 text-[12px] hover:bg-ide-selected"
        onClick={() => setBranchSwitcherOpen(true)}
      >
        {head ?? 'detached HEAD'}
      </button>
      <div className="ml-auto flex gap-1.5">
        <Button variant="primary" onClick={push}>
          Push
        </Button>
        <Button variant="default" onClick={fetch}>
          Fetch
        </Button>
        <Button variant="default" onClick={pull}>
          Pull
        </Button>
        <Button variant="ghost" onClick={refresh}>
          ⟳ Refresh
        </Button>
        <Button variant="ghost" onClick={closeRepo}>
          Close
        </Button>
      </div>
    </div>
  )
}
