import { describe, expect, it } from 'vitest'
import {
  ARENA_DATASET_ID,
  ARENA_SEED,
  EXPERIMENT_OUTCOMES,
  GROUND_TRUTH_OUTCOMES,
  activationDaily,
  activationSegments,
  arenaExperiments,
} from '@/cognitive-os/datasets/hypothesisArena'
import {
  HYPOTHESIS_IDS,
  LIKELIHOODS,
  PRIORS,
  activationComparison,
  activationDecomposition,
  baselineNoise,
  beliefProfile,
  defensibility,
  expectedInformationGain,
  posteriorFromBeliefs,
  rankExperiments,
  recommendedConfidence,
  segmentStats,
} from '@/cognitive-os/analysis/hypothesisArenaAnalysis'
import {
  arenaChallenge as definition,
  buildDecisionRecord,
  referenceFindings,
  scoreSubmission,
} from '@/cognitive-os/challenges/hypothesisArena'
import { buildHypothesisArenaView } from '@/cognitive-os/challenges/hypothesisArenaView'
import {
  ALL_FILTER_VALUE,
  canSubmit,
  createInitialState,
  experimentCost,
  transition,
  validateState,
} from '@/cognitive-os/engine'
import type { ChallengeAction, ChallengeState } from '@/cognitive-os/types'

function apply(actions: ChallengeAction[], start: ChallengeState = createInitialState(definition)): ChallengeState {
  return actions.reduce((state, action) => transition(state, action, definition), start)
}

describe('activation fixture integrity', () => {
  it('is a fixed, seeded dataset with exact aggregate totals', () => {
    expect(ARENA_DATASET_ID).toBe('activation-decline-v1')
    expect(ARENA_SEED).toBe(20250311)
    const baseline = activationSegments.filter((row) => row.period === 'baseline')
    const comparison = activationSegments.filter((row) => row.period === 'comparison')
    expect(baseline.reduce((acc, row) => acc + row.signups, 0)).toBe(25000)
    expect(baseline.reduce((acc, row) => acc + row.activations, 0)).toBe(10310)
    expect(comparison.reduce((acc, row) => acc + row.signups, 0)).toBe(27000)
    expect(comparison.reduce((acc, row) => acc + row.activations, 0)).toBe(9405)
  })

  it('generates daily rows that sum back to the aggregates', () => {
    for (const period of ['baseline', 'comparison'] as const) {
      const daily = activationDaily.filter((row) => row.period === period)
      const scoped = activationSegments.filter((row) => row.period === period)
      expect(daily.reduce((acc, row) => acc + row.signups, 0)).toBe(
        scoped.reduce((acc, row) => acc + row.signups, 0),
      )
      expect(daily.reduce((acc, row) => acc + row.activations, 0)).toBe(
        scoped.reduce((acc, row) => acc + row.activations, 0),
      )
    }
  })

  it('documents an outcome for every experiment and a ground truth in range', () => {
    for (const experiment of arenaExperiments) {
      const outcomes = EXPERIMENT_OUTCOMES[experiment.id]
      expect(outcomes).toBeTruthy()
      expect(outcomes!.length).toBeGreaterThan(1)
      const truth = GROUND_TRUTH_OUTCOMES[experiment.id]
      expect(truth).toBeTruthy()
      expect(outcomes!.some((outcome) => outcome.id === truth)).toBe(true)
    }
  })
})

describe('belief model assumptions', () => {
  it('priors sum to one over the hypotheses', () => {
    const total = HYPOTHESIS_IDS.reduce((acc, id) => acc + PRIORS[id], 0)
    expect(total).toBeCloseTo(1, 10)
  })

  it('every hypothesis distributes probability over each experiment outcomes', () => {
    for (const experiment of arenaExperiments) {
      const table = LIKELIHOODS[experiment.id]!
      const outcomeIds = EXPERIMENT_OUTCOMES[experiment.id]!.map((outcome) => outcome.id)
      for (const hypothesis of HYPOTHESIS_IDS) {
        const distribution = table[hypothesis]!
        const sum = outcomeIds.reduce((acc, id) => acc + (distribution[id] ?? 0), 0)
        expect(sum).toBeCloseTo(1, 10)
        for (const id of outcomeIds) expect(distribution[id]).toBeGreaterThan(0)
      }
    }
  })
})

