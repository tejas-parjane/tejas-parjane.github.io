import { useMemo, useReducer } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Database, Filter, Play } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  analyseReference,
  buildDecisionRecord,
  businessDiagnosisChallenge,
} from '@/cognitive-os/challenges/businessDiagnosis'
import { buildBusinessDiagnosisView } from '@/cognitive-os/challenges/businessDiagnosisView'
import { EvidenceContent } from '@/cognitive-os/components/EvidenceContent'
import { DecisionRecordView } from '@/cognitive-os/components/DecisionRecordView'
import {
  ALL_FILTER_VALUE,
  canEnterStep,
  canSubmit,
  createInitialState,
  transition,
} from '@/cognitive-os/engine'
import { businessDiagnosisMeta } from '@/cognitive-os/datasets/businessDiagnosis'
import { groupKeyLabel } from '@/cognitive-os/analysis/businessDiagnosisAnalysis'
import { formatNumber, formatPercent } from '@/cognitive-os/format'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import type {
  ChallengeAction,
  ChallengeState,
  ComparisonDefinition,
  EvidenceItem,
  Hypothesis,
} from '@/cognitive-os/types'

const definition = businessDiagnosisChallenge

function StepNav({
  state,
  onGo,
}: {
  state: ChallengeState
  onGo: (action: ChallengeAction) => void
}) {
  return (
    <nav aria-label="Challenge steps">
      <ol className="flex flex-wrap gap-2">
        {definition.steps.map((step, index) => {
          const reachable = canEnterStep(state, step.id, definition)
          const current = state.step === step.id
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                disabled={!reachable}
                onClick={() => onGo({ type: 'GO_TO_STEP', step: step.id })}
                className={
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
                  (current
                    ? 'border-ink bg-surface-2 font-medium'
                    : 'border-line bg-surface hover:border-line-strong')
                }
              >
                <span className="font-mono text-[0.625rem] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function FilterBar({
  state,
  onChange,
}: {
  state: ChallengeState
  onChange: (action: ChallengeAction) => void
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="section-label flex items-center gap-2">
        <Filter aria-hidden="true" className="size-3.5" />
        Filters (affect the evidence you see, not the score)
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {definition.filters.map((dimension) => (
          <label key={dimension.id} className="block text-sm">
            <span className="font-medium">{dimension.label}</span>
            <select
              value={state.filters[dimension.id] ?? ALL_FILTER_VALUE}
              onChange={(event) =>
                onChange({ type: 'SET_FILTER', dimension: dimension.id, value: event.target.value })
              }
              className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
            >
              <option value={ALL_FILTER_VALUE}>All</option>
              {dimension.values.map((value) => (
                <option key={value} value={value}>
                  {groupKeyLabel(value)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  )
}

function ComparisonList({
  state,
  onRun,
}: {
  state: ChallengeState
  onRun: (comparison: ComparisonDefinition) => void
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-label">Predefined comparisons</p>
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

function EvidencePanel({
  item,
  inspected,
  onToggle,
  children,
}: {
  item: EvidenceItem
  inspected: boolean
  onToggle: () => void
  children: React.ReactNode
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

function HypothesisList({ state, contradicted }: { state: ChallengeState; contradicted: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="section-label">Competing hypotheses</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Status appears only for hypotheses whose discriminating evidence you have inspected.
      </p>
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
              ? { label: 'Contradicted by inspected evidence', tone: 'text-ink border-amber-500/50 bg-amber-500/10' }
              : { label: 'Consistent with inspected evidence', tone: 'text-ink border-lime/60 bg-lime/15' }
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

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="surface-card p-5">
      <legend className="section-label px-1">{legend}</legend>
      <div className="mt-2 space-y-2">{children}</div>
    </fieldset>
  )
}

function RadioRow({
  name,
  id,
  label,
  description,
  checked,
  onChange,
}: {
  name: string
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm">
      <input type="radio" name={name} value={id} checked={checked} onChange={onChange} className="mt-1" />
      <span>
        <span className="font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  )
}

function DecisionForm({
  state,
  onChange,
  canSubmitNow,
}: {
  state: ChallengeState
  onChange: (action: ChallengeAction) => void
  canSubmitNow: boolean
}) {
  const missing: string[] = []
  if (!state.primaryHypothesis) missing.push('a primary hypothesis')
  if (!state.confidence) missing.push('a confidence level')
  if (!state.nextAction) missing.push('a next action')

  return (
    <div className="space-y-6">
      <Fieldset legend="Primary conclusion">
        {definition.hypotheses.map((hypothesis) => (
          <RadioRow
            key={hypothesis.id}
            name="primary-hypothesis"
            id={hypothesis.id}
            label={hypothesis.label}
            description={hypothesis.statement}
            checked={state.primaryHypothesis === hypothesis.id}
            onChange={() => onChange({ type: 'SET_PRIMARY_HYPOTHESIS', id: hypothesis.id })}
          />
        ))}
      </Fieldset>

      <Fieldset legend="Secondary component (optional)">
        <RadioRow
          name="secondary-hypothesis"
          id="none"
          label="None"
          description="The primary explanation accounts for the change on its own."
          checked={state.secondaryHypothesis === null}
          onChange={() => onChange({ type: 'SET_SECONDARY_HYPOTHESIS', id: null })}
        />
        {definition.hypotheses.map((hypothesis) => (
          <RadioRow
            key={hypothesis.id}
            name="secondary-hypothesis"
            id={`secondary-${hypothesis.id}`}
            label={hypothesis.label}
            checked={state.secondaryHypothesis === hypothesis.id}
            onChange={() => onChange({ type: 'SET_SECONDARY_HYPOTHESIS', id: hypothesis.id })}
          />
        ))}
      </Fieldset>

      <Fieldset legend="Confidence">
        {definition.confidenceOptions.map((option) => (
          <RadioRow
            key={option.id}
            name="confidence"
            id={`confidence-${option.id}`}
            label={option.label}
            description={option.description}
            checked={state.confidence === option.id}
            onChange={() => onChange({ type: 'SET_CONFIDENCE', id: option.id })}
          />
        ))}
      </Fieldset>

      <fieldset className="surface-card p-5">
        <legend className="section-label px-1">Caveats to acknowledge</legend>
        <div className="mt-2 space-y-2">
          {definition.caveats.map((caveat) => (
            <label
              key={caveat.id}
              className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={state.acknowledgedCaveats.includes(caveat.id)}
                onChange={() => onChange({ type: 'TOGGLE_CAVEAT', id: caveat.id })}
                className="mt-1"
              />
              <span>
                {caveat.label}
                {caveat.required ? (
                  <span className="ml-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                    required
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Fieldset legend="Next action">
        {definition.nextActionOptions.map((option) => (
          <RadioRow
            key={option.id}
            name="next-action"
            id={`action-${option.id}`}
            label={option.label}
            description={option.description}
            checked={state.nextAction === option.id}
            onChange={() => onChange({ type: 'SET_NEXT_ACTION', id: option.id })}
          />
        ))}
      </Fieldset>

      <div className="surface-card p-5">
        <label htmlFor="decision-notes" className="section-label block px-1">
          Reasoning notes (optional)
        </label>
        <textarea
          id="decision-notes"
          value={state.notes}
          onChange={(event) => onChange({ type: 'SET_NOTES', value: event.target.value })}
          rows={4}
          className="mt-3 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm"
          placeholder="State the evidence that carried the most weight and what you would still want to know."
        />
      </div>

      <div className="sticky bottom-4 rounded-2xl border border-line bg-surface/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {canSubmitNow
              ? 'Ready to submit. Your answer will be scored against the reference reading.'
              : `Choose ${missing.join(', ')} to submit.`}
          </p>
          <button
            type="button"
            disabled={!canSubmitNow}
            onClick={() => onChange({ type: 'SUBMIT' })}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-medium text-lime-ink transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit conclusion
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function evidenceCoverage(state: ChallengeState): number {
  const total = definition.evidence.reduce((sum, item) => sum + item.weight, 0)
  const inspected = definition.evidence
    .filter((item) => state.inspected.includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0)
  return total === 0 ? 0 : inspected / total
}

export function BusinessDiagnosisPage() {
  useDocumentMeta(
    'Business Diagnosis — Cognitive OS — Tejas Parjane',
    'A deterministic, browser-only challenge: investigate an approximately 18% conversion-rate decline, compare hypotheses, filter the evidence, and submit a scored conclusion.',
  )

  const [state, dispatch] = useReducer(
    (current: ChallengeState, action: ChallengeAction) => transition(current, action, definition),
    definition,
    createInitialState,
  )

  const view = useMemo(
    () =>
      buildBusinessDiagnosisView({
        source: state.filters.source,
        device: state.filters.device,
        landingPage: state.filters.landingPage,
      }),
    [state.filters.source, state.filters.device, state.filters.landingPage],
  )

  const analysis = analyseReference()
  const contradicted = analysis.contradicted
  const canSubmitNow = canSubmit(state, definition)
  const coverage = evidenceCoverage(state)

  return (
    <>
      <PageHeader
        eyebrow="Cognitive OS · Challenge"
        title="Business Diagnosis"
        description="Conversion rate fell about 18% between two two-week periods. Decide what the evidence supports, what it does not, and what to do next."
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Database aria-hidden="true" className="size-4" />
            {formatNumber(businessDiagnosisMeta.rows)} synthetic rows · seed {businessDiagnosisMeta.seed}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Deterministic, no LLM
          </span>
        </div>
      </PageHeader>

      <Container className="py-12 sm:py-16">
        <StepNav state={state} onGo={dispatch} />

        <div className="mt-10">
          {state.step === 'briefing' ? (
            <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">The situation</h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
                    Blended conversion rate fell from {formatPercent(analysis.overall.baseline.rate, 2)} to{' '}
                    {formatPercent(analysis.overall.comparison.rate, 2)} while sessions rose slightly.
                    Your job is to work out which explanation the evidence supports, separate the contribution of
                    different mechanisms, and choose a decision that a careful analyst would defend.
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">The dataset</h2>
                  <ul className="mt-3 space-y-2">
                    {businessDiagnosisMeta.generation.map((line) => (
                      <li
                        key={line}
                        className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-muted"
                      >
                        <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-lime" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed">
                    {businessDiagnosisMeta.disclaimer}
                  </p>
                </section>
              </div>
              <aside className="space-y-4">
                <div className="surface-card p-5">
                  <p className="section-label">Metric definitions</p>
                  <dl className="mt-3 space-y-3 text-sm">
                    {Object.entries(businessDiagnosisMeta.metrics).map(([key, value]) => (
                      <div key={key}>
                        <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                          {key}
                        </dt>
                        <dd className="mt-1 text-muted">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="surface-card p-5">
                  <p className="section-label">How this is scored</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    The rubric weights evidence selection, interpretation, uncertainty handling, and decision
                    consistency. It is a designed educational rubric, not a validated measure. Cautious conclusions
                    are not penalised when the evidence is thin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'NEXT_STEP' })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-ink transition-colors hover:brightness-95"
                >
                  Begin investigation
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </aside>
            </div>
          ) : null}

          {state.step === 'investigating' ? (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2 p-4">
                <p className="text-sm text-muted">
                  Evidence coverage: <span className="font-mono">{formatPercent(coverage, 0)}</span> of the designed
                  information value. Running comparisons reveals evidence automatically.
                </p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'NEXT_STEP' })}
                  className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-medium text-lime-ink transition-colors hover:brightness-95"
                >
                  Go to decision
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </div>

              <FilterBar state={state} onChange={dispatch} />
              <ComparisonList state={state} onRun={(comparison) => dispatch({ type: 'RUN_COMPARISON', id: comparison.id })} />

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Evidence</h2>
                {definition.evidence.map((item) => (
                  <EvidencePanel
                    key={item.id}
                    item={item}
                    inspected={state.inspected.includes(item.id)}
                    onToggle={() => dispatch({ type: 'INSPECT_EVIDENCE', id: item.id })}
                  >
                    <EvidenceContent id={item.id} view={view} />
                  </EvidencePanel>
                ))}
              </div>

              <HypothesisList state={state} contradicted={contradicted} />
            </div>
          ) : null}

          {state.step === 'deciding' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Submit your conclusion</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  A conclusion is scored from the evidence you inspected and the decisions you make — not from how
                  many buttons you clicked. Returning to investigate more evidence will change the outcome.
                </p>
              </div>
              <DecisionForm state={state} onChange={dispatch} canSubmitNow={canSubmitNow} />
            </div>
          ) : null}

          {state.step === 'record' ? (
            <DecisionRecordView record={buildDecisionRecord(state)} onReset={() => dispatch({ type: 'RESET' })} />
          ) : null}

          {state.step !== 'record' ? (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
              <Link
                to="/cognitive-os/"
                className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Back to the laboratory
              </Link>
              <button
                type="button"
                disabled={state.step === 'briefing'}
                onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Previous step
              </button>
            </div>
          ) : null}
        </div>
      </Container>
    </>
  )
}
