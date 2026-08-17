import { useState } from 'react'
import type { FileStatusEntry } from '@shared/types'
import { useStatusStore } from '../../store/statusStore'
import { useRepoStore } from '../../store/repoStore'
import { useDiffStore } from '../../store/diffStore'
import { FileRow } from './FileRow'
import { CommitMessageBox } from './CommitMessageBox'
import { invalidate } from '../../lib/invalidate'

function Group({
  title,
  files,
  staged,
  selectedPath,
  onSelect,
  onAction,
  actionLabel
}: {
  title: string
  files: FileStatusEntry[]
  staged: boolean
  selectedPath: string | null
  onSelect: (path: string, staged: boolean) => void
  onAction: (path: string) => void
  actionLabel: string
}): React.JSX.Element | null {
  if (files.length === 0) return null
  return (
    <div className="mb-2">
      <div className="px-2 py-1 text-[11px] font-semibold uppercase text-ide-textDim">
        {title} ({files.length})
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

  const total = status.staged.length + status.unstaged.length + status.untracked.length

  return (
    <div className="flex h-full flex-col">
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
        />
      </div>
      <CommitMessageBox />
    </div>
  )
}
