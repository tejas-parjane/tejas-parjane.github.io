import { useMemo, useReducer } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Terminal } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  agentAutopsyChallenge,
  buildDecisionRecord,
  failurePointOf,
} from '@/cognitive-os/challenges/agentAutopsy'
import { buildAgentAutopsyView } from '@/cognitive-os/challenges/agentAutopsyView'
import { ChallengeFilters } from '@/cognitive-os/components/ChallengeFilters'
import { ChallengeSteps } from '@/cognitive-os/components/ChallengeSteps'
import { ComparisonList } from '@/cognitive-os/components/ComparisonList'
import { DecisionForm } from '@/cognitive-os/components/DecisionForm'
import { DecisionRecordView } from '@/cognitive-os/components/DecisionRecordView'
import { AgentEvidenceContent } from '@/cognitive-os/components/AgentEvidenceContent'
import { AgentTrace } from '@/cognitive-os/components/AgentTrace'
import { EvidencePanel } from '@/cognitive-os/components/EvidencePanel'
import { HypothesisList } from '@/cognitive-os/components/HypothesisList'
import { canSubmit, createInitialState, transition } from '@/cognitive-os/engine'
import { STAGE_LABELS, TRACE_STAGES, agentAutopsyMeta } from '@/cognitive-os/datasets/agentAutopsy'
import { analyseAutopsy } from '@/cognitive-os/analysis/agentAutopsyAnalysis'
import { formatPercent } from '@/cognitive-os/format'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import type { ChallengeAction, ChallengeState } from '@/cognitive-os/types'

const definition = agentAutopsyChallenge

function evidenceCoverage(state: ChallengeState): number {
  const total = definition.evidence.reduce((sum, item) => sum + item.weight, 0)
  const inspected = definition.evidence
    .filter((item) => state.inspected.includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0)
  return total === 0 ? 0 : inspected / total
}

export function AgentAutopsyPage() {
  useDocumentMeta(
    'Agent Autopsy — Cognitive OS — Tejas Parjane',
    'A deterministic, browser-only challenge: debug a synthetic AI agent trace, find the earliest consequential failure, separate root cause from symptom, and submit a scored incident report.',
  )

  const [state, dispatch] = useReducer(
    (current: ChallengeState, action: ChallengeAction) => transition(current, action, definition),
    definition,
    createInitialState,
  )

  const view = useMemo(
    () => buildAgentAutopsyView({ stage: state.filters.stage }),
    [state.filters.stage],
  )

  const analysis = analyseAutopsy()
  const canSubmitNow = canSubmit(state, definition)
  const coverage = evidenceCoverage(state)
  const evidenceIds = useMemo(() => definition.evidence.map((item) => item.id), [])
  const failurePoint = failurePointOf(state)

  return (
    <>
      <PageHeader
        eyebrow="Cognitive OS · Challenge"
        title="Agent Autopsy"
        description="An enterprise knowledge assistant returned a confident but wrong answer, even though the correct document was available. Find the earliest consequential failure — not the final visible error."
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Terminal aria-hidden="true" className="size-4" />
            {agentAutopsyMeta.events}-event synthetic trace · seed {agentAutopsyMeta.seed}
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
                  <h2 className="text-2xl font-semibold tracking-tight">The incident</h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
                    A user asked: <span className="text-ink">“{agentAutopsyMeta.question}”</span> The assistant
                    answered <span className="text-ink">{agentAutopsyMeta.answerReturned}</span>, which is wrong.
                    The trace shows the pipeline retrieved the current policy document, checked its version, and then
                    answered as though that document had never been seen. Your job is to find where the outcome
                    became unrecoverable, argue it from the trace, and choose a fix a careful engineer would defend.
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">The trace</h2>
                  <ul className="mt-3 space-y-2">
                    {agentAutopsyMeta.generation.map((line) => (
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
                    {agentAutopsyMeta.disclaimer}
                  </p>
                </section>
              </div>
              <aside className="space-y-4">
                <div className="surface-card p-5">
                  <p className="section-label">Pipeline stages</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {TRACE_STAGES.map((stage) => (
                      <li key={stage} className="flex items-center gap-2">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-lime" />
                        {STAGE_LABELS[stage]}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    Required steps: {agentAutopsyMeta.requiredSteps.join(' → ')}
                  </p>
                </div>
                <div className="surface-card p-5">
                  <p className="section-label">How this is scored</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    The rubric weights evidence selection, correct interpretation, uncertainty handling, and decision
                    consistency. Interpretation requires both the right root cause and the right failure locus, and is
                    gated by inspecting the events that localise it. It is a designed educational rubric, not a
                    validated measure.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'NEXT_STEP' })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-ink transition-colors hover:brightness-95"
                >
                  Review the trace
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
                  information value. Inspecting a timeline event or running a comparison records that evidence.
                </p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'NEXT_STEP' })}
                  className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-medium text-lime-ink transition-colors hover:brightness-95"
                >
                  Go to diagnosis
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </div>

              <AgentTrace
                events={view.events}
                evidenceIds={evidenceIds}
                inspected={state.inspected}
                onToggleEvidence={(id) => dispatch({ type: 'INSPECT_EVIDENCE', id })}
              />

              <ChallengeFilters
                definition={definition}
                state={state}
                onChange={dispatch}
                note="Filter the timeline by pipeline stage (affects what you see, not the score)"
                labelForValue={(_, value) => STAGE_LABELS[value as keyof typeof STAGE_LABELS] ?? value}
              />

              <ComparisonList
                definition={definition}
                state={state}
                title="Diagnostic comparisons"
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
                    <AgentEvidenceContent id={item.id} view={view} />
                  </EvidencePanel>
                ))}
              </div>

              <HypothesisList
                definition={definition}
                state={state}
                contradicted={analysis.contradicted}
                note="Status appears only for hypotheses whose discriminating evidence you have inspected. A symptom can be true and still not be the root cause."
              />
            </div>
          ) : null}

          {state.step === 'deciding' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Submit your diagnosis</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  Name the earliest consequential failure, choose the root cause it implies, and select a fix with an
                  explicit regression test. The diagnosis is scored from the trace evidence you inspected and the
                  decisions you make, not from how many buttons you clicked.
                </p>
              </div>
              <DecisionForm
                definition={definition}
                state={state}
                onChange={dispatch}
                canSubmitNow={canSubmitNow}
                primaryLegend="Root cause"
                secondaryLegend="Contributing factor (optional)"
                secondaryNoneDescription="The root cause accounts for the failure on its own."
                actionLegend="Targeted fix"
                submitLabel="Submit diagnosis"
              />
              {failurePoint === null ? null : (
                <p className="text-xs leading-relaxed text-muted" aria-live="polite">
                  Selected failure locus: <span className="font-mono">{failurePoint}</span>
                </p>
              )}
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
