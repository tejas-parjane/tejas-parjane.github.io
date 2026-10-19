import { CircleDollarSign, FlaskConical, Play, ShieldAlert, Timer } from 'lucide-react'
import type { ChallengeDefinition, ChallengeState } from '@/cognitive-os/types'
import { formatNumber } from '@/cognitive-os/format'

const RISK_LABEL: Record<string, string> = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }

export function ExperimentList({
  definition,
  state,
  onRun,
  remainingBudget,
  budget,
}: {
  definition: ChallengeDefinition
  state: ChallengeState
  onRun: (experimentId: string) => void
  remainingBudget: number
  budget: number
}) {
  const experiments = definition.experiments ?? []
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-label flex items-center gap-2">
          <FlaskConical aria-hidden="true" className="size-4" />
          Experiments
        </p>
        <p className="font-mono text-[0.625rem] text-muted" aria-live="polite">
          Budget remaining {formatNumber(remainingBudget)} / {formatNumber(budget)}
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Running an experiment spends budget and reveals its result. Costs, durations, and risks are declared in
        advance so you can weigh information against what it takes to get it.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {experiments.map((experiment) => {
          const ran = state.experimentsRun.includes(experiment.id)
          const affordable = experiment.cost <= remainingBudget
          return (
            <li key={experiment.id} className="flex flex-col rounded-xl border border-line bg-surface-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{experiment.label}</p>
                {ran ? (
                  <span className="rounded-full border border-lime/60 bg-lime/15 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em]">
                    Run
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{experiment.description}</p>
              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-muted">
                <div className="inline-flex items-center gap-1">
                  <CircleDollarSign aria-hidden="true" className="size-3.5" />
                  {formatNumber(experiment.cost)} budget
                </div>
                <div className="inline-flex items-center gap-1">
                  <Timer aria-hidden="true" className="size-3.5" />
                  {formatNumber(experiment.durationDays)} days
                </div>
                <div className="inline-flex items-center gap-1">
                  <ShieldAlert aria-hidden="true" className="size-3.5" />
                  {RISK_LABEL[experiment.risk] ?? experiment.risk}
                </div>
              </dl>
              <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted">
                <span className="font-mono uppercase tracking-[0.08em]">Constraint: </span>
                {experiment.feasibility}
              </p>
              <button
                type="button"
                disabled={ran || !affordable}
                onClick={() => onRun(experiment.id)}
                className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play aria-hidden="true" className="size-3.5" />
                {ran ? 'Already run' : affordable ? 'Run experiment' : 'Not enough budget'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
