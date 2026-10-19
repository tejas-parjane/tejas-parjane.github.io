import { analyseAutopsy } from '@/cognitive-os/analysis/agentAutopsyAnalysis'
import { STAGE_LABELS, TRACE_ID, agentAutopsyMeta, traceEvents } from '@/cognitive-os/datasets/agentAutopsy'
import { clamp01, computeScore, fingerprint, type ScoringInput } from '@/cognitive-os/engine'
import { formatPercent } from '@/cognitive-os/format'
import {
  ENGINE_VERSION,
  type ChallengeDefinition,
  type ChallengeState,
  type DecisionRecord,
  type DecisionScore,
  type Hypothesis,
  type ReferenceFindings,
} from '@/cognitive-os/types'

export const FAILURE_POINT_GROUP = 'failure-point'
export const SYMPTOM_EVENT_ID = 'ev-11'

export const agentAutopsyChallenge: ChallengeDefinition = {
  id: 'agent-autopsy',
  title: 'Agent Autopsy',
  steps: [
    {
      id: 'briefing',
      label: 'Briefing',
      description: 'Read the incident and the trace you will investigate.',
    },
    {
      id: 'investigating',
      label: 'Trace review',
      description: 'Walk the execution timeline, inspect evidence, and run diagnostic comparisons.',
    },
    {
      id: 'deciding',
      label: 'Diagnosis',
      description: 'Name the earliest consequential failure, commit to a root cause, and choose a fix.',
    },
    {
      id: 'record',
      label: 'Incident report',
      description: 'Review your scored diagnosis against the reference reading.',
    },
  ],
  hypotheses: [
    {
      id: 'h-state-loss',
      label: 'State-management loss of evidence',
      statement:
        'A state-management step discarded the correct evidence after it was retrieved, so synthesis never saw it.',
      kind: 'state',
    },
    {
      id: 'h-retrieval-stale',
      label: 'Retrieval returned outdated material',
      statement: 'Retrieval surfaced superseded content and that stale material seeded the final answer.',
      kind: 'retrieval',
    },
    {
      id: 'h-tool-wrong',
      label: 'Wrong tool or skipped step',
      statement: 'The agent selected the wrong tool or skipped a step the plan required.',
      kind: 'tooling',
    },
    {
      id: 'h-synthesis-ignored',
      label: 'Synthesis ignored conflicting evidence',
      statement: 'The model received conflicting documents and preferred the wrong one during synthesis.',
      kind: 'synthesis',
    },
    {
      id: 'h-policy-failed',
      label: 'Policy or permission check failed',
      statement: 'A permission or policy check failed to block an answer the trace does not support.',
      kind: 'policy',
    },
    {
      id: 'h-unsupported-answer',
      label: 'Unsupported final answer (symptom)',
      statement: 'The final answer is inconsistent with the trace that produced it — a downstream symptom, not a cause.',
      kind: 'symptom',
    },
  ],
  evidence: [
    {
      id: 'ev-04',
      title: 'Retrieval ranking and freshness',
      question: 'What did retrieval return, and in what order?',
      method:
        'Shows the ranked snippets from the search_kb result and joins each to the document catalogue to mark current versus superseded.',
      discriminates: ['h-retrieval-stale'],
      weight: 0.1,
    },
    {
      id: 'ev-06',
      title: 'Document-version check result',
      question: 'Which document is authoritative?',
      method: 'Reads the check_doc_version result and reports the current and superseded versions.',
      discriminates: ['h-retrieval-stale', 'h-state-loss'],
      weight: 0.12,
    },
    {
      id: 'ev-07',
      title: 'Evidence buffer before compaction',
      question: 'Was the correct evidence present before compaction?',
      method: 'Reads the buffer contents recorded before the compaction step ran.',
      discriminates: ['h-state-loss'],
      weight: 0.08,
    },
    {
      id: 'ev-08',
      title: 'Context compaction event',
      question: 'What did compaction change, and why?',
      method: 'Reads the compaction event’s before/after buffer state and the dedupe rule it applied.',
      discriminates: ['h-state-loss'],
      weight: 0.14,
    },
    {
      id: 'ev-09',
      title: 'Guardrail and policy check',
      question: 'Did a policy or permission check fail?',
      method: 'Reads the policy_check result and lists the rules that ran and the rules that do not exist.',
      discriminates: ['h-policy-failed'],
      weight: 0.06,
    },
    {
      id: 'ev-10',
      title: 'Synthesis context',
      question: 'What evidence did the synthesizer actually see?',
      method: 'Reads the document ids placed into the synthesis context.',
      discriminates: ['h-synthesis-ignored'],
      weight: 0.08,
    },
    {
      id: 'ev-11',
      title: 'Final answer and citations',
      question: 'What was returned, and is it supported by the trace?',
      method:
        'Compares the answer claim with the authoritative document and lists the citations the response carried.',
      discriminates: ['h-unsupported-answer'],
      weight: 0.06,
    },
    {
      id: 'x-context-diff',
      title: 'Buffer diff across compaction',
      question: 'Which evidence was lost, and was it the authoritative copy?',
      method:
        'Computes the set difference between the buffer before and after compaction and flags whether the authoritative document was dropped.',
      discriminates: ['h-state-loss', 'h-synthesis-ignored'],
      weight: 0.16,
    },
    {
      id: 'x-answer-support',
      title: 'Answer support against the trace',
      question: 'Does the trace support the answer?',
      method: 'Compares the answer value with the authoritative document value.',
      discriminates: ['h-unsupported-answer', 'h-synthesis-ignored'],
      weight: 0.12,
    },
    {
      id: 'x-tool-audit',
      title: 'Required-step audit',
      question: 'Did the agent run every required step?',
      method: 'Checks each step named in the plan against the events that prove it ran.',
      discriminates: ['h-tool-wrong'],
      weight: 0.08,
    },
  ],
  comparisons: [
    {
      id: 'c-retrieval',
      label: 'Audit retrieval ranking and freshness',
      description: 'List the ranked snippets and mark which are current.',
      reveals: ['ev-04'],
    },
    {
      id: 'c-version',
      label: 'Confirm the authoritative version',
      description: 'Read the version check to see which document is current.',
      reveals: ['ev-06'],
    },
    {
      id: 'c-tool',
      label: 'Audit the required step sequence',
      description: 'Verify every required step actually ran.',
      reveals: ['x-tool-audit'],
    },
    {
      id: 'c-context',
      label: 'Diff the buffer across compaction',
      description: 'Compare the evidence buffer before and after compaction.',
      reveals: ['x-context-diff'],
    },
    {
      id: 'c-support',
      label: 'Check the answer against the trace',
      description: 'Compare the answer claim with the authoritative document.',
      reveals: ['x-answer-support'],
    },
    {
      id: 'c-policy',
      label: 'Audit the guardrail policy checks',
      description: 'List which policy checks ran and passed.',
      reveals: ['ev-09'],
    },
    {
      id: 'c-synthesis',
      label: 'Inspect the synthesis context',
      description: 'Show what evidence reached the synthesizer.',
      reveals: ['ev-10'],
    },
  ],
  filters: [
    {
      id: 'stage',
      label: 'Pipeline stage',
      values: ['planning', 'retrieval', 'state', 'governance', 'synthesis'],
    },
  ],
  confidenceOptions: [
    { id: 'very-low', label: 'Very low', description: 'The trace barely constrains the cause.' },
    { id: 'low', label: 'Low', description: 'Suggestive but incomplete trace evidence.' },
    { id: 'medium', label: 'Medium', description: 'The trace localises the failure and separates cause from symptom.' },
    { id: 'high', label: 'High', description: 'The trace proves this is the only possible cause in production.' },
  ],
  nextActionOptions: [
    {
      id: 'a-fix-compaction',
      label: 'Fix compaction to preserve authoritative evidence, with a regression test',
      description:
        'Retain the current version per document family during compaction and add a regression test asserting the answer cites the authoritative document.',
      consistentWith: ['h-state-loss'],
      tradeoffs:
        'Requires changing how evidence is keyed and re-running stored traces — broader than a one-line patch.',
    },
    {
      id: 'a-fix-retrieval-rerank',
      label: 'Add freshness filtering or reranking to retrieval',
      description: 'Prefer current documents when ranking search results.',
      consistentWith: ['h-retrieval-stale'],
      tradeoffs:
        'Improves ranking, but the current document was already retrieved; ranking alone would not have prevented the loss.',
    },
    {
      id: 'a-fix-synthesis',
      label: 'Instruct synthesis to prefer the newest document version',
      description: 'Add a synthesis-prompt rule to prefer the most recent version.',
      consistentWith: ['h-synthesis-ignored'],
      tradeoffs: 'The synthesizer never received the current version, so this cannot fix the observed loss.',
    },
    {
      id: 'a-fix-policy',
      label: 'Add a freshness or citation assertion to the output policy',
      description: 'Block answers that cannot be tied to a current source.',
      consistentWith: ['h-policy-failed'],
      tradeoffs:
        'A useful backstop, but it catches the symptom downstream and leaves the buffer bug in place for other queries.',
    },
    {
      id: 'a-change-tools',
      label: 'Change the tool sequence',
      description: 'Reorder or replace the tools the plan selected.',
      consistentWith: ['h-tool-wrong'],
      tradeoffs: 'Every required step already ran; a different sequence would not restore dropped evidence.',
    },
    {
      id: 'a-collect-more',
      label: 'Collect more telemetry before acting',
      description: 'Defer the fix until more traces are available.',
      consistentWith: [],
      tradeoffs: 'Reduces uncertainty about frequency but delays a fix the trace already localises.',
    },
  ],
  caveats: [
    {
      id: 'caveat-single-trace',
      label: 'A single replayed trace cannot establish how often this failure occurs in production.',
      kind: 'limitation',
      required: true,
    },
    {
      id: 'caveat-synthetic',
      label: 'The trace is a synthetic fixture; tool names and payloads are illustrative, not a real recording.',
      kind: 'scope',
      required: true,
    },
    {
      id: 'caveat-replay',
      label: 'The replay records buffer state before and after compaction, not every intermediate mutation.',
      kind: 'limitation',
      required: false,
    },
    {
      id: 'caveat-generated',
      label: 'Latencies and token counts are documented synthetic values, not measurements.',
      kind: 'scope',
      required: false,
    },
  ],
  decisionTargets: [
    {
      id: FAILURE_POINT_GROUP,
      label: 'Earliest consequential failure',
      description:
        'Pick the first event after which the outcome could no longer be recovered — not the final visible error.',
      required: true,
      options: traceEvents.map((event) => ({
        id: event.id,
        label: `${event.at} · ${event.summary}`,
        description: `Event #${event.seq} · ${event.actor} · ${STAGE_LABELS[event.stage]}`,
      })),
    },
  ],
  keyEvidence: ['ev-06', 'ev-08', 'x-context-diff', 'x-answer-support'],
  weights: { evidence: 0.3, interpretation: 0.3, uncertainty: 0.2, consistency: 0.2 },
}

