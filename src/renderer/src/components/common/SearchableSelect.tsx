import { useEffect, useMemo, useRef, useState } from 'react'

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  emptyLabel = 'No options',
  disabled,
  className = ''
}: {
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  emptyLabel?: string
  disabled?: boolean
  className?: string
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    )
  }, [options, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const select = (v: string): void => {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        className="flex w-full items-center gap-1.5 rounded border border-ide-border bg-ide-bg px-2 py-1.5 text-left text-[12px] text-ide-text outline-none disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? '' : 'text-ide-textDim'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="shrink-0 text-ide-textDim">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] rounded border border-ide-border bg-ide-panel shadow-xl">
            <input
              ref={inputRef}
              className="w-full border-b border-ide-border bg-transparent px-2 py-1.5 text-[12px] text-ide-text outline-none placeholder:text-ide-textDim"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false)
                if (e.key === 'Enter' && filtered.length > 0) select(filtered[0].value)
              }}
            />
            <div className="max-h-56 overflow-auto py-1">
              {filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  className={`flex w-full flex-col items-start px-2 py-1.5 text-left text-[12px] hover:bg-ide-hover ${
                    o.value === value ? 'bg-ide-selected' : ''
                  }`}
                  onClick={() => select(o.value)}
                >
                  <span className="truncate text-ide-text">{o.label}</span>
                  {o.description && (
                    <span className="truncate text-[11px] text-ide-textDim">{o.description}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-2 py-3 text-center text-[12px] text-ide-textDim">
                  {emptyLabel}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
