import { describe, expect, it } from 'vitest'
import {
  businessDiagnosisChallenge as definition,
  buildDecisionRecord,
  scoreSubmission,
} from '@/cognitive-os/challenges/businessDiagnosis'
import {
  ALL_FILTER_VALUE,
  canEnterStep,
  canSubmit,
  createInitialState,
  computeScore,
  fingerprint,
  transition,
  validateState,
} from '@/cognitive-os/engine'
import type { ChallengeAction, ChallengeState } from '@/cognitive-os/types'

function apply(actions: ChallengeAction[], start: ChallengeState = createInitialState(definition)): ChallengeState {
  return actions.reduce((state, action) => transition(state, action, definition), start)
}

describe('challenge state machine', () => {
  it('starts in the briefing step with all filters unscoped', () => {
    const state = createInitialState(definition)
    expect(state.step).toBe('briefing')
    expect(state.submitted).toBe(false)
    expect(state.filters).toEqual({ source: ALL_FILTER_VALUE, device: ALL_FILTER_VALUE, landingPage: ALL_FILTER_VALUE })
    expect(validateState(state, definition)).toEqual([])
  })

  it('advances and reverses through the ordered steps', () => {
    const investigating = apply([{ type: 'NEXT_STEP' }])
    expect(investigating.step).toBe('investigating')
    expect(apply([{ type: 'PREVIOUS_STEP' }], investigating).step).toBe('briefing')
  })

  it('cannot enter the record step before submitting', () => {
    const state = createInitialState(definition)
    expect(canEnterStep(state, 'record', definition)).toBe(false)
    expect(transition(state, { type: 'GO_TO_STEP', step: 'record' }, definition).step).toBe('briefing')
  })

  it('toggles evidence inspection', () => {
    const inspected = apply([{ type: 'INSPECT_EVIDENCE', id: 'e-by-source' }])
    expect(inspected.inspected).toContain('e-by-source')
    const cleared = transition(inspected, { type: 'INSPECT_EVIDENCE', id: 'e-by-source' }, definition)
    expect(cleared.inspected).not.toContain('e-by-source')
  })

  it('ignores evidence ids it does not know', () => {
    const state = apply([{ type: 'INSPECT_EVIDENCE', id: 'nope' }])
    expect(state.inspected).toHaveLength(0)
  })

  it('running a comparison reveals its evidence and is idempotent', () => {
    const once = apply([{ type: 'RUN_COMPARISON', id: 'c-standardize' }])
    expect(once.ranComparisons).toEqual(['c-standardize'])
    expect(once.inspected).toContain('e-standardized-source')
    const twice = apply([{ type: 'RUN_COMPARISON', id: 'c-standardize' }], once)
    expect(twice.ranComparisons).toEqual(['c-standardize'])
  })

  it('accepts valid filters and rejects unknown filter values', () => {
    const applied = apply([{ type: 'SET_FILTER', dimension: 'device', value: 'mobile' }])
    expect(applied.filters.device).toBe('mobile')
    const rejected = apply([{ type: 'SET_FILTER', dimension: 'device', value: 'watch' }], applied)
    expect(rejected.filters.device).toBe('mobile')
    const unknownDimension = apply([{ type: 'SET_FILTER', dimension: 'channel', value: 'x' }])
    expect(unknownDimension.filters).toEqual(createInitialState(definition).filters)
  })

  it('keeps the primary and secondary hypotheses distinct', () => {
    const primary = apply([{ type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-mix-shift' }])
    expect(primary.primaryHypothesis).toBe('h-mix-shift')
    const rejectedSecondary = apply([{ type: 'SET_SECONDARY_HYPOTHESIS', id: 'h-mix-shift' }], primary)
    expect(rejectedSecondary.secondaryHypothesis).toBeNull()
    const changingPrimary = apply(
      [{ type: 'SET_SECONDARY_HYPOTHESIS', id: 'h-mobile-checkout' }, { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-mobile-checkout' }],
    )
    expect(changingPrimary.primaryHypothesis).toBe('h-mobile-checkout')
    expect(changingPrimary.secondaryHypothesis).toBeNull()
  })

  it('requires a primary conclusion, confidence, and next action before submitting', () => {
    let state = createInitialState(definition)
    expect(canSubmit(state, definition)).toBe(false)

    state = apply([{ type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-mix-shift' }], state)
    state = transition(state, { type: 'SUBMIT' }, definition)
    expect(state.submitted).toBe(false)

    state = apply([{ type: 'SET_CONFIDENCE', id: 'medium' }], state)
    state = transition(state, { type: 'SUBMIT' }, definition)
    expect(state.submitted).toBe(false)

    state = apply([{ type: 'SET_NEXT_ACTION', id: 'a-mobile-test' }], state)
    expect(canSubmit(state, definition)).toBe(true)
    state = transition(state, { type: 'SUBMIT' }, definition)
    expect(state.submitted).toBe(true)
    expect(state.step).toBe('record')
  })

  it('reports invalid states', () => {
    const invalid = {
      ...createInitialState(definition),
      primaryHypothesis: 'ghost',
      secondaryHypothesis: 'ghost',
      confidence: 'sure',
      nextAction: 'vanish',
      filters: { source: 'radio', device: ALL_FILTER_VALUE, landingPage: ALL_FILTER_VALUE },
    } as ChallengeState
    const problems = validateState(invalid, definition)
    expect(problems.some((problem) => problem.includes('primary hypothesis'))).toBe(true)
    expect(problems.some((problem) => problem.includes('confidence'))).toBe(true)
    expect(problems.some((problem) => problem.includes('next action'))).toBe(true)
    expect(problems.some((problem) => problem.includes('filter value'))).toBe(true)
  })

  it('resets to the initial state', () => {
    const dirty = apply([
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-noise' },
      { type: 'INSPECT_EVIDENCE', id: 'e-funnel' },
    ])
    expect(apply([{ type: 'RESET' }], dirty)).toEqual(createInitialState(definition))
  })
})

describe('deterministic scoring', () => {
  const goodActions: ChallengeAction[] = [
    { type: 'RUN_COMPARISON', id: 'c-raw' },
    { type: 'RUN_COMPARISON', id: 'c-source' },
    { type: 'RUN_COMPARISON', id: 'c-standardize' },
    { type: 'RUN_COMPARISON', id: 'c-decompose' },
    { type: 'RUN_COMPARISON', id: 'c-within-source-device' },
    { type: 'RUN_COMPARISON', id: 'c-landing' },
    { type: 'RUN_COMPARISON', id: 'c-noise' },
    { type: 'RUN_COMPARISON', id: 'c-completeness' },
    { type: 'RUN_COMPARISON', id: 'c-device' },
    { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-mix-shift' },
    { type: 'SET_SECONDARY_HYPOTHESIS', id: 'h-mobile-checkout' },
    { type: 'SET_CONFIDENCE', id: 'medium' },
    { type: 'TOGGLE_CAVEAT', id: 'caveat-causality' },
    { type: 'TOGGLE_CAVEAT', id: 'caveat-synthetic' },
    { type: 'SET_NEXT_ACTION', id: 'a-mobile-test' },
  ]

  it('scores a well-supported conclusion as strong', () => {
    const score = scoreSubmission(apply(goodActions))
    expect(score.band).toBe('strong')
    expect(score.total).toBeGreaterThanOrEqual(85)
    expect(score.criteria).toHaveLength(4)
  })

  it('scores a contradicted, overconfident conclusion as insufficient', () => {
    const bad = apply([
      { type: 'RUN_COMPARISON', id: 'c-raw' },
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-noise' },
      { type: 'SET_CONFIDENCE', id: 'high' },
      { type: 'SET_NEXT_ACTION', id: 'a-no-action' },
    ])
    const score = scoreSubmission(bad)
    expect(score.band).toBe('insufficient')
    expect(score.total).toBeLessThan(40)
  })

  it('gates interpretation on inspecting key evidence', () => {
    const conclusionOnly = apply([
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-mix-shift' },
      { type: 'SET_SECONDARY_HYPOTHESIS', id: 'h-mobile-checkout' },
      { type: 'SET_CONFIDENCE', id: 'medium' },
      { type: 'TOGGLE_CAVEAT', id: 'caveat-causality' },
      { type: 'TOGGLE_CAVEAT', id: 'caveat-synthetic' },
      { type: 'SET_NEXT_ACTION', id: 'a-mobile-test' },
    ])
    const withEvidence = apply(goodActions)

    const low = scoreSubmission(conclusionOnly).criteria.find((item) => item.id === 'interpretation')!
    const high = scoreSubmission(withEvidence).criteria.find((item) => item.id === 'interpretation')!
    expect(low.score).toBeLessThan(high.score)
    expect(low.score).toBe(0)
  })

  it('rewards acknowledging uncertainty and penalises high confidence', () => {
    const low = scoreSubmission(apply([...goodActions.filter((a) => a.type !== 'SET_CONFIDENCE'), { type: 'SET_CONFIDENCE', id: 'low' }]))
    const high = scoreSubmission(apply([...goodActions.filter((a) => a.type !== 'SET_CONFIDENCE'), { type: 'SET_CONFIDENCE', id: 'high' }]))
    const lowUncertainty = low.criteria.find((item) => item.id === 'uncertainty')!
    const highUncertainty = high.criteria.find((item) => item.id === 'uncertainty')!
    expect(lowUncertainty.score).toBeGreaterThan(highUncertainty.score)
  })

  it('builds a reproducible decision record with a stable fingerprint', () => {
    const state = apply(goodActions)
    const recordA = buildDecisionRecord(state)
    const recordB = buildDecisionRecord(state)

    expect(recordA.fingerprint).toBe(recordB.fingerprint)
    expect(recordA.score.total).toBe(recordB.score.total)
    expect(recordA.agreement.primaryMatches).toBe(true)
    expect(recordA.reference.facts.length).toBeGreaterThan(0)
    expect(recordA.reference.assumptions.length).toBeGreaterThan(0)
    expect(recordA.reference.uncertainty.length).toBeGreaterThan(0)

    const different = buildDecisionRecord(apply([{ type: 'INSPECT_EVIDENCE', id: 'e-noise' }], state))
    expect(different.fingerprint).not.toBe(recordA.fingerprint)
  })
})

describe('generic engine helpers', () => {
  it('clamps criterion scores and computes a weighted total', () => {
    const score = computeScore(definition, {
      evidence: { score: 2, note: 'over' },
      interpretation: { score: -1, note: 'under' },
      uncertainty: { score: 0.5, note: 'mid' },
      consistency: { score: 1, note: 'full' },
    })
    expect(score.criteria.find((item) => item.id === 'evidence')!.score).toBe(1)
    expect(score.criteria.find((item) => item.id === 'interpretation')!.score).toBe(0)
    expect(score.total).toBe(Math.round((0.3 + 0 + 0.1 + 0.2) * 100))
  })

  it('produces different fingerprints for different inputs', () => {
    const state = createInitialState(definition)
    expect(fingerprint('a', 'd', state, 10)).not.toBe(fingerprint('a', 'd', state, 11))
    expect(fingerprint('a', 'd', state, 10)).toBe(fingerprint('a', 'd', state, 10))
  })
})
