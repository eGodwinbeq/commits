import { useState } from 'react'
import type { FileStatusEntry } from '@shared/types'
import { useStatusStore } from '../../store/statusStore'
import { useRepoStore } from '../../store/repoStore'
import { useDiffStore } from '../../store/diffStore'
import { FileRow } from './FileRow'
import { CommitMessageBox } from './CommitMessageBox'
import { invalidate } from '../../lib/invalidate'
import { Button } from '../common/Button'

function Group({
  title,
  files,
  staged,
  selectedPath,
  onSelect,
  onAction,
  actionLabel,
  onBulkAction,
  bulkActionLabel
}: {
  title: string
  files: FileStatusEntry[]
  staged: boolean
  selectedPath: string | null
  onSelect: (path: string, staged: boolean) => void
  onAction: (path: string) => void
  actionLabel: string
  onBulkAction: () => void
  bulkActionLabel: string
}): React.JSX.Element | null {
  if (files.length === 0) return null
  return (
    <div className="mb-2">
      <div className="group/header flex items-center px-2 py-1 text-[11px] font-semibold uppercase text-ide-textDim">
        <span>
          {title} ({files.length})
        </span>
        <button
          className="ml-auto hidden rounded border border-ide-border px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-ide-textDim hover:bg-ide-hover hover:text-ide-text group-hover/header:block"
          onClick={onBulkAction}
        >
          {bulkActionLabel}
        </button>
      </div>
      {files.map((f) => (
        <FileRow
          key={f.path}
          file={f}
          isSelected={selectedPath === f.path}
          actionLabel={actionLabel}
          onSelect={() => onSelect(f.path, staged)}
          onAction={() => onAction(f.path)}
        />
      ))}
    </div>
  )
}

export function ChangesPanel(): React.JSX.Element {
  const status = useStatusStore((s) => s.status)
  const repoPath = useRepoStore((s) => s.repoPath)
  const selectWorkingFile = useDiffStore((s) => s.selectWorkingFile)
  const target = useDiffStore((s) => s.target)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  if (!status) return <div className="p-4 text-ide-textDim">Loading changes…</div>

  const handleSelect = (path: string, staged: boolean): void => {
    setSelectedPath(path)
    if (repoPath) selectWorkingFile(repoPath, path, staged)
  }

  const stage = async (path: string): Promise<void> => {
    if (!repoPath) return
    await window.gitApi.stageFile(repoPath, path)
    await invalidate(repoPath, ['status'])
  }

  const unstage = async (path: string): Promise<void> => {
    if (!repoPath) return
    await window.gitApi.unstageFile(repoPath, path)
    await invalidate(repoPath, ['status'])
  }

  const stagePaths = async (paths: string[]): Promise<void> => {
    if (!repoPath || paths.length === 0) return
    await window.gitApi.stagePaths(repoPath, paths)
    await invalidate(repoPath, ['status'])
  }

  const unstagePaths = async (paths: string[]): Promise<void> => {
    if (!repoPath || paths.length === 0) return
    await window.gitApi.unstagePaths(repoPath, paths)
    await invalidate(repoPath, ['status'])
  }

  const unstagedAndUntracked = [...status.unstaged, ...status.untracked].map((f) => f.path)
  const stagedPaths = status.staged.map((f) => f.path)
  const total = status.staged.length + status.unstaged.length + status.untracked.length

  return (
    <div className="flex h-full flex-col">
      {total > 0 && (
        <div className="flex items-center gap-1.5 border-b border-ide-border px-2 py-1.5">
          <Button
            variant="default"
            disabled={unstagedAndUntracked.length === 0}
            onClick={() => stagePaths(unstagedAndUntracked)}
          >
            Stage All
          </Button>
          <Button
            variant="default"
            disabled={stagedPaths.length === 0}
            onClick={() => unstagePaths(stagedPaths)}
          >
            Unstage All
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-auto py-2">
        {total === 0 && <div className="p-4 text-ide-textDim">No changes</div>}
        <Group
          title="Staged"
          files={status.staged}
          staged
          selectedPath={
            target?.type === 'workingFile' && target.staged ? selectedPath : null
          }
          onSelect={handleSelect}
          onAction={unstage}
          actionLabel="Unstage"
          onBulkAction={() => unstagePaths(stagedPaths)}
          bulkActionLabel="Unstage All"
        />
        <Group
          title="Unstaged"
          files={status.unstaged}
          staged={false}
          selectedPath={
            target?.type === 'workingFile' && !target.staged ? selectedPath : null
          }
          onSelect={handleSelect}
          onAction={stage}
          actionLabel="Stage"
          onBulkAction={() => stagePaths(status.unstaged.map((f) => f.path))}
          bulkActionLabel="Stage All"
        />
        <Group
          title="Untracked"
          files={status.untracked}
          staged={false}
          selectedPath={
            target?.type === 'workingFile' && !target.staged ? selectedPath : null
          }
          onSelect={handleSelect}
          onAction={stage}
          actionLabel="Stage"
          onBulkAction={() => stagePaths(status.untracked.map((f) => f.path))}
          bulkActionLabel="Stage All"
        />
      </div>
      <CommitMessageBox />
    </div>
  )
}
