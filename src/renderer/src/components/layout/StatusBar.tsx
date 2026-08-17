import { useStatusStore } from '../../store/statusStore'

export function StatusBar(): React.JSX.Element {
  const status = useStatusStore((s) => s.status)

  return (
    <div className="flex h-7 shrink-0 items-center gap-3 bg-ide-panel px-3 text-[11px] text-ide-textDim">
      <span>{status?.branch ?? ''}</span>
      {status && (status.ahead > 0 || status.behind > 0) && (
        <span>
          {status.ahead > 0 && <span className="text-ide-green">↑{status.ahead} </span>}
          {status.behind > 0 && <span className="text-ide-red">↓{status.behind}</span>}
        </span>
      )}
    </div>
  )
}
