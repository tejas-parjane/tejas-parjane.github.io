import { CheckCircle2, CircleDashed, Hammer } from 'lucide-react'
import type { ProjectCaseStudy } from '@/case-studies/types'

const columns = [
  { key: 'implemented', label: 'Implemented', Icon: CheckCircle2, dot: 'bg-lime' },
  { key: 'inDevelopment', label: 'In development', Icon: Hammer, dot: 'bg-amber-500' },
  { key: 'planned', label: 'Planned', Icon: CircleDashed, dot: 'bg-muted' },
] as const

export function ImplementationStatus({
  implementation,
}: {
  implementation: ProjectCaseStudy['implementation']
}) {
  const visible = columns.filter((column) => implementation[column.key].length > 0)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {visible.map((column) => (
        <div key={column.key} className="surface-card p-5">
          <p className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${column.dot}`} />
            {column.label}
          </p>
          <ul className="mt-3 space-y-2">
            {implementation[column.key].map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted">
                <column.Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
