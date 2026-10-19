import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonLinkProps {
  children: ReactNode
  to?: string
  href?: string
  variant?: ButtonVariant
  className?: string
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-lime text-lime-ink hover:brightness-95',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-ink',
  ghost: 'text-ink hover:bg-surface-2',
}

export function ButtonLink({
  children,
  to,
  href,
  variant = 'primary',
  className,
}: ButtonLinkProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
    variants[variant],
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  const external = Boolean(href && /^https?:\/\//.test(href))
  return (
    <a
      href={href}
      className={classes}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  )
}
