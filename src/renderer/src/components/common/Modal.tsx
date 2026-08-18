import type { ReactNode } from 'react'

export function Modal({
  children,
  onClose
}: {
  children: ReactNode
  onClose?: () => void
}): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[440px] rounded-lg border border-ide-border bg-ide-panel p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
