import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { STAGE_LABELS, type RecordedSeverity, type TraceEvent } from '@/cognitive-os/datasets/agentAutopsy'

const severityTone: Record<RecordedSeverity, string> = {
  info: 'border-line bg-surface-2 text-muted',
  notice: 'border-sky-500/40 bg-sky-500/10 text-ink',
  warning: 'border-amber-500/50 bg-amber-500/10 text-ink',
  error: 'border-red-500/50 bg-red-500/10 text-ink',
}

function EventRow({
  event,
  isEvidence,
  inspected,
  onToggleEvidence,
}: {
  event: TraceEvent
  isEvidence: boolean
  inspected: boolean
  onToggleEvidence: () => void
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `event-body-${event.id}`

  return (
    <li className="relative pl-6">
      <span aria-hidden="true" className="absolute left-0 top-3 size-2 rounded-full bg-lime" />
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
              <span>#{String(event.seq).padStart(2, '0')}</span>
              <span>T+{event.at}</span>
              <span>{event.actor}</span>
              <span className="rounded-full border border-line px-1.5 py-0.5">{event.type}</span>
              <span className={`rounded-full border px-1.5 py-0.5 ${severityTone[event.recordedSeverity]}`}>
                {event.recordedSeverity}
              </span>
              <span className="rounded-full border border-line px-1.5 py-0.5">{STAGE_LABELS[event.stage]}</span>
            </div>
            <p className="mt-2 text-sm font-medium">{event.summary}</p>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={`Event ${event.seq} details`}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-ink"
          >
            <ChevronDown
              aria-hidden="true"
              className={'size-3.5 transition-transform ' + (open ? 'rotate-180' : '')}
            />
            {open ? 'Hide' : 'Details'}
          </button>
        </div>
        {open ? (
          <div id={bodyId} className="border-t border-line px-4 py-3">
            <ul className="space-y-1.5">
              {event.detail.map((line) => (
                <li key={line} className="font-mono text-xs leading-relaxed text-muted">
                  {line}
                </li>
              ))}
            </ul>
            {isEvidence ? (
              <button
                type="button"
                onClick={onToggleEvidence}
                aria-pressed={inspected}
                className={
                  'mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
                  (inspected ? 'border-ink bg-surface-2' : 'border-line-strong bg-surface hover:border-ink')
                }
              >
                {inspected ? 'Inspected' : 'Inspect as evidence'}
              </button>
            ) : (
              <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                Context event · not scored evidence
              </p>
            )}
          </div>
        ) : null}
      </div>
    </li>
  )
}

export function AgentTrace({
  events,
  evidenceIds,
  inspected,
  onToggleEvidence,
}: {
  events: TraceEvent[]
  evidenceIds: string[]
  inspected: string[]
  onToggleEvidence: (id: string) => void
}) {
  const evidenceSet = new Set(evidenceIds)

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-label">Execution timeline</p>
        <p className="font-mono text-[0.625rem] text-muted">
          {events.length} events shown · expand a row to read its payload
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Events are ordered by recorded time. Inspecting an event as evidence records that you examined its payload;
        what you inspect is what counts toward the evidence score.
      </p>
      {events.length === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm text-muted">
          No events match the current stage filter.
        </p>
      ) : (
        <ol className="mt-4 space-y-2 border-l border-line pl-1">
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              isEvidence={evidenceSet.has(event.id)}
              inspected={inspected.includes(event.id)}
              onToggleEvidence={() => onToggleEvidence(event.id)}
            />
          ))}
        </ol>
      )}
    </div>
  )
}
