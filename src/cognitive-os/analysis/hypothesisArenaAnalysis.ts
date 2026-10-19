import {
  ACTIVATION_SOURCES,
  arenaExperiments,
  activationDaily,
  activationSegments,
  EXPERIMENT_OUTCOMES,
  GROUND_TRUTH_OUTCOMES,
  type ActivationDailyRow,
  type ActivationPeriod,
  type ActivationSegmentRow,
  type ActivationSource,
} from '@/cognitive-os/datasets/hypothesisArena'

const ALL = 'all'

export interface ActivationWindowStat {
  signups: number
  activations: number
  rate: number
}

export interface ActivationComparison {
  baseline: ActivationWindowStat
  comparison: ActivationWindowStat
  absoluteChange: number
  relativeChange: number
}

export interface SegmentStat {
  source: ActivationSource
  baseline: ActivationWindowStat
  comparison: ActivationWindowStat
  baselineShare: number
  comparisonShare: number
  rateChange: number
}

export interface ActivationDecomposition {
  mix: number
  rate: number
  interaction: number
  total: number
  mixShare: number
  rateShare: number
  interactionShare: number
}

export interface ActivationNoise {
  dailyRates: number[]
  mean: number
  stdDev: number
  observedChange: number
  zScore: number
  exceedsNoise: boolean
}

function isScopedSource(source: string | undefined): source is ActivationSource {
  return source !== undefined && source !== ALL
}

function stat(rows: ActivationSegmentRow[]): ActivationWindowStat {
  let signups = 0
  let activations = 0
  for (const row of rows) {
    signups += row.signups
    activations += row.activations
  }
  return { signups, activations, rate: signups === 0 ? 0 : activations / signups }
}

export function filteredSegments(source?: string): ActivationSegmentRow[] {
  if (!isScopedSource(source)) return activationSegments
  return activationSegments.filter((row) => row.source === source)
}

export function activationWindow(period: ActivationPeriod, source?: string): ActivationWindowStat {
  return stat(filteredSegments(source).filter((row) => row.period === period))
}

export function activationComparison(source?: string): ActivationComparison {
  const baseline = activationWindow('baseline', source)
  const comparison = activationWindow('comparison', source)
  const absoluteChange = comparison.rate - baseline.rate
  const relativeChange = baseline.rate === 0 ? 0 : absoluteChange / baseline.rate
  return { baseline, comparison, absoluteChange, relativeChange }
}

export function segmentStats(): SegmentStat[] {
  const baseline = activationWindow('baseline')
  const comparison = activationWindow('comparison')
  return ACTIVATION_SOURCES.map((source) => {
    const base = activationWindow('baseline', source)
    const comp = activationWindow('comparison', source)
    return {
      source,
      baseline: base,
      comparison: comp,
      baselineShare: baseline.signups === 0 ? 0 : base.signups / baseline.signups,
      comparisonShare: comparison.signups === 0 ? 0 : comp.signups / comparison.signups,
      rateChange: comp.rate - base.rate,
    }
  })
}

function safeShare(part: number, total: number): number {
  return total === 0 ? 0 : part / total
}

/**
 * Two-way shift-share decomposition of the change in the overall activation
 * rate: change = mix + rate + interaction, using the same definition as the
 * Business Diagnosis challenge.
 */
export function activationDecomposition(): ActivationDecomposition {
  const groups = segmentStats()
  let mix = 0
  let rateEffect = 0
  let interaction = 0
  for (const group of groups) {
    const deltaShare = group.comparisonShare - group.baselineShare
    const deltaRate = group.comparison.rate - group.baseline.rate
    mix += deltaShare * group.baseline.rate
    rateEffect += group.baselineShare * deltaRate
    interaction += deltaShare * deltaRate
  }
  const total = mix + rateEffect + interaction
  return {
    mix,
    rate: rateEffect,
    interaction,
    total,
    mixShare: safeShare(mix, total),
    rateShare: safeShare(rateEffect, total),
    interactionShare: safeShare(interaction, total),
  }
}

