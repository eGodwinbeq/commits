import type { Branch } from '@shared/types'
import { ContextMenu, type ContextMenuItem } from '../common/ContextMenu'
import { useRepoStore } from '../../store/repoStore'
import { invalidate } from '../../lib/invalidate'

interface Props {
  x: number
  y: number
  branch: Branch
  currentBranchName: string | null
  onClose: () => void
}

export function BranchContextMenu({
  x,
  y,
  branch,
  currentBranchName,
  onClose
}: Props): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)

  const run = async (action: () => Promise<{ ok: boolean; error?: { message: string } }>) => {
    if (!repoPath) return
    const result = await action()
    if (!result.ok && result.error) {
      window.alert(result.error.message)
    }
    await invalidate(repoPath, ['log', 'branches', 'status'])
  }

  const items: ContextMenuItem[] = []

  if (branch.kind === 'local' || branch.kind === 'remote') {
    items.push({
      label: 'Checkout',
      disabled: branch.isHead,
      onClick: () => run(() => window.gitApi.checkout(repoPath!, branch.name, branch.kind))
    })
  }

  items.push({
    label: 'New Branch From Here…',
    onClick: async () => {
      const name = window.prompt(`New branch from ${branch.name}:`)
      if (!name) return
      run(() => window.gitApi.createBranch(repoPath!, name, branch.name, true))
    },
    separatorAfter: true
  })

  if (branch.kind === 'local' && !branch.isHead && currentBranchName) {
    items.push({
      label: `Merge into ${currentBranchName}`,
      onClick: () => run(() => window.gitApi.merge(repoPath!, branch.name))
    })
    items.push({
      label: `Rebase ${currentBranchName} onto ${branch.name}`,
      onClick: () => run(() => window.gitApi.rebase(repoPath!, branch.name))
    })
  }

  if (branch.kind === 'remote' && currentBranchName) {
    items.push({
      label: `Pull Into ${currentBranchName} (Merge)`,
      onClick: () => run(() => window.gitApi.merge(repoPath!, branch.name)),
      separatorAfter: true
    })
  }

  if (branch.kind === 'local') {
    items.push({
      label: 'Rename…',
      onClick: async () => {
        const name = window.prompt('New name:', branch.name)
        if (!name || name === branch.name) return
        run(() => window.gitApi.renameBranch(repoPath!, branch.name, name))
      },
      separatorAfter: true
    })
    items.push({
      label: 'Push',
      onClick: () =>
        run(() =>
          window.gitApi.push(repoPath!, { remote: 'origin', branch: branch.name, setUpstream: true })
        )
    })
    items.push({
      label: 'Delete',
      danger: true,
      disabled: branch.isHead,
      onClick: () => {
        if (!window.confirm(`Delete branch "${branch.name}"?`)) return
        run(() => window.gitApi.deleteBranch(repoPath!, branch.name))
      }
    })
  }

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />
}