describe('activation analysis recomputed from the fixture', () => {
  it('reports the designed decline', () => {
    const comparison = activationComparison()
    expect(comparison.baseline.rate).toBeCloseTo(0.4124, 3)
    expect(comparison.comparison.rate).toBeCloseTo(0.3483, 3)
    expect(comparison.absoluteChange).toBeCloseTo(-0.0641, 3)
    expect(comparison.relativeChange).toBeCloseTo(-0.155, 2)
  })

  it('attributes a small, computed share to the source mix', () => {
    const decomposition = activationDecomposition()
    expect(decomposition.mix).toBeCloseTo(-0.0104, 3)
    expect(decomposition.total).toBeCloseTo(-0.0641, 3)
    expect(decomposition.rate).toBeLessThan(decomposition.mix)
  })

  it('shows the social share rising and social activating lower', () => {
    const segments = segmentStats()
    const social = segments.find((segment) => segment.source === 'social')!
    expect(social.baselineShare).toBeCloseTo(0.22, 2)
    expect(social.comparisonShare).toBeCloseTo(0.31, 2)
    expect(social.baseline.rate).toBeLessThan(
      segments.find((segment) => segment.source === 'organic')!.baseline.rate,
    )
  })

  it('finds the change exceeds baseline daily noise', () => {
    const noise = baselineNoise()
    expect(noise.stdDev).toBeGreaterThan(0.01)
    expect(noise.stdDev).toBeLessThan(0.03)
    expect(noise.zScore).toBeLessThan(-2)
    expect(noise.exceedsNoise).toBe(true)
  })
})

describe('Bayesian updating and information value', () => {
  it('starts from the documented priors', () => {
    const profile = beliefProfile([])
    expect(profile.posterior).toEqual(PRIORS)
    expect(profile.argmax).toBe('h-client-defect')
  })

  it('lands on the designed posterior after the audit and client holdback', () => {
    const profile = beliefProfile(['run-instrumentation-audit', 'run-client-version'])
    expect(profile.posterior['h-instrumentation']).toBeCloseTo(0.6946, 2)
    expect(profile.posterior['h-mix-shift']).toBeCloseTo(0.1388, 2)
    expect(profile.posterior['h-latency']).toBeCloseTo(0.1042, 2)
    expect(profile.posterior['h-client-defect']).toBeCloseTo(0.0625, 2)
    expect(profile.argmax).toBe('h-instrumentation')
    expect(profile.runnerUp).toBe('h-mix-shift')
  })

  it('updates only through documented likelihoods and is order-sensitive in the record', () => {
    const forward = posteriorFromBeliefs(PRIORS, [
      { experimentId: 'run-instrumentation-audit', outcomeId: 'b-schema' },
      { experimentId: 'run-client-version', outcomeId: 'a-both' },
    ])
    const profile = beliefProfile(['run-instrumentation-audit', 'run-client-version'])
    expect(profile.posterior['h-instrumentation']).toBeCloseTo(forward['h-instrumentation']!, 10)
  })

  it('ranks experiments by expected information per cost', () => {
    const ranking = rankExperiments(PRIORS)
    expect(ranking.map((entry) => entry.experimentId)).toEqual([
      'run-instrumentation-audit',
      'run-client-version',
      'run-latency-funnel',
      'run-rollback',
    ])
    for (const entry of ranking) {
      expect(entry.eig).toBeCloseTo(expectedInformationGain(PRIORS, entry.experimentId), 10)
      expect(entry.informationPerCost).toBeCloseTo(entry.eig / entry.cost, 10)
    }
  })

  it('recomputes the ranking after a result narrows the field', () => {
    const afterAudit = posteriorFromBeliefs(PRIORS, [
      { experimentId: 'run-instrumentation-audit', outcomeId: 'b-schema' },
    ])
    const ranking = rankExperiments(afterAudit, { exclude: ['run-instrumentation-audit'] })
    expect(ranking[0]!.experimentId).not.toBe('run-instrumentation-audit')
    expect(ranking.some((entry) => entry.experimentId === 'run-instrumentation-audit')).toBe(false)
  })

  it('only ranks experiments the remaining budget can afford', () => {
    const ranking = rankExperiments(PRIORS, { budget: 2 })
    expect(ranking.every((entry) => entry.cost <= 2)).toBe(true)
    expect(ranking.some((entry) => entry.experimentId === 'run-rollback')).toBe(false)
  })

  it('maps posterior strength to a recommended confidence without forcing certainty', () => {
    expect(recommendedConfidence(0.3)).toBe('very-low')
    expect(recommendedConfidence(0.4)).toBe('low')
    expect(recommendedConfidence(0.6946)).toBe('medium')
    expect(recommendedConfidence(0.9)).toBe('high')
  })
})

