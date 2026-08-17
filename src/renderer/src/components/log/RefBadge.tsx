import type { CommitRef } from '@shared/types'

const STYLES: Record<CommitRef['type'], string> = {
  head: 'bg-ide-accent text-white',
  'local-branch': 'bg-ide-green/20 text-ide-green border border-ide-green/40',
  'remote-branch': 'bg-ide-purple/20 text-ide-purple border border-ide-purple/40',
  tag: 'bg-ide-yellow/20 text-ide-yellow border border-ide-yellow/40'
}

export function RefBadge({ ref }: { ref: CommitRef }): React.JSX.Element {
  return (
    <span className={`mr-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${STYLES[ref.type]}`}>
      {ref.name}
    </span>
  )
}
