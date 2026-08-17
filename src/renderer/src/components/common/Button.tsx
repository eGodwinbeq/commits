import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'default' | 'ghost'

export function Button({
  variant = 'default',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }): React.JSX.Element {
  const base = 'rounded px-3 py-1.5 text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed'
  const variants: Record<Variant, string> = {
    primary: 'bg-ide-accent text-white hover:bg-ide-accentDim',
    default: 'bg-ide-hover text-ide-text hover:bg-ide-selected border border-ide-border',
    ghost: 'text-ide-text hover:bg-ide-hover'
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />
}
