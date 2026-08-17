import type { FileStatusEntry } from '@shared/types'

const STATUS_LABEL: Record<FileStatusEntry['status'], string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
  copied: 'C',
  untracked: 'U',
  conflicted: '!'
}

const STATUS_COLOR: Record<FileStatusEntry['status'], string> = {
  modified: 'text-ide-yellow',
  added: 'text-ide-green',
  deleted: 'text-ide-red',
  renamed: 'text-ide-cyan',
  copied: 'text-ide-cyan',
  untracked: 'text-ide-textDim',
  conflicted: 'text-ide-red'
}

interface Props {
  file: FileStatusEntry
  isSelected: boolean
  actionLabel: string
  onSelect: () => void
  onAction: () => void
}

export function FileRow({ file, isSelected, actionLabel, onSelect, onAction }: Props): React.JSX.Element {
  return (
    <div
      className={`group flex cursor-pointer items-center gap-2 px-2 py-1 text-[13px] ${
        isSelected ? 'bg-ide-selected' : 'hover:bg-ide-hover'
      }`}
      onClick={onSelect}
    >
      <span className={`w-4 shrink-0 font-mono font-bold ${STATUS_COLOR[file.status]}`}>
        {STATUS_LABEL[file.status]}
      </span>
      <span className="min-w-0 flex-1 truncate">{file.path}</span>
      <button
        className="hidden shrink-0 rounded border border-ide-border px-1.5 py-0.5 text-[11px] hover:bg-ide-hover group-hover:block"
        onClick={(e) => {
          e.stopPropagation()
          onAction()
        }}
      >
        {actionLabel}
      </button>
    </div>
  )
}