let cachedFindings: ReferenceFindings | null = null

export function referenceFindings(): ReferenceFindings {
  if (cachedFindings) return cachedFindings
  const analysis = analyseAutopsy()
  const { retrieval, context, tools, answer, policy, synthesis, earliest } = analysis

  const outdated = retrieval.docs.find((doc) => doc.supersededOn !== null)

  const facts = [
    `The plan named ${tools.requiredSteps.length} required steps (${tools.requiredSteps.join(
      ', ',
    )}) and all ${tools.steps.length} ran in order.`,
    `Retrieval returned ${retrieval.docs.length} snippets: the superseded ${outdated?.docId ?? 'older document'} ranked #${
      retrieval.outdatedRank ?? '—'
    } and the current ${retrieval.authoritativeDocId ?? 'current document'} ranked #${retrieval.authoritativeRank ?? '—'}.`,
    `The version check confirmed ${retrieval.authoritativeDocId} is current (${
      answer.authoritativeDays ?? '—'
    }-day window) and ${outdated?.docId} was superseded on ${outdated?.supersededOn ?? '—'}.`,
    `The evidence buffer contained the current chunk before compaction and lost ${
      context.dropped.join(', ') || 'nothing'
    }, leaving [${context.after.join(', ')}].`,
    `The synthesis context held only [${synthesis.contextDocIds.join(', ')}], so no conflicting version reached synthesis.`,
    `The final answer stated ${answer.answerDays ?? '—'} days against the authoritative ${
      answer.authoritativeDays ?? '—'
    } days, and cited ${answer.citations.join(', ') || 'no sources'}.`,
    `The policy check ran ${policy.checks.length} checks and all passed; no rule asserted source freshness.`,
    `The earliest point after which the authoritative evidence was never restored is ${
      earliest.eventId ?? 'undefined'
    } (#${earliest.seq ?? '—'}).`,
  ]

  const assumptions = [
    'The trace is a complete, ordered record of the request: events not present did not occur.',
    'The document catalogue accurately reflects which policy version is current.',
    'Tool outputs are deterministic, so the same inputs reproduce this same trace.',
  ]

  const uncertainty = [
    'A single trace cannot show how often the compaction bug fires, or which other queries it corrupts.',
    'The replay records buffer state at step boundaries, so an intermediate restoration cannot be fully ruled out by this trace alone.',
    'The trace is synthetic; the failure is designed to be inspectable, not sampled from a real system.',
    'The trace shows what the synthesis context contained, not the model’s full reasoning, so claims about the model beyond what synthesis saw are not supported.',
  ]

  cachedFindings = {
    primaryHypothesis: 'h-state-loss',
    secondaryHypothesis: retrieval.staleRankedFirst ? 'h-retrieval-stale' : null,
    confidence: 'medium',
    statement: `The earliest consequential failure is ${earliest.eventId} (#${earliest.seq}): context compaction kept the first version per document family and dropped the current policy chunk before synthesis. Retrieval ranking the superseded document first is a contributing factor, but the retrieval set already contained the correct document and the version check confirmed it — so the loss, not retrieval alone, is the root cause. The final wrong answer is a downstream symptom.`,
    facts,
    assumptions,
    uncertainty,
  }
  return cachedFindings
}