/** Daily rows are aggregate over sources in this fixture; a source filter does not reshape them. */
export function dailySeries(period?: ActivationPeriod): ActivationDailyRow[] {
  return activationDaily.filter((row) => (period ? row.period === period : true))
}

export function baselineNoise(): ActivationNoise {
  const rows = activationDaily.filter((row) => row.period === 'baseline')
  const dates = [...new Set(rows.map((row) => row.date))].sort()
  const dailyRates = dates.map((date) => {
    const dayRows = rows.filter((row) => row.date === date)
    const signups = dayRows.reduce((acc, row) => acc + row.signups, 0)
    const activations = dayRows.reduce((acc, row) => acc + row.activations, 0)
    return signups === 0 ? 0 : activations / signups
  })
  const mean = dailyRates.length === 0 ? 0 : dailyRates.reduce((acc, value) => acc + value, 0) / dailyRates.length
  const variance =
    dailyRates.length === 0
      ? 0
      : dailyRates.reduce((acc, value) => acc + (value - mean) ** 2, 0) / dailyRates.length
  const stdDev = Math.sqrt(variance)
  const overall = activationComparison()
  const observedChange = overall.absoluteChange
  const zScore = stdDev === 0 ? 0 : observedChange / stdDev
  return { dailyRates, mean, stdDev, observedChange, zScore, exceedsNoise: Math.abs(zScore) >= 2 }
}

// --- Belief model ------------------------------------------------------------
//
// Priors and likelihoods are documented assumptions, not estimated from the
// activation table. Each hypothesis distributes probability mass over the
// possible outcomes of each experiment; the tables below are asserted to sum to
// one in the test suite.

export const HYPOTHESIS_IDS = ['h-client-defect', 'h-mix-shift', 'h-instrumentation', 'h-latency'] as const
export type HypothesisId = (typeof HYPOTHESIS_IDS)[number]

export const PRIORS: Record<HypothesisId, number> = {
  'h-client-defect': 0.3,
  'h-mix-shift': 0.25,
  'h-instrumentation': 0.2,
  'h-latency': 0.25,
}

/** P(outcome | hypothesis) for every experiment and hypothesis. */
export const LIKELIHOODS: Record<string, Record<HypothesisId, Record<string, number>>> = {
  'run-client-version': {
    'h-client-defect': { 'a-both': 0.15, 'a-new-only': 0.77, 'a-old-only': 0.08 },
    'h-mix-shift': { 'a-both': 0.25, 'a-new-only': 0.45, 'a-old-only': 0.3 },
    'h-instrumentation': { 'a-both': 0.147, 'a-new-only': 0.4, 'a-old-only': 0.453 },
    'h-latency': { 'a-both': 0.25, 'a-new-only': 0.3, 'a-old-only': 0.45 },
  },
  'run-instrumentation-audit': {
    'h-client-defect': { 'b-schema': 0.05, 'b-clean': 0.8, 'b-partial': 0.15 },
    'h-mix-shift': { 'b-schema': 0.08, 'b-clean': 0.75, 'b-partial': 0.17 },
    'h-instrumentation': { 'b-schema': 0.85, 'b-clean': 0.05, 'b-partial': 0.1 },
    'h-latency': { 'b-schema': 0.06, 'b-clean': 0.8, 'b-partial': 0.14 },
  },
  'run-latency-funnel': {
    'h-client-defect': { 'c-uniform': 0.3, 'c-latency-gap': 0.2, 'c-inconclusive': 0.5 },
    'h-mix-shift': { 'c-uniform': 0.35, 'c-latency-gap': 0.2, 'c-inconclusive': 0.45 },
    'h-instrumentation': { 'c-uniform': 0.3, 'c-latency-gap': 0.25, 'c-inconclusive': 0.45 },
    'h-latency': { 'c-uniform': 0.15, 'c-latency-gap': 0.6, 'c-inconclusive': 0.25 },
  },
  'run-rollback': {
    'h-client-defect': { 'd-nochange': 0.2, 'd-partial-recovery': 0.2, 'd-full-recovery': 0.6 },
    'h-mix-shift': { 'd-nochange': 0.5, 'd-partial-recovery': 0.25, 'd-full-recovery': 0.25 },
    'h-instrumentation': { 'd-nochange': 0.45, 'd-partial-recovery': 0.3, 'd-full-recovery': 0.25 },
    'h-latency': { 'd-nochange': 0.55, 'd-partial-recovery': 0.25, 'd-full-recovery': 0.2 },
  },
}

