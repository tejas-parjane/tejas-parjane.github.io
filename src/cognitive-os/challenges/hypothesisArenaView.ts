import {
  activationComparison,
  activationDecomposition,
  baselineNoise,
  beliefProfile,
  dailySeries,
  experimentCost,
  rankExperiments,
  segmentStats,
  type ActivationComparison,
  type ActivationDecomposition,
  type ActivationNoise,
  type BeliefProfile,
  type ExperimentRanking,
  type SegmentStat,
} from '@/cognitive-os/analysis/hypothesisArenaAnalysis'
import { arenaMeta, type ActivationDailyRow, type ActivationSource } from '@/cognitive-os/datasets/hypothesisArena'

export interface HypothesisArenaView {
  source: string
  comparison: ActivationComparison
  segments: SegmentStat[]
  decomposition: ActivationDecomposition
  noise: ActivationNoise
  daily: ActivationDailyRow[]
  ranking: ExperimentRanking[]
  beliefs: Record<string, number>
  profile: BeliefProfile
  remainingBudget: number
}

function isSource(value: string): value is ActivationSource {
  return value === 'organic' || value === 'paid_search' || value === 'social' || value === 'email'
}

/** Everything the Hypothesis Arena panels need, scoped to the active filter and runs. */
export function buildHypothesisArenaView(filter: {
  source: string
  experimentsRun: readonly string[]
}): HypothesisArenaView {
  const source = isSource(filter.source) ? filter.source : undefined
  const spent = filter.experimentsRun.reduce((sum, id) => sum + experimentCost(id), 0)
  const remainingBudget = Math.max(0, arenaMeta.experimentBudget - spent)
  const profile = beliefProfile(filter.experimentsRun)
  return {
    source: filter.source,
    comparison: activationComparison(source),
    segments: segmentStats(),
    decomposition: activationDecomposition(),
    noise: baselineNoise(),
    daily: dailySeries(),
    ranking: rankExperiments(profile.posterior, {
      exclude: filter.experimentsRun,
      budget: remainingBudget,
    }),
    beliefs: profile.posterior,
    profile,
    remainingBudget,
  }
}
