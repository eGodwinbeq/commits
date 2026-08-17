import type { DiffFile } from '@shared/types'

const LINE_STYLE: Record<string, string> = {
  add: 'bg-ide-green/10 text-ide-green',
  del: 'bg-ide-red/10 text-ide-red',
  context: 'text-ide-text',
  'hunk-header': 'text-ide-cyan bg-ide-panelAlt',
  meta: 'text-ide-textDim'
}

export function InlineDiffView({ file }: { file: DiffFile }): React.JSX.Element {
  if (file.isBinary) {
    return <div className="p-4 text-ide-textDim">Binary file changed</div>
  }

  return (
    <div className="overflow-auto font-mono text-[12px] leading-5">
      {file.hunks.map((hunk, hi) => (
        <div key={hi}>
          <div className={`px-2 ${LINE_STYLE['hunk-header']}`}>{hunk.header}</div>
          {hunk.lines.map((line, li) => (
            <div key={li} className={`flex px-2 whitespace-pre ${LINE_STYLE[line.type]}`}>
              <span className="mr-3 inline-block w-8 shrink-0 select-none text-right text-ide-textDim">
                {line.oldLineNo ?? ''}
              </span>
              <span className="mr-3 inline-block w-8 shrink-0 select-none text-right text-ide-textDim">
                {line.newLineNo ?? ''}
              </span>
              <span className="select-none">
                {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
              </span>
              <span>{line.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