function labelFor(hypothesisId: string): string {
  return (
    agentAutopsyChallenge.hypotheses.find((hypothesis: Hypothesis) => hypothesis.id === hypothesisId)?.label ??
    hypothesisId
  )
}

function evidenceCoverage(state: ChallengeState): number {
  const total = agentAutopsyChallenge.evidence.reduce((sum, item) => sum + item.weight, 0)
  const inspected = agentAutopsyChallenge.evidence
    .filter((item) => state.inspected.includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0)
  return total === 0 ? 0 : inspected / total
}

function keyEvidenceCoverage(state: ChallengeState): number {
  const keys = agentAutopsyChallenge.keyEvidence
  if (keys.length === 0) return 1
  return keys.filter((id) => state.inspected.includes(id)).length / keys.length
}

export function failurePointOf(state: ChallengeState): string | null {
  return state.targetSelections[FAILURE_POINT_GROUP] ?? null
}

export function scoreSubmission(state: ChallengeState): DecisionScore {
  const analysis = analyseAutopsy()
  const reference = referenceFindings()

  const coverage = evidenceCoverage(state)
  const keyCoverage = keyEvidenceCoverage(state)
  const evidenceNote = `${state.inspected.length} of ${
    agentAutopsyChallenge.evidence.length
  } evidence panels inspected (${formatPercent(coverage, 0)} of the designed information value).`

  const primaryMatch = state.primaryHypothesis === reference.primaryHypothesis
  const secondaryMatch =
    reference.secondaryHypothesis === null
      ? state.secondaryHypothesis === null
      : state.secondaryHypothesis === reference.secondaryHypothesis
  const secondaryScore = secondaryMatch ? 1 : state.secondaryHypothesis === null ? 0.3 : 0.4

  const failurePoint = failurePointOf(state)
  const rootId = analysis.rootCauseEventId
  const locusScore =
    failurePoint === null ? 0 : failurePoint === rootId ? 1 : failurePoint === SYMPTOM_EVENT_ID ? 0.15 : 0.4

  const contradictedPrimary = analysis.contradicted.includes(state.primaryHypothesis ?? '')
  const rawInterpretation =
    0.45 * (primaryMatch ? 1 : 0) +
    0.15 * secondaryScore +
    0.4 * locusScore -
    (contradictedPrimary ? 0.15 : 0)
  const interpretationScore = clamp01(rawInterpretation * keyCoverage)
  const interpretationNote = primaryMatch
    ? `Primary cause matches the reference (${labelFor(reference.primaryHypothesis)}). Failure locus ${
        failurePoint === rootId
          ? 'matches the computed earliest consequential failure'
          : `differs from the computed earliest failure (${rootId})`
      }; secondary ${
        reference.secondaryHypothesis ? (secondaryMatch ? 'component acknowledged' : 'component missed') : 'not required'
      }. Gated by key-evidence coverage of ${formatPercent(keyCoverage, 0)}.`
    : `Primary cause does not match the reference (${labelFor(reference.primaryHypothesis)})${
        contradictedPrimary ? ' and is contradicted by the inspected trace' : ''
      }. Gated by key-evidence coverage of ${formatPercent(keyCoverage, 0)}.`

  const confidenceScore =
    state.confidence === 'low' || state.confidence === 'medium'
      ? 1
      : state.confidence === 'very-low'
        ? 0.7
        : state.confidence === 'high'
          ? 0.35
          : 0
  const requiredCaveats = agentAutopsyChallenge.caveats.filter((caveat) => caveat.required)
  const acknowledgedRequired = requiredCaveats.filter((caveat) =>
    state.acknowledgedCaveats.includes(caveat.id),
  ).length
  const caveatScore = requiredCaveats.length === 0 ? 1 : acknowledgedRequired / requiredCaveats.length
  const uncertaintyScore = clamp01(0.5 * confidenceScore + 0.5 * caveatScore)
  const uncertaintyNote = `Confidence "${state.confidence ?? 'none'}", and ${acknowledgedRequired} of ${
    requiredCaveats.length
  } required caveats acknowledged. ${
    state.confidence === 'high'
      ? 'A single replay cannot support certainty about production behaviour.'
      : 'Cautious confidence is appropriate for one trace.'
  }`

  const action = agentAutopsyChallenge.nextActionOptions.find((option) => option.id === state.nextAction)
  const actionScore =
    action === undefined
      ? 0
      : action.consistentWith?.includes(state.primaryHypothesis ?? '')
        ? 1
        : action.id === 'a-collect-more'
          ? 0.7
          : 0.3
  const overconfident = state.confidence === 'high' && coverage < 0.75
  const consistencyScore = clamp01(0.6 * actionScore + 0.4 * (overconfident ? 0.2 : 1))
  const consistencyNote = action
    ? `Fix "${action.label}" is ${
        action.consistentWith?.includes(state.primaryHypothesis ?? '') ? 'consistent' : 'weakly linked'
      } with the stated root cause.`
    : 'No fix selected.'

  const input: ScoringInput = {
    evidence: { score: coverage, note: evidenceNote },
    interpretation: { score: interpretationScore, note: interpretationNote },
    uncertainty: { score: uncertaintyScore, note: uncertaintyNote },
    consistency: { score: consistencyScore, note: consistencyNote },
  }
  return computeScore(agentAutopsyChallenge, input)
}