export function experimentCost(experimentId: string): number {
  return arenaExperiments.find((experiment) => experiment.id === experimentId)?.cost ?? 0
}

export function experimentLabel(experimentId: string): string {
  return arenaExperiments.find((experiment) => experiment.id === experimentId)?.label ?? experimentId
}

export function outcomeLabel(experimentId: string, outcomeId: string): string {
  return EXPERIMENT_OUTCOMES[experimentId]?.find((outcome) => outcome.id === outcomeId)?.label ?? outcomeId
}

export function groundTruthOutcome(experimentId: string): string | null {
  return GROUND_TRUTH_OUTCOMES[experimentId] ?? null
}

function normalize(distribution: Record<string, number>): Record<string, number> {
  const total = Object.values(distribution).reduce((acc, value) => acc + value, 0)
  if (total <= 0) {
    const uniform = 1 / HYPOTHESIS_IDS.length
    return Object.fromEntries(HYPOTHESIS_IDS.map((id) => [id, uniform]))
  }
  return Object.fromEntries(Object.entries(distribution).map(([id, value]) => [id, value / total]))
}

export function posteriorFromBeliefs(
  beliefs: Record<string, number>,
  steps: Array<{ experimentId: string; outcomeId: string }>,
): Record<string, number> {
  let current: Record<string, number> = { ...beliefs }
  for (const step of steps) {
    const table = LIKELIHOODS[step.experimentId]
    if (!table) continue
    const next: Record<string, number> = {}
    for (const id of HYPOTHESIS_IDS) {
      const likelihood = table[id]?.[step.outcomeId] ?? 0
      next[id] = (current[id] ?? 0) * likelihood
    }
    current = normalize(next)
  }
  return current
}

export function priorBeliefs(): Record<string, number> {
  return { ...PRIORS }
}

export interface BeliefStep {
  experimentId: string
  outcomeId: string
  posterior: Record<string, number>
}

export interface BeliefProfile {
  prior: Record<string, number>
  posterior: Record<string, number>
  history: BeliefStep[]
  argmax: HypothesisId
  runnerUp: HypothesisId
  maxProbability: number
}

export function beliefProfile(runs: readonly string[], beliefs: Record<string, number> = PRIORS): BeliefProfile {
  const history: BeliefStep[] = []
  let current: Record<string, number> = { ...beliefs }
  for (const experimentId of runs) {
    const outcomeId = GROUND_TRUTH_OUTCOMES[experimentId]
    if (!outcomeId) continue
    current = posteriorFromBeliefs(current, [{ experimentId, outcomeId }])
    history.push({ experimentId, outcomeId, posterior: { ...current } })
  }
  const ordered = [...HYPOTHESIS_IDS].sort((a, b) => (current[b] ?? 0) - (current[a] ?? 0) || a.localeCompare(b))
  const argmax = ordered[0]!
  const runnerUp = ordered[1]!
  return {
    prior: { ...beliefs },
    posterior: { ...current },
    history,
    argmax,
    runnerUp,
    maxProbability: current[argmax] ?? 0,
  }
}

function entropy(distribution: Record<string, number>): number {
  let value = 0
  for (const probability of Object.values(distribution)) {
    if (probability > 0) value -= probability * Math.log2(probability)
  }
  return value
}

