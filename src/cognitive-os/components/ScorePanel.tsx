import type { DecisionScore } from '@/cognitive-os/types'
import { formatPercent } from '@/cognitive-os/format'

const bandCopy: Record<DecisionScore['band'], string> = {
  strong: 'Strong — your conclusion and reasoning align with the reference reading.',
  developing: 'Developing — parts of the reasoning are sound but important pieces are missing.',
  insufficient: 'Insufficient — the conclusion is not supported by the evidence you inspected.',
}

export function ScorePanel({ score }: { score: DecisionScore }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
            Reasoning score
          </p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">{score.total}</p>
          <p className="text-xs text-muted">out of 100 · designed rubric, not a validated measure</p>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted">{bandCopy[score.band]}</p>
      </div>

      <ul className="space-y-4">
        {score.criteria.map((criterion) => (
          <li key={criterion.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{criterion.label}</span>
              <span className="font-mono text-xs text-muted">
                {formatPercent(criterion.weight, 0)} weight · {formatPercent(criterion.score, 0)} earned
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-line bg-surface-2">
              <span
                className="block h-full bg-lime"
                style={{ width: `${Math.round(criterion.score * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{criterion.note}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
