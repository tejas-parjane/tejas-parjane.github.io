import { Activity } from 'lucide-react'
import type { BeliefProfile, ExperimentRanking, RecommendedConfidence } from '@/cognitive-os/analysis/hypothesisArenaAnalysis'
import {
  experimentLabel,
  outcomeLabel,
} from '@/cognitive-os/analysis/hypothesisArenaAnalysis'
import { formatPercent } from '@/cognitive-os/format'
import type { ChallengeDefinition } from '@/cognitive-os/types'

function Bar({ value, emphasis }: { value: number; emphasis: boolean }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" role="presentation">
      <div
        className={emphasis ? 'h-full rounded-full bg-lime' : 'h-full rounded-full bg-line-strong'}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  )
}

export function BeliefPanel({
  definition,
  profile,
  ranking,
  recommended,
  experimentsRun,
}: {
  definition: ChallengeDefinition
  profile: BeliefProfile
  ranking: ExperimentRanking[]
  recommended: RecommendedConfidence
  experimentsRun: number
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-label flex items-center gap-2">
          <Activity aria-hidden="true" className="size-4" />
          Beliefs
        </p>
        <p className="font-mono text-[0.625rem] text-muted">
          {experimentsRun} experiment(s) applied · recommended confidence {recommended}
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Probabilities follow from the documented priors and likelihoods and update as you run experiments. They are
        a consequence of stated assumptions, not a measurement. The bar marks each hypothesis&rsquo;s posterior.
      </p>

      <ul className="mt-4 space-y-3">
        {definition.hypotheses.map((hypothesis) => {
          const prior = profile.prior[hypothesis.id] ?? 0
          const posterior = profile.posterior[hypothesis.id] ?? 0
          const isTop = hypothesis.id === profile.argmax
          return (
            <li key={hypothesis.id} className="rounded-xl border border-line bg-surface-2 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{hypothesis.label}</p>
                <p className="font-mono text-xs text-muted">
                  {formatPercent(prior, 0)} → <span className="text-ink">{formatPercent(posterior, 1)}</span>
                </p>
              </div>
              <div className="mt-2">
                <Bar value={posterior} emphasis={isTop} />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 border-t border-line pt-4">
        <p className="section-label">Ranked by expected information per cost</p>
        {ranking.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No affordable experiments remain within the budget.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {ranking.map((entry, index) => (
              <li
                key={entry.experimentId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[0.625rem] text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {experimentLabel(entry.experimentId)}
                </span>
                <span className="font-mono text-[0.6875rem] text-muted">
                  EIG {entry.eig.toFixed(3)} bits · cost {entry.cost} · {entry.informationPerCost.toFixed(3)}/unit
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Expected information gain is computed from the current beliefs and each experiment&rsquo;s documented
          likelihoods. A high-value experiment is one the evidence cannot yet replace.
        </p>
      </div>

      {profile.history.length > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="section-label">Update history</p>
          <ol className="mt-3 space-y-2">
            {profile.history.map((step) => (
              <li key={step.experimentId} className="rounded-xl border border-line bg-surface-2 p-3 text-sm">
                <p className="font-medium">{experimentLabel(step.experimentId)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Result: {outcomeLabel(step.experimentId, step.outcomeId)}
                </p>
                <p className="mt-1 font-mono text-[0.6875rem] text-muted">
                  {definition.hypotheses
                    .map((hypothesis) => `${formatPercent(step.posterior[hypothesis.id] ?? 0, 0)}`)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Posterior order: {definition.hypotheses.map((hypothesis) => hypothesis.label).join(' · ')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
