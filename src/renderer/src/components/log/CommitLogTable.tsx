import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useLogStore } from '../../store/logStore'
import { useRepoStore } from '../../store/repoStore'
import { useDiffStore } from '../../store/diffStore'
import { CommitRow } from './CommitRow'
import { LogFilterBar } from './LogFilterBar'
import { ROW_HEIGHT } from './CommitGraphColumn'

export function CommitLogTable(): React.JSX.Element {
  const { commits, graphRows, isLoading, error } = useLogStore()
  const repoPath = useRepoStore((s) => s.repoPath)
  const selectCommit = useDiffStore((s) => s.selectCommit)
  const target = useDiffStore((s) => s.target)
  const [selectedSha, setSelectedSha] = useState<string | null>(null)

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: graphRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20
  })

  const filtered = commits.length > 0 && graphRows.length === 0

  return (
    <div className="flex h-full flex-col">
      <LogFilterBar />
      {isLoading && graphRows.length === 0 && !filtered && (
        <div className="p-4 text-ide-textDim">Loading commit history…</div>
      )}
      {error && <div className="p-4 text-ide-red">{error}</div>}
      {!isLoading && !error && commits.length === 0 && (
        <div className="p-4 text-ide-textDim">No commits yet.</div>
      )}
      {!error && filtered && (
        <div className="p-4 text-ide-textDim">No commits match the current filters.</div>
      )}
      {!error && graphRows.length > 0 && (
        <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const row = graphRows[vi.index]
              return (
                <div
                  key={row.commit.sha}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vi.start}px)`
                  }}
                >
                  <CommitRow
                    row={row}
                    prevRow={graphRows[vi.index - 1]}
                    nextRow={graphRows[vi.index + 1]}
                    isSelected={
                      selectedSha === row.commit.sha ||
                      (target?.type === 'commit' && target.sha === row.commit.sha)
                    }
                    onClick={() => {
                      setSelectedSha(row.commit.sha)
                      if (repoPath) selectCommit(repoPath, row.commit.sha)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
