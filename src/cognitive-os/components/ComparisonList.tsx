import { CheckCircle2, Play } from 'lucide-react'
import type { ChallengeDefinition, ChallengeState, ComparisonDefinition } from '@/cognitive-os/types'

export function ComparisonList({
  definition,
  state,
  onRun,
  title = 'Predefined comparisons',
}: {
  definition: ChallengeDefinition
  state: ChallengeState
  onRun: (comparison: ComparisonDefinition) => void
  title?: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-label">{title}</p>
        <p className="font-mono text-[0.625rem] text-muted">
          {state.ranComparisons.length} / {definition.comparisons.length} run
        </p>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {definition.comparisons.map((comparison) => {
          const ran = state.ranComparisons.includes(comparison.id)
          return (
            <li key={comparison.id} className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{comparison.label}</p>
                {ran ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                    Run
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{comparison.description}</p>
              <button
                type="button"
                disabled={ran}
                onClick={() => onRun(comparison)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play aria-hidden="true" className="size-3.5" />
                {ran ? 'Already run' : 'Run comparison'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
