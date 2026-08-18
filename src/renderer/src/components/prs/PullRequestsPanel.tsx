import { useEffect, useState } from 'react'
import type { PrStateFilter } from '@shared/types'
import { useRepoStore } from '../../store/repoStore'
import { usePrStore } from '../../store/prStore'
import { Button } from '../common/Button'
import { IconRefresh } from '../common/icons'
import { PrListRow } from './PrListRow'
import { PrDetailPanel } from './PrDetailPanel'
import { CreatePrModal } from './CreatePrModal'
import { GithubAuthModal } from './GithubAuthModal'

const FILTERS: { key: PrStateFilter; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'merged', label: 'Merged' },
  { key: 'all', label: 'All' }
]

export function PullRequestsPanel(): React.JSX.Element {
  const repoPath = useRepoStore((s) => s.repoPath)
  const { pullRequests, isLoading, error, errorCode, stateFilter, selected } = usePrStore()
  const load = usePrStore((s) => s.load)
  const setStateFilter = usePrStore((s) => s.setStateFilter)
  const select = usePrStore((s) => s.select)
  const clearSelection = usePrStore((s) => s.clearSelection)
  const [showCreate, setShowCreate] = useState(false)
  const [showGithubAuth, setShowGithubAuth] = useState(false)

  useEffect(() => {
    if (repoPath) load(repoPath)
    return () => clearSelection()
  }, [repoPath])

  return (
    <div className="flex h-full">
      <div className="flex w-80 shrink-0 flex-col border-r border-ide-border">
        <div className="flex shrink-0 items-center gap-1 border-b border-ide-border px-2 py-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`rounded px-2 py-1 text-[12px] font-medium ${
                stateFilter === f.key
                  ? 'bg-ide-accent/15 text-ide-accent'
                  : 'text-ide-textDim hover:bg-ide-hover hover:text-ide-text'
              }`}
              onClick={() => repoPath && setStateFilter(repoPath, f.key)}
            >
              {f.label}
            </button>
          ))}
          <button
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-ide-textDim hover:bg-ide-hover hover:text-ide-text disabled:opacity-40"
            title="Refresh"
            disabled={!repoPath || isLoading}
            onClick={() => repoPath && load(repoPath)}
          >
            <IconRefresh className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button variant="primary" onClick={() => setShowCreate(true)} disabled={!repoPath}>
            New
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading && pullRequests.length === 0 && (
            <div className="p-4 text-[12px] text-ide-textDim">Loading pull requests…</div>
          )}
          {error && (
            <div className="p-3 text-[12px] text-ide-red">
              <div className="flex items-start justify-between gap-2">
                <span>{error}</span>
                <button
                  className="shrink-0 text-ide-accent hover:underline"
                  onClick={() => repoPath && load(repoPath)}
                >
                  Retry
                </button>
              </div>
              {errorCode === 'GH_NOT_FOUND' && (
                <div className="mt-1 text-ide-textDim">
                  Install the GitHub CLI from{' '}
                  <a
                    className="text-ide-accent hover:underline"
                    onClick={(e) => {
                      e.preventDefault()
                      window.open('https://cli.github.com', '_blank')
                    }}
                    href="https://cli.github.com"
                  >
                    cli.github.com
                  </a>
                  .
                </div>
              )}
              {errorCode === 'GH_NOT_AUTHENTICATED' && (
                <div className="mt-2">
                  <Button variant="default" onClick={() => setShowGithubAuth(true)}>
                    Sign in to GitHub
                  </Button>
                </div>
              )}
            </div>
          )}
          {!isLoading && !error && pullRequests.length === 0 && (
            <div className="p-4 text-[12px] text-ide-textDim">
              No {stateFilter === 'all' ? '' : stateFilter} pull requests.
            </div>
          )}
          {pullRequests.map((pr) => (
            <PrListRow
              key={pr.number}
              pr={pr}
              isSelected={selected?.number === pr.number}
              onClick={() => repoPath && select(repoPath, pr)}
            />
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <PrDetailPanel />
      </div>

      {showCreate && <CreatePrModal onClose={() => setShowCreate(false)} />}
      {showGithubAuth && (
        <GithubAuthModal
          onClose={() => setShowGithubAuth(false)}
          onSuccess={() => repoPath && load(repoPath)}
        />
      )}
    </div>
  )
}
