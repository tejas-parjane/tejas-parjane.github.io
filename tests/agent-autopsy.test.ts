import { describe, expect, it } from 'vitest'
import {
  analyseAutopsy,
  answerSupport,
  contextDiff,
  earliestFailure,
  policyAudit,
  retrievalAudit,
  synthesisContext,
  toolAudit,
} from '@/cognitive-os/analysis/agentAutopsyAnalysis'
import {
  agentAutopsyChallenge as definition,
  buildDecisionRecord,
  failurePointOf,
  referenceFindings,
  scoreSubmission,
} from '@/cognitive-os/challenges/agentAutopsy'
import {
  TRACE_ID,
  findTraceEvent,
  knowledgeDocuments,
  traceEvents,
} from '@/cognitive-os/datasets/agentAutopsy'
import {
  ALL_FILTER_VALUE,
  canSubmit,
  createInitialState,
  transition,
  validateState,
} from '@/cognitive-os/engine'
import type { ChallengeAction, ChallengeState } from '@/cognitive-os/types'

function apply(actions: ChallengeAction[], start: ChallengeState = createInitialState(definition)): ChallengeState {
  return actions.reduce((state, action) => transition(state, action, definition), start)
}

const authoritativeDoc = knowledgeDocuments.find((doc) => doc.authoritative)!

