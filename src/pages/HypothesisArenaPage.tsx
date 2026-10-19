import { useMemo, useReducer } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { buildHypothesisArenaView } from '@/cognitive-os/challenges/hypothesisArenaView'
import { arenaChallenge, buildDecisionRecord } from '@/cognitive-os/challenges/hypothesisArena'
import {
  recommendedConfidence,
} from '@/cognitive-os/analysis/hypothesisArenaAnalysis'
import { arenaExperiments, arenaMeta, type ActivationSource } from '@/cognitive-os/datasets/hypothesisArena'
import { BeliefPanel } from '@/cognitive-os/components/BeliefPanel'
import { ChallengeFilters } from '@/cognitive-os/components/ChallengeFilters'
import { ChallengeSteps } from '@/cognitive-os/components/ChallengeSteps'
import { ComparisonList } from '@/cognitive-os/components/ComparisonList'
import { DecisionForm } from '@/cognitive-os/components/DecisionForm'
import { DecisionRecordView } from '@/cognitive-os/components/DecisionRecordView'
import { EvidencePanel } from '@/cognitive-os/components/EvidencePanel'
import { ExperimentList } from '@/cognitive-os/components/ExperimentList'
import { HypothesisArenaContent } from '@/cognitive-os/components/HypothesisArenaContent'
import { HypothesisList } from '@/cognitive-os/components/HypothesisList'
import { canSubmit, createInitialState, transition } from '@/cognitive-os/engine'
import { formatPercent, formatPoints } from '@/cognitive-os/format'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import type { ChallengeAction, ChallengeState } from '@/cognitive-os/types'

const definition = arenaChallenge

const SOURCE_LABELS: Record<ActivationSource, string> = {
  organic: 'Organic',
  paid_search: 'Paid search',
  social: 'Social',
  email: 'Email',
}

function evidenceCoverage(state: ChallengeState, ids: string[]): number {
  const total = definition.evidence
    .filter((item) => ids.includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0)
  const inspected = definition.evidence
    .filter((item) => ids.includes(item.id) && state.inspected.includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0)
  return total === 0 ? 0 : inspected / total
}

