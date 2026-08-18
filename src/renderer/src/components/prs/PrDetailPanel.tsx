import { useState } from 'react'
import { usePrStore } from '../../store/prStore'
import { InlineDiffView } from '../diff/InlineDiffView'
import { PrStateBadge } from './PrStateBadge'
import { PrMergeControls } from './PrMergeControls'
import { formatRelativeDate } from '../../lib/formatters'

export function PrDetailPanel(): React.JSX.Element {
  const pr = usePrStore((s) => s.selected)
  const diffFiles = usePrStore((s) => s.diffFiles)
  const isDiffLoading = usePrStore((s) => s.isDiffLoading)
  const diffError = usePrStore((s) => s.diffError)
  const [activeFile, setActiveFile] = useState<string | null>(null)

  if (!pr) {
    return (
      <div className="flex h-full items-center justify-center text-ide-textDim">
        Select a pull request to view it
      </div>
    )
  }

  const current = diffFiles.find((f) => f.path === activeFile) ?? diffFiles[0]

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-ide-border px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <PrStateBadge pr={pr} />
          <span className="text-[11px] text-ide-textDim">
            #{pr.number} opened by {pr.author} · updated {formatRelativeDate(pr.updatedAt)}
          </span>
        </div>
        <h2 className="mb-1 text-[15px] font-semibold text-ide-text">{pr.title}</h2>
        <div className="mb-2 font-mono text-[12px] text-ide-textDim">
          {pr.headRefName} → {pr.baseRefName} · +{pr.additions} -{pr.deletions} ·{' '}
          {pr.changedFiles} file{pr.changedFiles === 1 ? '' : 's'}
        </div>
        {pr.body && (
          <div className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-ide-bg p-2 text-[12px] text-ide-text">
            {pr.body}
          </div>
        )}
        <a
          href={pr.url}
          onClick={(e) => {
            e.preventDefault()
            window.open(pr.url, '_blank')
          }}
          className="mt-2 inline-block text-[12px] text-ide-accent hover:underline"
        >
          Open on GitHub ↗
        </a>
      </div>

      <PrMergeControls pr={pr} />

      <div className="min-h-0 flex-1 overflow-hidden">
        {isDiffLoading && <div className="p-4 text-ide-textDim">Loading diff…</div>}
        {diffError && <div className="p-4 text-ide-red">{diffError}</div>}
        {!isDiffLoading && !diffError && diffFiles.length === 0 && (
          <div className="p-4 text-ide-textDim">No changes</div>
        )}
        {!isDiffLoading && !diffError && diffFiles.length > 0 && current && (
          <div className="flex h-full">
            {diffFiles.length > 1 && (
              <div className="w-56 shrink-0 overflow-auto border-r border-ide-border py-1">
                {diffFiles.map((f) => (
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
        )}
      </div>
    </div>
  )
}