/** Expected information gain in bits from running an experiment under `beliefs`. */
export function expectedInformationGain(beliefs: Record<string, number>, experimentId: string): number {
  const table = LIKELIHOODS[experimentId]
  const outcomes = EXPERIMENT_OUTCOMES[experimentId]
  if (!table || !outcomes) return 0
  const priorEntropy = entropy(beliefs)
  let expectedPosteriorEntropy = 0
  for (const outcome of outcomes) {
    const next: Record<string, number> = {}
    for (const id of HYPOTHESIS_IDS) {
      next[id] = (beliefs[id] ?? 0) * (table[id]?.[outcome.id] ?? 0)
    }
    const probability = Object.values(next).reduce((acc, value) => acc + value, 0)
    if (probability <= 0) continue
    expectedPosteriorEntropy += probability * entropy(normalize(next))
  }
  return Math.max(0, priorEntropy - expectedPosteriorEntropy)
}

export interface ExperimentRanking {
  experimentId: string
  eig: number
  cost: number
  informationPerCost: number
}

export function rankExperiments(
  beliefs: Record<string, number>,
  options: { exclude?: readonly string[]; budget?: number } = {},
): ExperimentRanking[] {
  const exclude = new Set(options.exclude ?? [])
  const budget = options.budget ?? Number.POSITIVE_INFINITY
  return arenaExperiments
    .filter((experiment) => !exclude.has(experiment.id) && experiment.cost <= budget)
    .map((experiment) => {
      const eig = expectedInformationGain(beliefs, experiment.id)
      return {
        experimentId: experiment.id,
        eig,
        cost: experiment.cost,
        informationPerCost: experiment.cost === 0 ? eig : eig / experiment.cost,
      }
    })
    .sort((a, b) => b.informationPerCost - a.informationPerCost || a.experimentId.localeCompare(b.experimentId))
}

const RANK_SCORES = [1, 0.85, 0.6, 0.3] as const

export interface DefensibilityRun {
  experimentId: string
  rank: number
  score: number
  informationPerCost: number
}

export interface Defensibility {
  average: number
  runs: DefensibilityRun[]
}

/**
 * Scores each experiment choice against the information-per-cost ranking that
 * was available immediately before it was run. This rewards a defensible choice
 * under the then-current beliefs, not the author's intended sequence.
 */
export function defensibility(runs: readonly string[], budget: number): Defensibility {
  const scored: DefensibilityRun[] = []
  const alreadyRun: string[] = []
  let beliefs = priorBeliefs()
  let remainingBudget = budget
  for (const experimentId of runs) {
    const ranking = rankExperiments(beliefs, { exclude: alreadyRun, budget: remainingBudget })
    const rank = ranking.findIndex((entry) => entry.experimentId === experimentId) + 1
    const entry = ranking.find((item) => item.experimentId === experimentId)
    const score = rank === 0 ? 0.2 : (RANK_SCORES[rank - 1] ?? 0.2)
    scored.push({
      experimentId,
      rank: rank === 0 ? ranking.length + 1 : rank,
      score,
      informationPerCost: entry?.informationPerCost ?? 0,
    })
    alreadyRun.push(experimentId)
    remainingBudget = Math.max(0, remainingBudget - experimentCost(experimentId))
    const outcome = GROUND_TRUTH_OUTCOMES[experimentId]
    if (outcome) beliefs = posteriorFromBeliefs(beliefs, [{ experimentId, outcomeId: outcome }])
  }
  const average = scored.length === 0 ? 0 : scored.reduce((acc, run) => acc + run.score, 0) / scored.length
  return { average, runs: scored }
}

export type RecommendedConfidence = 'very-low' | 'low' | 'medium' | 'high'

export function recommendedConfidence(maxProbability: number): RecommendedConfidence {
  if (maxProbability >= 0.82) return 'high'
  if (maxProbability >= 0.55) return 'medium'
  if (maxProbability >= 0.35) return 'low'
  return 'very-low'
}
