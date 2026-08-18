type IconProps = { className?: string }

export function IconSpinner({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2.5} opacity={0.25} />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconSun({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={1.7} />
      <path
        d="M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6 19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4 19 5"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconMoon({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </svg>
  )
}

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

export function IconActivity({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="12" width="4" height="8" rx="1" stroke="currentColor" strokeWidth={1.7} />
      <rect x="10" y="7" width="4" height="13" rx="1" stroke="currentColor" strokeWidth={1.7} />
      <rect x="17" y="4" width="4" height="16" rx="1" stroke="currentColor" strokeWidth={1.7} />
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

export function IconSearch({ className = 'h-3.5 w-3.5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth={1.7} />
      <path d="m20 20-4.35-4.35" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  )
}

export function IconClose({ className = 'h-3.5 w-3.5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  )
}

export function IconPullRequest({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth={1.7} />
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth={1.7} />
      <circle cx="18" cy="9" r="2" stroke="currentColor" strokeWidth={1.7} />
      <path d="M6 8v8" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
      <path
        d="M18 11v3a3 3 0 0 1-3 3h-3.5"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <path d="m14 14 2.5 3-2.5 3" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconRefresh({ className = 'h-3.5 w-3.5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 12a8 8 0 0 1 13.66-5.66M20 12a8 8 0 0 1-13.66 5.66"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <path
        d="M17 3v4h-4M7 21v-4h4"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconGear({ className = 'h-4 w-4' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  )
}

export function IconSparkle({ className = 'h-3.5 w-3.5' }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5 13.7 9l5.3 1.7-5.3 1.8L12 18l-1.7-5.5L5 10.7 10.3 9 12 3.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity={0.15}
      />
      <path d="M19 4.5v3M17.5 6h3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
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