export function HypothesisArenaPage() {
  useDocumentMeta(
    'Hypothesis Arena — Cognitive OS — Tejas Parjane',
    'A deterministic, browser-only challenge: compare explanations for an activation decline, choose experiments by expected information gain within a budget, and update your beliefs from the results.',
  )

  const [state, dispatch] = useReducer(
    (current: ChallengeState, action: ChallengeAction) => transition(current, action, definition),
    definition,
    createInitialState,
  )

  const view = useMemo(
    () =>
      buildHypothesisArenaView({
        source: state.filters.source ?? 'all',
        experimentsRun: state.experimentsRun,
      }),
    [state.filters.source, state.experimentsRun],
  )

  const canSubmitNow = canSubmit(state, definition)
  const runs = state.experimentsRun
  const revealedResults = new Set(
    runs.flatMap((id) => arenaExperiments.find((experiment) => experiment.id === id)?.reveals ?? []),
  )
  const resultEvidenceIds = new Set(arenaExperiments.flatMap((experiment) => experiment.reveals))
  const visibleEvidence = definition.evidence.filter(
    (item) => !resultEvidenceIds.has(item.id) || revealedResults.has(item.id),
  )
  const coverage = evidenceCoverage(state, visibleEvidence.map((item) => item.id))
  const recommended = recommendedConfidence(view.profile.maxProbability)
  const notSupported = runs.length === 0
    ? []
    : Object.entries(view.profile.posterior)
        .filter(([, probability]) => probability < 0.12)
        .map(([id]) => id)

  return (
    <>
      <PageHeader
        eyebrow="Cognitive OS · Challenge"
        title="Hypothesis Arena"
        description="Signup-to-activation fell after a release that changed three things at once. Rank experiments by expected information gain, run them within a budget, and decide what the evidence actually supports."
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <FlaskConical aria-hidden="true" className="size-4" />
            {arenaExperiments.length} experiments · budget {arenaMeta.experimentBudget} · seed {arenaMeta.seed}
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
                  <h2 className="text-2xl font-semibold tracking-tight">The problem</h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
                    A release shipped three changes together: a new onboarding client, an activation event schema
                    change, and a session-service cache layer. Right after, the signup-to-activation rate fell from{' '}
                    <span className="text-ink">{formatPercent(view.comparison.baseline.rate)}</span> to{' '}
                    <span className="text-ink">{formatPercent(view.comparison.comparison.rate)}</span>. Signups did
                    not fall. You cannot test everything before the budget runs out, so you must decide which
                    experiment is worth running first.
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">What the data shows</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="surface-card p-4">
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                        Activation change
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {formatPoints(view.comparison.absoluteChange)}
                      </p>
                      <p className="text-xs text-muted">{formatPercent(view.comparison.relativeChange)} relative</p>
                    </div>
                    <div className="surface-card p-4">
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                        Mix component
                      </p>
                      <p className="mt-1 text-xl font-semibold">{formatPoints(view.decomposition.mix)}</p>
                      <p className="text-xs text-muted">shift-share from the source mix</p>
                    </div>
                    <div className="surface-card p-4">
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                        Daily variation
                      </p>
                      <p className="mt-1 text-xl font-semibold">{formatPoints(view.noise.stdDev)}</p>
                      <p className="text-xs text-muted">baseline standard deviation</p>
                    </div>
                    <div className="surface-card p-4">
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                        Signal strength
                      </p>
                      <p className="mt-1 text-xl font-semibold">z = {view.noise.zScore.toFixed(2)}</p>
                      <p className="text-xs text-muted">beyond noise, cause unknown</p>
                    </div>
                  </div>
                  <p className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed">
                    {arenaMeta.disclaimer}
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">The release</h2>
                  <ul className="mt-3 space-y-2">
                    {arenaMeta.releaseNotes.map((line) => (
                      <li
                        key={line}
                        className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-muted"
                      >
                        <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-lime" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              <aside className="space-y-4">
                <div className="surface-card p-5">
                  <p className="section-label">How this is scored</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    The rubric weights evidence selection, correct interpretation, uncertainty handling, and decision
                    consistency. Interpretation rewards a conclusion that follows from the experiments you chose and
                    experiments that were defensible by information per cost at the time &mdash; not the author&rsquo;s
                    intended sequence. It is a designed educational rubric, not a validated measure.
                  </p>
                </div>
                <div className="surface-card p-5">
                  <p className="section-label">Assumptions you start with</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Four explanations carry declared prior probabilities, and each experiment has declared
                    likelihoods. Those assumptions are visible, changeable in principle, and never hidden inside the
                    score.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'NEXT_STEP' })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-ink transition-colors hover:brightness-95"
                >
                  Start investigating
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
                  information value available so far. Running an experiment reveals its result and records it.
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

              <ExperimentList
                definition={definition}
                state={state}
                onRun={(id) => dispatch({ type: 'RUN_EXPERIMENT', id })}
                remainingBudget={view.remainingBudget}
                budget={arenaMeta.experimentBudget}
              />

              <BeliefPanel
                definition={definition}
                profile={view.profile}
                ranking={view.ranking}
                recommended={recommended}
                experimentsRun={runs.length}
              />

              <ChallengeFilters
                definition={definition}
                state={state}
                onChange={dispatch}
                note="Filter the evidence panel by acquisition source (affects what you see, not the score)"
                labelForValue={(_, value) => SOURCE_LABELS[value as ActivationSource] ?? value}
              />

              <ComparisonList
                definition={definition}
                state={state}
                title="Analyses and assumptions"
                onRun={(comparison) => dispatch({ type: 'RUN_COMPARISON', id: comparison.id })}
              />

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Evidence</h2>
                {visibleEvidence.map((item) => (
                  <EvidencePanel
                    key={item.id}
                    item={item}
                    inspected={state.inspected.includes(item.id)}
                    onToggle={() => dispatch({ type: 'INSPECT_EVIDENCE', id: item.id })}
                  >
                    <HypothesisArenaContent id={item.id} view={view} />
                  </EvidencePanel>
                ))}
              </div>

              <HypothesisList
                definition={definition}
                state={state}
                contradicted={notSupported}
                title="Competing explanations"
                note="A status appears once at least one experiment has run: explanations the results make very unlikely are marked. No experiment leaves every explanation live, and that ambiguity is part of the problem."
              />
            </div>
          ) : null}

          {state.step === 'deciding' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Submit your decision</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  Choose the explanation best supported by the experiments you actually ran, set a confidence that
                  matches how much they separated the alternatives, and pick a next action. You must run at least one
                  experiment; the budget is {arenaMeta.experimentBudget} and you have spent{' '}
                  {arenaMeta.experimentBudget - view.remainingBudget}.
                </p>
              </div>
              <DecisionForm
                definition={definition}
                state={state}
                onChange={dispatch}
                canSubmitNow={canSubmitNow}
                primaryLegend="Most likely explanation"
                secondaryLegend="Secondary component (optional)"
                secondaryNoneDescription="The primary explanation accounts for the decline on its own."
                actionLegend="Next action"
                submitLabel="Submit decision"
              />
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