describe('experiment defensibility', () => {
  it('rewards information per cost at the time of choice, not the intended sequence', () => {
    const best = defensibility(
      ['run-instrumentation-audit', 'run-latency-funnel'],
      definition.budget ?? 5,
    )
    expect(best.average).toBeGreaterThan(0.9)

    const worst = defensibility(['run-rollback'], definition.budget ?? 5)
    expect(worst.average).toBeLessThan(0.5)
  })

  it('does not punish a cheap second choice that the updated beliefs justify', () => {
    const ordered = defensibility(['run-client-version', 'run-instrumentation-audit'], definition.budget ?? 5)
    expect(ordered.average).toBeGreaterThan(0.7)
  })
})

describe('challenge state machine with experiments', () => {
  it('starts with no experiments run and passes validation', () => {
    const state = createInitialState(definition)
    expect(state.experimentsRun).toEqual([])
    expect(validateState(state, definition)).toEqual([])
  })

  it('running an experiment reveals its evidence and is idempotent', () => {
    const once = apply([{ type: 'RUN_EXPERIMENT', id: 'run-instrumentation-audit' }])
    expect(once.experimentsRun).toEqual(['run-instrumentation-audit'])
    expect(once.inspected).toContain('ev-result-audit')
    const twice = apply([{ type: 'RUN_EXPERIMENT', id: 'run-instrumentation-audit' }], once)
    expect(twice.experimentsRun).toEqual(['run-instrumentation-audit'])
  })

  it('ignores unknown experiments', () => {
    const state = apply([{ type: 'RUN_EXPERIMENT', id: 'run-nonsense' }])
    expect(state.experimentsRun).toEqual([])
  })

  it('refuses experiments that exceed the declared budget', () => {
    const state = apply([
      { type: 'RUN_EXPERIMENT', id: 'run-instrumentation-audit' },
      { type: 'RUN_EXPERIMENT', id: 'run-rollback' },
    ])
    expect(state.experimentsRun).toEqual(['run-instrumentation-audit'])
    expect(experimentCost(definition, state.experimentsRun)).toBeLessThanOrEqual(definition.budget ?? 5)
  })

  it('requires at least one experiment before submitting', () => {
    const withoutExperiment = createInitialState(definition)
    expect(canSubmit(withoutExperiment, definition)).toBe(false)

    const ready = apply([
      { type: 'RUN_EXPERIMENT', id: 'run-instrumentation-audit' },
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-instrumentation' },
      { type: 'SET_CONFIDENCE', id: 'medium' },
      { type: 'SET_NEXT_ACTION', id: 'a-fix-instrumentation' },
    ])
    expect(canSubmit(ready, definition)).toBe(true)
  })

  it('reports invalid experiment states', () => {
    const invalid = {
      ...createInitialState(definition),
      experimentsRun: ['ghost', 'ghost'],
    } as ChallengeState
    const problems = validateState(invalid, definition)
    expect(problems.some((problem) => problem.includes('Unknown experiment'))).toBe(true)
    expect(problems.some((problem) => problem.includes('more than once'))).toBe(true)
  })

  it('keeps a stable, ordered experiment history in the record', () => {
    const state = apply([
      { type: 'RUN_EXPERIMENT', id: 'run-latency-funnel' },
      { type: 'RUN_EXPERIMENT', id: 'run-instrumentation-audit' },
    ])
    const view = buildHypothesisArenaView({ source: ALL_FILTER_VALUE, experimentsRun: state.experimentsRun })
    expect(view.remainingBudget).toBe(0)
    expect(view.ranking).toEqual([])
  })
})

