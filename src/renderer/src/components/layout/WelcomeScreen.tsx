import { useRepoStore } from '../../store/repoStore'
import { Button } from '../common/Button'

export function WelcomeScreen(): React.JSX.Element {
  const { openFolderDialog, openRepo, recentRepos, error, isLoading } = useRepoStore()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
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
              <button
                key={path}
                className="block w-full truncate px-3 py-2 text-left text-[13px] hover:bg-ide-hover"
                onClick={() => openRepo(path)}
              >
                {path}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