export function buildDecisionRecord(state: ChallengeState): DecisionRecord {
  const reference = referenceFindings()
  const analysis = analyseAutopsy()
  const score = scoreSubmission(state)
  const primaryMatches = state.primaryHypothesis === reference.primaryHypothesis
  const secondaryMatches =
    reference.secondaryHypothesis === null
      ? state.secondaryHypothesis === null
      : state.secondaryHypothesis === reference.secondaryHypothesis

  const failurePoint = failurePointOf(state)
  const locusMatches = failurePoint === analysis.rootCauseEventId

  const notes: string[] = []
  if (primaryMatches) notes.push('Your root cause matches the reference reading (state-management loss of evidence).')
  else notes.push(`The reference reading treats "${labelFor(reference.primaryHypothesis)}" as the root cause.`)
  notes.push(
    locusMatches
      ? `Your earliest consequential failure matches the computed locus (${analysis.rootCauseEventId}).`
      : `The computed earliest consequential failure is ${analysis.rootCauseEventId}; you selected ${
          failurePoint ?? 'none'
        }.`,
  )
  if (reference.secondaryHypothesis !== null) {
    notes.push(
      secondaryMatches
        ? 'You also captured the contributing retrieval-freshness factor.'
        : 'The reference reading identifies a contributing retrieval-freshness factor you did not select.',
    )
  }

  return {
    challengeId: agentAutopsyChallenge.id,
    datasetId: TRACE_ID,
    engineVersion: ENGINE_VERSION,
    fingerprint: fingerprint(agentAutopsyChallenge.id, TRACE_ID, state, score.total),
    submittedPrimary: state.primaryHypothesis,
    submittedSecondary: state.secondaryHypothesis,
    confidence: state.confidence,
    nextAction: state.nextAction,
    acknowledgedCaveats: [...state.acknowledgedCaveats],
    targetSelections: { ...state.targetSelections },
    inspectedEvidence: [...state.inspected],
    ranComparisons: [...state.ranComparisons],
    filters: { ...state.filters },
    score,
    agreement: { primaryMatches, secondaryMatches, notes },
    reference,
  }
}

export function traceEventCount(): number {
  return agentAutopsyMeta.events
}
