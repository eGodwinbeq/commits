import type { ButtonHTMLAttributes } from 'react'
import { IconSpinner } from './icons'

type Variant = 'primary' | 'default' | 'ghost'

export function Button({
  variant = 'default',
  className = '',
  loading = false,
  disabled,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }): React.JSX.Element {
  const base =
    'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed'
  const variants: Record<Variant, string> = {
    primary: 'bg-ide-accent text-white hover:bg-ide-accentDim',
    default: 'bg-ide-hover text-ide-text hover:bg-ide-selected border border-ide-border',
    ghost: 'text-ide-text hover:bg-ide-hover'
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <IconSpinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}
