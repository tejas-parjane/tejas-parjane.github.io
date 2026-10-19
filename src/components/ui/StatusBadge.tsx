import type { ProjectStatus } from '@/data/projects'
import { statusLabels } from '@/data/projects'
import { cn } from '@/lib/cn'

const dotStyles: Record<ProjectStatus, string> = {
  implemented: 'bg-lime',
  'in-development': 'bg-amber-500',
  planned: 'bg-muted',
}

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-[0.625rem] font-medium uppercase tracking-[0.12em] text-ink',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', dotStyles[status])} />
      {statusLabels[status]}
    </span>
  )
}
