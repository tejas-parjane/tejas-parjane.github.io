import { RotateCcw } from 'lucide-react'
import { businessDiagnosisChallenge } from '@/cognitive-os/challenges/businessDiagnosis'
import { ScorePanel } from '@/cognitive-os/components/ScorePanel'
import type { DecisionRecord } from '@/cognitive-os/types'

function labelForHypothesis(id: string | null): string {
  if (id === null) return 'None'
  return businessDiagnosisChallenge.hypotheses.find((item) => item.id === id)?.label ?? id
}

function labelForConfidence(id: string | null): string {
  if (id === null) return 'None'
  return businessDiagnosisChallenge.confidenceOptions.find((item) => item.id === id)?.label ?? id
}

function labelForAction(id: string | null): string {
  if (id === null) return 'None'
  return businessDiagnosisChallenge.nextActionOptions.find((item) => item.id === id)?.label ?? id
}

function labelForCaveat(id: string): string {
  return businessDiagnosisChallenge.caveats.find((item) => item.id === id)?.label ?? id
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  )
}

function KnowledgeList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className="surface-card p-5">
      <p className={`font-mono text-[0.625rem] uppercase tracking-[0.16em] ${tone}`}>{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted">
            <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-current opacity-40" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DecisionRecordView({
  record,
  onReset,
}: {
  record: DecisionRecord
  onReset: () => void
}) {
  const touchedFilters = Object.entries(record.filters).filter(([, value]) => value !== 'all')

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-line bg-surface-2 p-5">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
          Reproducibility fingerprint
        </p>
        <p className="mt-2 font-mono text-2xl">{record.fingerprint}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Deterministic hash of your interaction state (step, inspected evidence, comparisons run, filters,
          conclusion, confidence, caveats, next action, notes) plus the score. The same interactions always
          produce this same fingerprint. Engine v{record.engineVersion} · dataset {record.datasetId}.
        </p>
      </div>

      <section aria-labelledby="submission-heading" className="surface-card p-6">
        <h2 id="submission-heading" className="text-xl font-semibold tracking-tight">
          Your submission
        </h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <KeyValue label="Primary hypothesis" value={labelForHypothesis(record.submittedPrimary)} />
          <KeyValue label="Secondary hypothesis" value={labelForHypothesis(record.submittedSecondary)} />
          <KeyValue label="Confidence" value={labelForConfidence(record.confidence)} />
          <KeyValue label="Next action" value={labelForAction(record.nextAction)} />
          <KeyValue
            label="Caveats acknowledged"
            value={
              record.acknowledgedCaveats.length === 0
                ? 'None'
                : record.acknowledgedCaveats.map(labelForCaveat).join(' · ')
            }
          />
          <KeyValue
            label="Filters applied"
            value={
              touchedFilters.length === 0
                ? 'None (full dataset)'
                : touchedFilters.map(([key, value]) => `${key}: ${value}`).join(', ')
            }
          />
          <KeyValue label="Evidence inspected" value={`${record.inspectedEvidence.length} panels`} />
          <KeyValue label="Comparisons run" value={`${record.ranComparisons.length} of ${businessDiagnosisChallenge.comparisons.length}`} />
        </dl>
      </section>

      <section aria-labelledby="score-heading" className="surface-card p-6">
        <h2 id="score-heading" className="text-xl font-semibold tracking-tight">
          Scoring breakdown
        </h2>
        <div className="mt-5">
          <ScorePanel score={record.score} />
        </div>
      </section>

      <section aria-labelledby="agreement-heading" className="surface-card p-6">
        <h2 id="agreement-heading" className="text-xl font-semibold tracking-tight">
          Agreement with the reference reading
        </h2>
        <ul className="mt-4 space-y-2">
          {record.agreement.notes.map((note) => (
            <li key={note} className="flex gap-2 text-sm leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-lime" />
              {note}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed">
          {record.reference.statement}
        </p>
      </section>

      <section aria-labelledby="knowledge-heading">
        <h2 id="knowledge-heading" className="text-xl font-semibold tracking-tight">
          Facts, assumptions, and uncertainty
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          The reference reading separates what the data show from what is assumed and what remains uncertain.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <KnowledgeList title="Facts (computed)" items={record.reference.facts} tone="text-ink" />
          <KnowledgeList title="Assumptions" items={record.reference.assumptions} tone="text-ink" />
          <KnowledgeList title="Uncertainty" items={record.reference.uncertainty} tone="text-ink" />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Run the challenge again
        </button>
      </div>
    </div>
  )
}
