type IconProps = { className?: string }

export function IconChanges({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconLog({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth={1.7} />
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth={1.7} />
      <path d="M6 8v8" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
      <path d="M10 6h8M10 18h8" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  )
}

export function IconBranch({ className = 'h-3.5 w-3.5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth={1.7} />
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth={1.7} />
      <circle cx="18" cy="9" r="2" stroke="currentColor" strokeWidth={1.7} />
      <path d="M6 8v8" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
      <path d="M6 12c0-3 3-4.5 8.5-4.7" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  )
}

export function IconRemote({ className = 'h-3.5 w-3.5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 18a4 4 0 0 1-.6-7.96A5 5 0 0 1 16 8.05 4.5 4.5 0 0 1 15.5 17H7Z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconTag({ className = 'h-3.5 w-3.5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="m4 10 6.5-6.5H18a1 1 0 0 1 1 1v7.5L12.5 19a1 1 0 0 1-1.4 0L4 12.4a1 1 0 0 1 0-1.4Z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <circle cx="14.5" cy="8.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function IconChevron({ className = 'h-3 w-3', open }: IconProps & { open: boolean }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
    >
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
