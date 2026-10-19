import { cn } from '@/lib/cn'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  className?: string
  id?: string
  as?: 'h2' | 'h3'
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  id,
  as: Tag = 'h2',
}: SectionHeadingProps) {
  return (
    <header className={cn('mb-10 max-w-3xl', className)}>
      <p className="section-label flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-8 bg-lime" />
        {eyebrow}
      </p>
      <Tag
        id={id}
        className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
      >
        {title}
      </Tag>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{description}</p>
      ) : null}
    </header>
  )
}
