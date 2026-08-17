import { useState } from 'react'
import { useDiffStore } from '../../store/diffStore'
import { InlineDiffView } from './InlineDiffView'

export function DiffViewer(): React.JSX.Element {
  const { target, files, isLoading, error } = useDiffStore()
  const [activeFile, setActiveFile] = useState<string | null>(null)

  if (!target) {
    return (
      <div className="flex h-full items-center justify-center text-ide-textDim">
        Select a commit or a changed file to view its diff
      </div>
    )
  }
  if (isLoading) return <div className="p-4 text-ide-textDim">Loading diff…</div>
  if (error) return <div className="p-4 text-ide-red">{error}</div>
  if (files.length === 0) return <div className="p-4 text-ide-textDim">No changes</div>

  const current = files.find((f) => f.path === activeFile) ?? files[0]

  return (
    <div className="flex h-full">
      {files.length > 1 && (
        <div className="w-56 shrink-0 overflow-auto border-r border-ide-border py-1">
          {files.map((f) => (
            <div
              key={f.path}
              className={`cursor-pointer truncate px-2 py-1 text-[12px] ${
                current.path === f.path ? 'bg-ide-selected' : 'hover:bg-ide-hover'
              }`}
              onClick={() => setActiveFile(f.path)}
            >
              {f.path}
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 border-b border-ide-border bg-ide-panelAlt px-2 py-1 text-[12px] text-ide-textDim">
          {current.path}
        </div>
        <InlineDiffView file={current} />
      </div>
    </div>
  )
}
