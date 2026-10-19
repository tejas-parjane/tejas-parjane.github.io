import type { ReactNode } from 'react'
import { Container } from '@/components/layout/Container'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className="border-b border-line">
      <Container className="py-16 sm:py-20">
        <p className="section-label flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-lime" />
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </header>
  )
}
