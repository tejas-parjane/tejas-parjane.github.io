import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import type { EvidenceItem } from '@/cognitive-os/types'

export function EvidencePanel({
  item,
  inspected,
  onToggle,
  children,
}: {
  item: EvidenceItem
  inspected: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const panelId = `evidence-${item.id}`
  return (
    <article className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{item.question}</p>
        </div>
        <button
          type="button"
          aria-expanded={inspected}
          aria-controls={panelId}
          onClick={onToggle}
          className={
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
            (inspected ? 'border-ink bg-surface-2' : 'border-line-strong bg-surface hover:border-ink')
          }
        >
          <ChevronRight
            aria-hidden="true"
            className={'size-3.5 transition-transform ' + (inspected ? 'rotate-90' : '')}
          />
          {inspected ? 'Inspected' : 'Inspect'}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        <span className="font-mono uppercase tracking-[0.1em]">Method: </span>
        {item.method}
      </p>
      {inspected ? (
        <div id={panelId} className="mt-4 border-t border-line pt-4">
          {children}
        </div>
      ) : null}
    </article>
  )
}
