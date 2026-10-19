import type { HypothesisArenaView } from '@/cognitive-os/challenges/hypothesisArenaView'
import {
  PRIORS,
} from '@/cognitive-os/analysis/hypothesisArenaAnalysis'
import {
  EXPERIMENT_OUTCOMES,
  GROUND_TRUTH_OUTCOMES,
  arenaExperiments,
  arenaMeta,
  type ActivationSource,
} from '@/cognitive-os/datasets/hypothesisArena'
import { formatNumber, formatPercent, formatPoints } from '@/cognitive-os/format'

const SOURCE_LABELS: Record<ActivationSource, string> = {
  organic: 'Organic',
  paid_search: 'Paid search',
  social: 'Social',
  email: 'Email',
}

const RESULT_EXPERIMENT: Record<string, string> = {
  'ev-result-client': 'run-client-version',
  'ev-result-audit': 'run-instrumentation-audit',
  'ev-result-latency': 'run-latency-funnel',
  'ev-result-rollback': 'run-rollback',
}

function ResultContent({ experimentId }: { experimentId: string }) {
  const outcomeId = GROUND_TRUTH_OUTCOMES[experimentId]
  const outcome = EXPERIMENT_OUTCOMES[experimentId]?.find((item) => item.id === outcomeId)
  const experiment = arenaExperiments.find((item) => item.id === experimentId)
  if (!outcome) return <p className="text-sm text-muted">No result is available for this experiment.</p>
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{outcome.label}</p>
      <p className="text-sm leading-relaxed text-muted">{outcome.summary}</p>
      <ul className="space-y-2">
        {outcome.detail.map((line) => (
          <li key={line} className="flex gap-2 text-sm leading-relaxed text-muted">
            <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-current opacity-40" />
            {line}
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-muted">
        Synthetic experiment fixture{experiment ? ` · cost ${experiment.cost}, ${experiment.durationDays} days` : ''}.
        Presented as a result of the declared experiment, not derived from the activation table.
      </p>
    </div>
  )
}

export function HypothesisArenaContent({ id, view }: { id: string; view: HypothesisArenaView }) {
  if (RESULT_EXPERIMENT[id]) return <ResultContent experimentId={RESULT_EXPERIMENT[id]!} />

  switch (id) {
    case 'ev-activation-definition':
      return (
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Activation is defined as completing the core onboarding action within seven days of signup in both
            windows. The comparison window&rsquo;s release added a newly required profile field to the activation
            event schema, which is why the definition cannot be assumed unchanged.
          </p>
          <p className="rounded-xl border border-line bg-surface p-3">
            {arenaMeta.definition}
          </p>
          <p>Baseline window {arenaMeta.baselineWindow} · comparison window {arenaMeta.comparisonWindow}.</p>
        </div>
      )
    case 'ev-segment-mix':
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 pr-3 font-medium">Baseline share</th>
                <th className="py-2 pr-3 font-medium">Comparison share</th>
                <th className="py-2 pr-3 font-medium">Baseline rate</th>
                <th className="py-2 pr-3 font-medium">Comparison rate</th>
                <th className="py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {view.segments.map((segment) => (
                <tr key={segment.source} className="border-b border-line/60">
                  <td className="py-2 pr-3">{SOURCE_LABELS[segment.source]}</td>
                  <td className="py-2 pr-3 font-mono">{formatPercent(segment.baselineShare, 1)}</td>
                  <td className="py-2 pr-3 font-mono">{formatPercent(segment.comparisonShare, 1)}</td>
                  <td className="py-2 pr-3 font-mono">{formatPercent(segment.baseline.rate, 1)}</td>
                  <td className="py-2 pr-3 font-mono">{formatPercent(segment.comparison.rate, 1)}</td>
                  <td className="py-2 font-mono">{formatPoints(segment.rateChange)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Signup share and rate are computed from the aggregate rows. The overall rate moves even if each source
            behaves as before, when the mix shifts toward lower-activating sources.
          </p>
        </div>
      )
    case 'ev-release-notes':
      return (
        <ul className="space-y-2">
          {arenaMeta.releaseNotes.map((line) => (
            <li key={line} className="flex gap-2 text-sm leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-lime" />
              {line}
            </li>
          ))}
          <li className="pt-2 text-xs leading-relaxed text-muted">
            Release date {arenaMeta.releaseDate}. Three changes shipped together, so the release cannot be treated
            as one cause.
          </li>
        </ul>
      )
    case 'ev-baseline-variation':
      return (
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Baseline daily activation averaged <span className="font-mono">{formatPercent(view.noise.mean)}</span>{' '}
            with a standard deviation of <span className="font-mono">{formatPoints(view.noise.stdDev)}</span>. The
            observed change of <span className="font-mono">{formatPoints(view.noise.observedChange)}</span> is z ={' '}
            <span className="font-mono">{view.noise.zScore.toFixed(2)}</span>, so it exceeds ordinary day-to-day
            variation.
          </p>
          <ul className="flex flex-wrap gap-1 font-mono text-[0.625rem]">
            {view.noise.dailyRates.map((rate, index) => (
              <li
                key={index}
                className="rounded border border-line bg-surface px-1.5 py-0.5"
                title={`Day ${index + 1}: ${formatPercent(rate)}`}
              >
                {formatPercent(rate, 0)}
              </li>
            ))}
          </ul>
          <p className="text-xs">
            A large z-score confirms the drop is real relative to noise; it does not identify the cause.
          </p>
        </div>
      )
    case 'ev-experiment-method':
      return (
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Each hypothesis carries a prior probability, and each experiment&rsquo;s possible outcomes carry a
            likelihood under each hypothesis. Both tables are documented assumptions; the posterior is a
            consequence of them.
          </p>
          <ul className="space-y-1.5">
            {Object.entries(PRIORS).map(([id, value]) => (
              <li key={id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-1.5">
                <span>{id}</span>
                <span className="font-mono">{formatPercent(value, 0)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs">
            Changing a prior changes the posterior but not the observed activation table. That is why the priors
            are stated in the open rather than hidden in the score.
          </p>
        </div>
      )
    case 'ev-eig-ranking':
      return (
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Expected information gain is computed from the current beliefs as the reduction in uncertainty (bits)
            the experiment would produce on average, divided by its declared cost.
          </p>
          <ol className="space-y-1.5">
            {view.ranking.map((entry, index) => (
              <li
                key={entry.experimentId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-1.5"
              >
                <span>
                  <span className="font-mono text-[0.625rem] text-muted">{index + 1}. </span>
                  {arenaExperiments.find((experiment) => experiment.id === entry.experimentId)?.label}
                </span>
                <span className="font-mono text-[0.6875rem]">
                  {entry.eig.toFixed(3)} bits · {entry.informationPerCost.toFixed(3)}/unit
                </span>
              </li>
            ))}
          </ol>
          <p className="text-xs">
            The ranking updates after each run, because a result that already ruled something out changes what is
            still worth testing. A cheap experiment can outrank an expensive one even with less raw information.
          </p>
        </div>
      )
    case 'ev-belief-posterior':
      return (
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Applying Bayes&rsquo; rule with the documented likelihoods after {view.profile.history.length}{' '}
            experiment(s) gives these posterior probabilities:
          </p>
          <ul className="space-y-1.5">
            {Object.entries(view.profile.posterior).map(([id, value]) => (
              <li key={id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-1.5">
                <span>{id}</span>
                <span className="font-mono">{formatPercent(value, 1)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs">
            The most probable explanation is {view.profile.argmax} at {formatPercent(view.profile.maxProbability, 1)},
            with {view.profile.runnerUp} next. Remaining probability mass is genuine ambiguity, not noise to be
            smoothed away.
          </p>
          <p className="text-xs">
            Total experiment budget {formatNumber(arenaMeta.experimentBudget)}; {formatNumber(view.remainingBudget)}{' '}
            remaining.
          </p>
        </div>
      )
    default:
      return <p className="text-sm text-muted">No content for this evidence.</p>
  }
}
