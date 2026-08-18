import { useEffect, useState } from 'react'
import { useRepoStore } from '../../store/repoStore'
import { Button } from '../common/Button'
import { ThemeToggle } from '../common/ThemeToggle'
import { UnsafeRepoModal } from './UnsafeRepoModal'

function RecentRepoRow({ path, onClick }: { path: string; onClick: () => void }): React.JSX.Element {
  const [count, setCount] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    window.gitApi.getCommitCount(path).then((result) => {
      if (cancelled) return
      if (result.ok) setCount(result.data)
      else setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  return (
    <button
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-ide-hover"
      onClick={onClick}
    >
      <span className="min-w-0 flex-1 truncate">{path}</span>
      {!failed && (
        <span className="shrink-0 whitespace-nowrap rounded-full bg-ide-hover px-1.5 py-0.5 text-[10px] font-medium text-ide-textDim">
          {count === null ? '…' : `${count.toLocaleString()} of your commit${count === 1 ? '' : 's'}`}
        </span>
      )}
    </button>
  )
}

export function WelcomeScreen(): React.JSX.Element {
  const { openFolderDialog, openRepo, recentRepos, error, isLoading } = useRepoStore()

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4">
      <UnsafeRepoModal />
      <div className="absolute right-3 top-3">
        <ThemeToggle />
      </div>
      <img src="./icon.png" alt="" className="h-16 w-16 rounded-2xl" />
      <h1 className="text-xl font-semibold text-ide-text">Commits</h1>
      <Button variant="primary" disabled={isLoading} onClick={openFolderDialog}>
        Open Repository…
      </Button>
      {error && <div className="text-ide-red">{error}</div>}
      {recentRepos.length > 0 && (
        <div className="w-96">
          <div className="mb-1 text-[11px] uppercase text-ide-textDim">Recent</div>
          <div className="rounded border border-ide-border">
            {recentRepos.map((path) => (
              <RecentRepoRow key={path} path={path} onClick={() => openRepo(path)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
