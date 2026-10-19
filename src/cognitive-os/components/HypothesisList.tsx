import type { ChallengeDefinition, ChallengeState, Hypothesis } from '@/cognitive-os/types'

export function HypothesisList({
  definition,
  state,
  contradicted,
  title = 'Competing hypotheses',
  note = 'Status appears only for hypotheses whose discriminating evidence you have inspected.',
}: {
  definition: ChallengeDefinition
  state: ChallengeState
  contradicted: string[]
  title?: string
  note?: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="section-label">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{note}</p>
      <ul className="mt-4 space-y-3">
        {definition.hypotheses.map((hypothesis: Hypothesis) => {
          const relevance = definition.evidence.filter((item) =>
            item.discriminates.includes(hypothesis.id),
          )
          const inspectedRelevance = relevance.filter((item) => state.inspected.includes(item.id))
          const examined = inspectedRelevance.length > 0
          const isContradicted = examined && contradicted.includes(hypothesis.id)
          const status = !examined
            ? { label: 'Not yet examined', tone: 'text-muted border-line' }
            : isContradicted
              ? {
                  label: 'Contradicted by inspected evidence',
                  tone: 'text-ink border-amber-500/50 bg-amber-500/10',
                }
              : {
                  label: 'Consistent with inspected evidence',
                  tone: 'text-ink border-lime/60 bg-lime/15',
                }
          return (
            <li key={hypothesis.id} className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{hypothesis.label}</p>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] ${status.tone}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{hypothesis.statement}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
