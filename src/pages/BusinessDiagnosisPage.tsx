import { useMemo, useReducer } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Database } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  analyseReference,
  buildDecisionRecord,
  businessDiagnosisChallenge,
} from '@/cognitive-os/challenges/businessDiagnosis'
import { buildBusinessDiagnosisView } from '@/cognitive-os/challenges/businessDiagnosisView'
import { ChallengeFilters } from '@/cognitive-os/components/ChallengeFilters'
import { ChallengeSteps } from '@/cognitive-os/components/ChallengeSteps'
import { ComparisonList } from '@/cognitive-os/components/ComparisonList'
import { DecisionForm } from '@/cognitive-os/components/DecisionForm'
import { DecisionRecordView } from '@/cognitive-os/components/DecisionRecordView'
import { EvidenceContent } from '@/cognitive-os/components/EvidenceContent'
import { EvidencePanel } from '@/cognitive-os/components/EvidencePanel'
import { HypothesisList } from '@/cognitive-os/components/HypothesisList'
import { canSubmit, createInitialState, transition } from '@/cognitive-os/engine'
import { businessDiagnosisMeta } from '@/cognitive-os/datasets/businessDiagnosis'
import { groupKeyLabel } from '@/cognitive-os/analysis/businessDiagnosisAnalysis'
import { formatNumber, formatPercent } from '@/cognitive-os/format'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import type { ChallengeAction, ChallengeState } from '@/cognitive-os/types'

const definition = businessDiagnosisChallenge

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
        <ChallengeSteps definition={definition} state={state} onGo={dispatch} />

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

              <ChallengeFilters
                definition={definition}
                state={state}
                onChange={dispatch}
                labelForValue={(_, value) => groupKeyLabel(value)}
              />
              <ComparisonList
                definition={definition}
                state={state}
                onRun={(comparison) => dispatch({ type: 'RUN_COMPARISON', id: comparison.id })}
              />

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

              <HypothesisList definition={definition} state={state} contradicted={contradicted} />
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
              <DecisionForm definition={definition} state={state} onChange={dispatch} canSubmitNow={canSubmitNow} />
            </div>
          ) : null}

          {state.step === 'record' ? (
            <DecisionRecordView
              record={buildDecisionRecord(state)}
              definition={definition}
              onReset={() => dispatch({ type: 'RESET' })}
            />
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