describe('trace fixture integrity', () => {
  it('is a fixed, ordered, seed-documented trace', () => {
    expect(TRACE_ID).toBe('agent-autopsy-trace-v1')
    expect(traceEvents.length).toBe(11)
    expect(traceEvents.map((event) => event.seq)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(traceEvents[0]!.id).toBe('ev-01')
    expect(traceEvents.at(-1)!.id).toBe('ev-11')
    expect(traceEvents.at(-1)!.answer!.claims[0]!.valueDays).toBe(60)
    expect(authoritativeDoc.id).toBe('refund-policy-v3')
    expect(authoritativeDoc.statement).toMatch(/30\s*days/)
  })
})

describe('trace analysis recomputed from the fixture', () => {
  it('audits retrieval ranking and freshness', () => {
    const refs = findTraceEvent('ev-04')!.retrievedDocs!
    expect(refs.map((ref) => ref.docId)).toEqual([
      'refund-policy-v2',
      'refund-policy-v3',
      'refund-faq-v1',
    ])

    const audit = retrievalAudit()
    expect(audit.authoritativeDocId).toBe('refund-policy-v3')
    expect(audit.authoritativeRank).toBe(2)
    expect(audit.outdatedRank).toBe(1)
    expect(audit.staleRankedFirst).toBe(true)
    expect(audit.authoritativePresent).toBe(true)
  })

  it('computes the buffer diff that dropped the authoritative document', () => {
    const compaction = findTraceEvent('ev-08')!
    const expectedDropped = compaction.buffer!.bufferBefore.filter(
      (id) => !compaction.buffer!.bufferAfter.includes(id),
    )
    expect(expectedDropped).toContain('refund-policy-v3')

    const diff = contextDiff()
    expect(diff.dropped).toEqual(expectedDropped)
    expect(diff.dropped).toContain('refund-policy-v3')
    expect(diff.droppedAuthoritative).toBe(true)
    expect(diff.after).toEqual(['refund-policy-v2'])
  })

  it('verifies every required step ran', () => {
    const audit = toolAudit()
    expect(audit.requiredSteps).toEqual([
      'search_kb',
      'check_doc_version',
      'policy_check',
      'synthesize',
    ])
    expect(audit.allRequiredCalled).toBe(true)
    expect(audit.missingSteps).toEqual([])
  })

  it('finds the answer contradicts the trace', () => {
    const support = answerSupport()
    expect(support.answerDays).toBe(60)
    expect(support.authoritativeDays).toBe(30)
    expect(support.supported).toBe(false)
    expect(support.contradictsTrace).toBe(true)
    expect(support.citesOutdatedSource).toBe(true)
  })

  it('confirms policy passed and no freshness rule exists', () => {
    const audit = policyAudit()
    expect(audit.allPassed).toBe(true)
    expect(audit.freshnessRuleEnforced).toBe(false)
    expect(audit.checks).toHaveLength(3)
  })

  it('shows synthesis never received conflicting evidence', () => {
    const synthesis = synthesisContext()
    expect(synthesis.contextDocIds).toEqual(['refund-policy-v2'])
    expect(synthesis.conflictPresent).toBe(false)
  })

  it('computes the earliest unrecoverable failure as the compaction event', () => {
    const authId = authoritativeDoc.id
    let expected: string | null = null
    for (const event of traceEvents) {
      if (!event.buffer) continue
      if (event.buffer.bufferBefore.includes(authId) && !event.buffer.bufferAfter.includes(authId)) {
        expected = event.id
        break
      }
    }
    expect(expected).toBe('ev-08')

    const earliest = earliestFailure()
    expect(earliest.eventId).toBe('ev-08')
    expect(earliest.unrecoverable).toBe(true)
  })

  it('marks only the genuinely excluded hypotheses as contradicted', () => {
    const contradicted = analyseAutopsy().contradicted
    expect(contradicted).toEqual(
      expect.arrayContaining(['h-tool-wrong', 'h-policy-failed', 'h-synthesis-ignored']),
    )
    expect(contradicted).not.toContain('h-state-loss')
    expect(contradicted).not.toContain('h-retrieval-stale')
    expect(contradicted).not.toContain('h-unsupported-answer')
  })
})

describe('reference reading', () => {
  it('names the state loss as root cause and retrieval freshness as contributing', () => {
    const reference = referenceFindings()
    expect(reference.primaryHypothesis).toBe('h-state-loss')
    expect(reference.secondaryHypothesis).toBe('h-retrieval-stale')
    expect(reference.confidence).toBe('medium')
    expect(reference.statement).toContain('ev-08')
    expect(reference.facts.some((fact) => fact.includes('ev-08'))).toBe(true)
    expect(reference.assumptions.length).toBeGreaterThan(0)
    expect(reference.uncertainty.length).toBeGreaterThan(0)
  })
})

describe('decision-target engine capability', () => {
  it('initialises a required failure-point target as unselected', () => {
    const state = createInitialState(definition)
    expect(state.targetSelections).toEqual({ 'failure-point': null })
    expect(validateState(state, definition)).toEqual([])
    expect(state.filters.stage).toBe(ALL_FILTER_VALUE)
  })

  it('rejects unknown targets and options but accepts valid ones', () => {
    const unknownGroup = apply([{ type: 'SET_TARGET_SELECTION', group: 'ghost', id: 'ev-08' }])
    expect(unknownGroup.targetSelections).toEqual({ 'failure-point': null })

    const unknownOption = apply([{ type: 'SET_TARGET_SELECTION', group: 'failure-point', id: 'ev-99' }])
    expect(unknownOption.targetSelections['failure-point']).toBeNull()

    const valid = apply([{ type: 'SET_TARGET_SELECTION', group: 'failure-point', id: 'ev-08' }])
    expect(failurePointOf(valid)).toBe('ev-08')
  })

  it('blocks submission until the required failure point is chosen', () => {
    let state = apply([
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-state-loss' },
      { type: 'SET_CONFIDENCE', id: 'medium' },
      { type: 'SET_NEXT_ACTION', id: 'a-fix-compaction' },
    ])
    expect(canSubmit(state, definition)).toBe(false)
    state = transition(state, { type: 'SUBMIT' }, definition)
    expect(state.submitted).toBe(false)

    state = apply([{ type: 'SET_TARGET_SELECTION', group: 'failure-point', id: 'ev-08' }], state)
    expect(canSubmit(state, definition)).toBe(true)
    state = transition(state, { type: 'SUBMIT' }, definition)
    expect(state.submitted).toBe(true)
    expect(state.step).toBe('record')
  })

  it('reports an invalid decision-target selection', () => {
    const invalid = {
      ...createInitialState(definition),
      targetSelections: { 'failure-point': 'ghost' },
    } as ChallengeState
    const problems = validateState(invalid, definition)
    expect(problems.some((problem) => problem.includes('decision target failure-point'))).toBe(true)
  })
})

describe('evidence-dependent scoring', () => {
  const diagnosticActions: ChallengeAction[] = [
    { type: 'RUN_COMPARISON', id: 'c-retrieval' },
    { type: 'RUN_COMPARISON', id: 'c-version' },
    { type: 'RUN_COMPARISON', id: 'c-tool' },
    { type: 'RUN_COMPARISON', id: 'c-context' },
    { type: 'RUN_COMPARISON', id: 'c-support' },
    { type: 'RUN_COMPARISON', id: 'c-policy' },
    { type: 'RUN_COMPARISON', id: 'c-synthesis' },
    { type: 'INSPECT_EVIDENCE', id: 'ev-07' },
    { type: 'INSPECT_EVIDENCE', id: 'ev-08' },
    { type: 'INSPECT_EVIDENCE', id: 'ev-11' },
  ]

  const goodActions: ChallengeAction[] = [
    ...diagnosticActions,
    { type: 'SET_TARGET_SELECTION', group: 'failure-point', id: 'ev-08' },
    { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-state-loss' },
    { type: 'SET_SECONDARY_HYPOTHESIS', id: 'h-retrieval-stale' },
    { type: 'SET_CONFIDENCE', id: 'medium' },
    { type: 'TOGGLE_CAVEAT', id: 'caveat-single-trace' },
    { type: 'TOGGLE_CAVEAT', id: 'caveat-synthetic' },
    { type: 'SET_NEXT_ACTION', id: 'a-fix-compaction' },
  ]

  it('scores a correct, well-evidenced diagnosis as strong', () => {
    const score = scoreSubmission(apply(goodActions))
    expect(score.band).toBe('strong')
    expect(score.total).toBeGreaterThanOrEqual(85)
    expect(score.criteria).toHaveLength(4)
  })

  it('scores a symptom-based, overconfident diagnosis as insufficient', () => {
    const bad = apply([
      { type: 'RUN_COMPARISON', id: 'c-retrieval' },
      { type: 'SET_TARGET_SELECTION', group: 'failure-point', id: 'ev-11' },
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-unsupported-answer' },
      { type: 'SET_CONFIDENCE', id: 'high' },
      { type: 'SET_NEXT_ACTION', id: 'a-fix-policy' },
    ])
    const score = scoreSubmission(bad)
    expect(score.band).toBe('insufficient')
    expect(score.total).toBeLessThan(40)
  })

  it('gates interpretation on inspecting the key evidence', () => {
    const conclusionOnly = apply([
      { type: 'SET_TARGET_SELECTION', group: 'failure-point', id: 'ev-08' },
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-state-loss' },
      { type: 'SET_SECONDARY_HYPOTHESIS', id: 'h-retrieval-stale' },
      { type: 'SET_CONFIDENCE', id: 'medium' },
      { type: 'TOGGLE_CAVEAT', id: 'caveat-single-trace' },
      { type: 'TOGGLE_CAVEAT', id: 'caveat-synthetic' },
      { type: 'SET_NEXT_ACTION', id: 'a-fix-compaction' },
    ])
    const low = scoreSubmission(conclusionOnly).criteria.find((item) => item.id === 'interpretation')!
    const high = scoreSubmission(apply(goodActions)).criteria.find((item) => item.id === 'interpretation')!
    expect(low.score).toBe(0)
    expect(high.score).toBe(1)
  })

  it('changes the fingerprint when the failure locus or evidence changes', () => {
    const base = buildDecisionRecord(apply(goodActions))
    const rerun = buildDecisionRecord(apply(goodActions))
    expect(base.fingerprint).toBe(rerun.fingerprint)
    expect(base.targetSelections['failure-point']).toBe('ev-08')

    const differentLocus = buildDecisionRecord(
      apply([{ type: 'SET_TARGET_SELECTION', group: 'failure-point', id: 'ev-11' }], apply(goodActions)),
    )
    expect(differentLocus.fingerprint).not.toBe(base.fingerprint)
    expect(differentLocus.score.total).toBeLessThan(base.score.total)

    const differentEvidence = buildDecisionRecord(
      apply([{ type: 'INSPECT_EVIDENCE', id: 'ev-04' }], apply(goodActions)),
    )
    expect(differentEvidence.fingerprint).not.toBe(base.fingerprint)
  })

  it('separates facts, assumptions, and uncertainty in the record', () => {
    const record = buildDecisionRecord(apply(goodActions))
    expect(record.reference.facts.length).toBeGreaterThan(0)
    expect(record.reference.assumptions.length).toBeGreaterThan(0)
    expect(record.reference.uncertainty.length).toBeGreaterThan(0)
    expect(record.agreement.primaryMatches).toBe(true)
    expect(record.agreement.notes.some((note) => note.includes('ev-08'))).toBe(true)
  })
})
