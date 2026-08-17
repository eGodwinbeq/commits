import { useEffect, useRef } from 'react'

interface Props {
  onResize: (deltaX: number) => void
}

/** A draggable vertical splitter between two panels, VSCode/PhpStorm-style. */
export function ResizeHandle({ onResize }: Props): React.JSX.Element {
  const dragging = useRef(false)
  const lastX = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      if (!dragging.current) return
      const delta = e.clientX - lastX.current
      lastX.current = e.clientX
      onResize(delta)
    }
    const onUp = (): void => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [onResize])

  const onMouseDown = (e: React.MouseEvent): void => {
    dragging.current = true
    lastX.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div className="group relative z-10 w-2 shrink-0 cursor-col-resize" onMouseDown={onMouseDown}>
      <div className="mx-auto h-full w-px bg-ide-border transition-colors group-hover:bg-ide-accent group-active:bg-ide-accent" />
    </div>
  )
}