describe('deterministic scoring', () => {
  const goodActions: ChallengeAction[] = [
    { type: 'RUN_COMPARISON', id: 'c-definition' },
    { type: 'RUN_COMPARISON', id: 'c-mix' },
    { type: 'RUN_COMPARISON', id: 'c-release' },
    { type: 'RUN_COMPARISON', id: 'c-noise' },
    { type: 'RUN_COMPARISON', id: 'c-method' },
    { type: 'RUN_COMPARISON', id: 'c-eig' },
    { type: 'RUN_COMPARISON', id: 'c-beliefs' },
    { type: 'RUN_EXPERIMENT', id: 'run-instrumentation-audit' },
    { type: 'RUN_EXPERIMENT', id: 'run-client-version' },
    { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-instrumentation' },
    { type: 'SET_SECONDARY_HYPOTHESIS', id: 'h-mix-shift' },
    { type: 'SET_CONFIDENCE', id: 'medium' },
    { type: 'TOGGLE_CAVEAT', id: 'caveat-observational' },
    { type: 'TOGGLE_CAVEAT', id: 'caveat-synthetic' },
    { type: 'TOGGLE_CAVEAT', id: 'caveat-priors' },
    { type: 'SET_NEXT_ACTION', id: 'a-fix-instrumentation' },
  ]

  it('scores an evidence-following, budget-aware decision as strong', () => {
    const score = scoreSubmission(apply(goodActions))
    expect(score.band).toBe('strong')
    expect(score.total).toBeGreaterThanOrEqual(85)
    expect(score.criteria).toHaveLength(4)
  })

  it('scores a low-value experiment and an unsupported conclusion as insufficient', () => {
    const bad = apply([
      { type: 'RUN_EXPERIMENT', id: 'run-rollback' },
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-client-defect' },
      { type: 'SET_CONFIDENCE', id: 'high' },
      { type: 'SET_NEXT_ACTION', id: 'a-latency-fix' },
    ])
    const score = scoreSubmission(bad)
    expect(score.band).toBe('insufficient')
    expect(score.total).toBeLessThan(40)
  })

  it('gates interpretation on inspecting the belief-model evidence', () => {
    const conclusionOnly = apply([
      { type: 'RUN_EXPERIMENT', id: 'run-instrumentation-audit' },
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-instrumentation' },
      { type: 'SET_CONFIDENCE', id: 'medium' },
      { type: 'SET_NEXT_ACTION', id: 'a-fix-instrumentation' },
    ])
    const withEvidence = apply(goodActions)
    const low = scoreSubmission(conclusionOnly).criteria.find((item) => item.id === 'interpretation')!
    const high = scoreSubmission(withEvidence).criteria.find((item) => item.id === 'interpretation')!
    expect(low.score).toBe(0)
    expect(high.score).toBeGreaterThan(0.9)
  })

  it('does not reward the author’s sequence over a defensible alternative', () => {
    const alt = apply([
      { type: 'RUN_COMPARISON', id: 'c-method' },
      { type: 'RUN_COMPARISON', id: 'c-eig' },
      { type: 'RUN_COMPARISON', id: 'c-beliefs' },
      { type: 'RUN_EXPERIMENT', id: 'run-instrumentation-audit' },
      { type: 'RUN_EXPERIMENT', id: 'run-latency-funnel' },
      { type: 'SET_PRIMARY_HYPOTHESIS', id: 'h-instrumentation' },
      { type: 'SET_CONFIDENCE', id: 'medium' },
      { type: 'SET_NEXT_ACTION', id: 'a-fix-instrumentation' },
    ])
    const score = scoreSubmission(alt)
    expect(score.criteria.find((item) => item.id === 'interpretation')!.score).toBeGreaterThan(0.95)
  })

  it('builds a reproducible decision record with a stable fingerprint', () => {
    const state = apply(goodActions)
    const recordA = buildDecisionRecord(state)
    const recordB = buildDecisionRecord(state)
    expect(recordA.fingerprint).toBe(recordB.fingerprint)
    expect(recordA.experimentsRun).toEqual(['run-instrumentation-audit', 'run-client-version'])
    expect(recordA.agreement.primaryMatches).toBe(true)
    expect(recordA.reference.primaryHypothesis).toBe('h-instrumentation')
    expect(recordA.reference.secondaryHypothesis).toBe('h-mix-shift')
    expect(recordA.reference.facts.length).toBeGreaterThan(0)
    expect(recordA.reference.uncertainty.length).toBeGreaterThan(0)

    const different = buildDecisionRecord(
      apply([{ type: 'INSPECT_EVIDENCE', id: 'ev-segment-mix' }], state),
    )
    expect(different.fingerprint).not.toBe(recordA.fingerprint)
  })

  it('keeps the reference reading computable and self-consistent', () => {
    const reference = referenceFindings()
    expect(reference.confidence).toBe('medium')
    expect(reference.facts.some((fact) => fact.includes('z ='))).toBe(true)
  })
})
