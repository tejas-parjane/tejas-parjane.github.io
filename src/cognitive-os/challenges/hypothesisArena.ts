import {
  activationComparison,
  activationDecomposition,
  baselineNoise,
  beliefProfile,
  defensibility,
  experimentLabel,
  PRIORS,
  recommendedConfidence,
  segmentStats,
  type RecommendedConfidence,
} from '@/cognitive-os/analysis/hypothesisArenaAnalysis'
import {
  ARENA_DATASET_ID,
  EXPERIMENT_OUTCOMES,
  GROUND_TRUTH_OUTCOMES,
  arenaExperiments,
  arenaMeta,
} from '@/cognitive-os/datasets/hypothesisArena'
import { clamp01, computeScore, fingerprint, type ScoringInput } from '@/cognitive-os/engine'
import { formatNumber, formatPercent, formatPoints } from '@/cognitive-os/format'
import {
  ENGINE_VERSION,
  type ChallengeDefinition,
  type ChallengeState,
  type DecisionRecord,
  type DecisionScore,
  type Hypothesis,
  type ReferenceFindings,
} from '@/cognitive-os/types'

export const arenaChallenge: ChallengeDefinition = {
  id: 'hypothesis-arena',
  title: 'Hypothesis Arena',
  steps: [
    {
      id: 'briefing',
      label: 'Briefing',
      description: 'Read the activation decline and the release that preceded it.',
    },
    {
      id: 'investigating',
      label: 'Investigation',
      description:
        'Inspect the data, rank experiments by expected information gain, run experiments within budget, and watch your beliefs update.',
    },
    {
      id: 'deciding',
      label: 'Decision',
      description: 'Commit to the most likely explanation given your own experiments, and set a confidence.',
    },
    {
      id: 'record',
      label: 'Decision record',
      description: 'Review your scored decision against the reference reading.',
    },
  ],
  hypotheses: [
    {
      id: 'h-client-defect',
      label: 'New onboarding client defect',
      statement: 'The shipped onboarding client suppresses activation for users who receive it.',
      kind: 'within-segment',
    },
    {
      id: 'h-mix-shift',
      label: 'Traffic-mix shift',
      statement:
        'A larger share of signups now arrives from sources that activate at a lower rate, pulling the overall rate down.',
      kind: 'composition',
    },
    {
      id: 'h-instrumentation',
      label: 'Activation is undercounted after the schema change',
      statement:
        'The event schema change means some genuine activations are no longer recorded, so the measured rate falls without real behaviour changing as much.',
      kind: 'measurement',
    },
    {
      id: 'h-latency',
      label: 'Slower sessions after the cache change',
      statement: 'The session-service cache change made onboarding slow enough to reduce activation.',
      kind: 'environment',
    },
  ],
  evidence: [
    {
      id: 'ev-activation-definition',
      title: 'Activation definition across the two windows',
      question: 'Is activation counted the same way before and after the release?',
      method:
        'Compares the event rules and required fields in effect in each window and flags any change to what counts as an activation.',
      discriminates: ['h-instrumentation'],
      weight: 0.06,
    },
    {
      id: 'ev-segment-mix',
      title: 'Signup mix and per-source activation',
      question: 'Did the source mix change, and do sources activate at different rates?',
      method: 'Computes signup share and activation rate per acquisition source in each window.',
      discriminates: ['h-mix-shift'],
      weight: 0.1,
    },
    {
      id: 'ev-release-notes',
      title: 'Release notes',
      question: 'What changed, and when?',
      method: 'Lists the shipped changes and their timing relative to the comparison window.',
      discriminates: ['h-client-defect', 'h-instrumentation', 'h-latency'],
      weight: 0.08,
    },
    {
      id: 'ev-baseline-variation',
      title: 'Day-to-day variation before the release',
      question: 'Is the decline larger than ordinary daily variation?',
      method: 'Computes the daily activation rate over the baseline window and its standard deviation.',
      discriminates: ['h-mix-shift', 'h-client-defect'],
      weight: 0.08,
    },
    {
      id: 'ev-experiment-method',
      title: 'How the belief model is defined',
      question: 'Where do the probabilities come from?',
      method:
        'States the documented prior probabilities and the likelihood of each experiment outcome under each hypothesis; both are assumptions, not estimates from this table.',
      discriminates: ['h-client-defect', 'h-mix-shift', 'h-instrumentation', 'h-latency'],
      weight: 0.08,
    },
    {
      id: 'ev-eig-ranking',
      title: 'Expected information gain and cost',
      question: 'Which experiment buys the most certainty per unit of budget?',
      method:
        'Computes the expected information gain (in bits) of each experiment from the current beliefs and divides it by its declared cost.',
      discriminates: ['h-client-defect', 'h-mix-shift', 'h-instrumentation', 'h-latency'],
      weight: 0.12,
    },
    {
      id: 'ev-belief-posterior',
      title: 'Posterior beliefs after your experiments',
      question: 'What do the results imply, given the priors?',
      method:
        'Applies Bayes’ rule with the documented likelihoods after each experiment you run, and reports the resulting probabilities.',
      discriminates: ['h-client-defect', 'h-mix-shift', 'h-instrumentation', 'h-latency'],
      weight: 0.12,
    },
    {
      id: 'ev-result-client',
      title: 'Client holdback result',
      question: 'Is the decline specific to the new client?',
      method: 'Reads the result of holding back the new client for 10% of traffic.',
      discriminates: ['h-client-defect'],
      weight: 0.09,
    },
    {
      id: 'ev-result-audit',
      title: 'Instrumentation audit result',
      question: 'How much of the decline is a counting artifact?',
      method: 'Reads the event-schema replay and its undercount estimate and interval.',
      discriminates: ['h-instrumentation', 'h-mix-shift'],
      weight: 0.12,
    },
    {
      id: 'ev-result-latency',
      title: 'Latency-funnel result',
      question: 'Does activation fall mostly in slow sessions?',
      method: 'Reads activation change by session-latency quartile.',
      discriminates: ['h-latency'],
      weight: 0.07,
    },
    {
      id: 'ev-result-rollback',
      title: 'Rollback result',
      question: 'Does reverting the release restore activation?',
      method: 'Reads activation in the week after a full rollback.',
      discriminates: ['h-client-defect', 'h-instrumentation', 'h-mix-shift'],
      weight: 0.08,
    },
  ],
  comparisons: [
    {
      id: 'c-definition',
      label: 'Compare the activation definition',
      description: 'Check whether the event rules changed between the windows.',
      reveals: ['ev-activation-definition'],
    },
    {
      id: 'c-mix',
      label: 'Break the rate down by source',
      description: 'Compare signup share and activation rate per source.',
      reveals: ['ev-segment-mix'],
    },
    {
      id: 'c-release',
      label: 'Timeline the release changes',
      description: 'Line up the shipped changes against the comparison window.',
      reveals: ['ev-release-notes'],
    },
    {
      id: 'c-noise',
      label: 'Measure baseline day-to-day variation',
      description: 'Compute the baseline daily rate and its spread.',
      reveals: ['ev-baseline-variation'],
    },
    {
      id: 'c-method',
      label: 'State the priors and likelihoods',
      description: 'Read the assumptions behind the belief model.',
      reveals: ['ev-experiment-method'],
    },
    {
      id: 'c-eig',
      label: 'Rank experiments by information per cost',
      description: 'Compute expected information gain for each experiment from current beliefs.',
      reveals: ['ev-eig-ranking'],
    },
    {
      id: 'c-beliefs',
      label: 'Recompute the posterior beliefs',
      description: 'Apply Bayes’ rule with the documented likelihoods after each run.',
      reveals: ['ev-belief-posterior'],
    },
  ],
  filters: [
    {
      id: 'source',
      label: 'Acquisition source',
      values: ['organic', 'paid_search', 'social', 'email'],
    },
  ],
  confidenceOptions: [
    { id: 'very-low', label: 'Very low', description: 'The evidence barely separates the explanations.' },
    { id: 'low', label: 'Low', description: 'The evidence leans one way but remains thin.' },
    { id: 'medium', label: 'Medium', description: 'The evidence favours one explanation while others remain live.' },
    { id: 'high', label: 'High', description: 'The evidence rules out the alternatives.' },
  ],
  nextActionOptions: [
    {
      id: 'a-fix-instrumentation',
      label: 'Fix the activation event and backfill the affected counts',
      description:
        'Restore the previous event semantics, backfill the undercounted activations, and add a schema-compatibility check.',
      consistentWith: ['h-instrumentation'],
      tradeoffs: 'Backfilling depends on the same estimate the audit produced; the correction carries its interval.',
    },
    {
      id: 'a-client-fix',
      label: 'Roll forward a fix to the onboarding client',
      description: 'Patch the client and watch activation for the next cohort.',
      consistentWith: ['h-client-defect'],
      tradeoffs: 'The holdback did not implicate the client, so this spends effort where the evidence is weakest.',
    },
    {
      id: 'a-mix-adjust',
      label: 'Shift acquisition spend back toward higher-activating sources',
      description: 'Rebalance campaign budget to restore the earlier source mix.',
      consistentWith: ['h-mix-shift'],
      tradeoffs: 'Mix explains only part of the decline; it will not recover the measurement gap.',
    },
    {
      id: 'a-latency-fix',
      label: 'Tune or revert the session-cache change',
      description: 'Reduce p95 latency and re-check the funnel.',
      consistentWith: ['h-latency'],
      tradeoffs: 'Activation fell uniformly across latency strata, so latency is not supported.',
    },
    {
      id: 'a-run-decisive-experiment',
      label: 'Run the highest-value remaining experiment first',
      description: 'Use the information-per-cost ranking to spend remaining budget before acting.',
      consistentWith: [],
      tradeoffs: 'Delays any fix by the experiment’s duration, but avoids acting on an explanation the evidence cannot yet separate.',
    },
    {
      id: 'a-collect-more',
      label: 'Collect more data before acting',
      description: 'Wait for more weeks of data before deciding.',
      consistentWith: [],
      tradeoffs: 'Adds observations but does not resolve a counting artifact that more of the same telemetry will not reveal.',
    },
  ],
  caveats: [
    {
      id: 'caveat-observational',
      label: 'These are observational windows: a drop after the release does not by itself prove the release caused it.',
      kind: 'limitation',
      required: true,
    },
    {
      id: 'caveat-synthetic',
      label: 'The dataset and the experiment results are a synthetic fixture, not a real recording.',
      kind: 'scope',
      required: true,
    },
    {
      id: 'caveat-priors',
      label: 'The priors and likelihoods are documented assumptions; the posterior is a consequence of them, not a measurement.',
      kind: 'limitation',
      required: true,
    },
    {
      id: 'caveat-budget',
      label: 'The experiment budget forces a choice: not every hypothesis can be tested in this window.',
      kind: 'limitation',
      required: false,
    },
    {
      id: 'caveat-window',
      label: 'A single release window cannot separate seasonality beyond the measured daily variation.',
      kind: 'limitation',
      required: false,
    },
  ],
  experiments: arenaExperiments,
  budget: arenaMeta.experimentBudget,
  minExperiments: 1,
  keyEvidence: ['ev-experiment-method', 'ev-eig-ranking', 'ev-belief-posterior'],
  weights: { evidence: 0.3, interpretation: 0.3, uncertainty: 0.2, consistency: 0.2 },
}

let cachedFindings: ReferenceFindings | null = null

function outcomeSummary(experimentId: string): string {
  const outcomeId = GROUND_TRUTH_OUTCOMES[experimentId]
  const outcome = EXPERIMENT_OUTCOMES[experimentId]?.find((item) => item.id === outcomeId)
  return outcome?.summary ?? ''
}

export function referenceFindings(): ReferenceFindings {
  if (cachedFindings) return cachedFindings
  const comparison = activationComparison()
  const decomposition = activationDecomposition()
  const noise = baselineNoise()
  const segments = segmentStats()
  const social = segments.find((segment) => segment.source === 'social')!
  const nonSocialBaseline = (comparison.baseline.rate * comparison.baseline.signups - social.baseline.activations) /
    (comparison.baseline.signups - social.baseline.signups)

  const facts = [
    `Observed activation fell from ${formatPercent(comparison.baseline.rate)} (${formatNumber(
      comparison.baseline.activations,
    )}/${formatNumber(comparison.baseline.signups)}) to ${formatPercent(
      comparison.comparison.rate,
    )} (${formatNumber(comparison.comparison.activations)}/${formatNumber(
      comparison.comparison.signups,
    )}): ${formatPoints(comparison.absoluteChange)} absolute, ${formatPercent(
      comparison.relativeChange,
    )} relative.`,
    `Signups rose from ${formatNumber(comparison.baseline.signups)} to ${formatNumber(
      comparison.comparison.signups,
    )}, so the decline is a rate change, not a volume shortfall.`,
    `The social share of signups rose from ${formatPercent(social.baselineShare)} to ${formatPercent(
      social.comparisonShare,
    )}; social activates at ${formatPercent(social.baseline.rate)}, about ${formatPoints(
      social.baseline.rate - nonSocialBaseline,
    )} below the rest of the baseline.`,
    `Shift-share decomposition of the ${formatPoints(
      comparison.absoluteChange,
    )} change attributes ${formatPoints(decomposition.mix)} to mix, ${formatPoints(
      decomposition.rate,
    )} to within-source rate changes, and ${formatPoints(decomposition.interaction)} to the interaction.`,
    `Baseline daily activation varied with a standard deviation of ${formatPoints(
      noise.stdDev,
    )}; the observed change is z = ${noise.zScore.toFixed(2)}, so it exceeds ordinary daily noise.`,
    `Instrumentation audit (synthetic fixture): ${outcomeSummary('run-instrumentation-audit')}`,
    `Client holdback (synthetic fixture): ${outcomeSummary('run-client-version')}`,
    `Latency funnel (synthetic fixture): ${outcomeSummary('run-latency-funnel')}`,
    `Rollback (synthetic fixture): ${outcomeSummary('run-rollback')}`,
  ]

  const assumptions = [
    'No other product or pricing change landed inside the comparison window.',
    'The audit’s undercount estimate generalises from the replayed events to the whole window.',
    `The prior probabilities (${Object.entries(PRIORS)
      .map(([id, value]) => `${id} ${formatPercent(value, 0)}`)
      .join(', ')}) encode pre-experiment beliefs, and the likelihoods are documented assumptions.`,
    'Acquisition sources are mutually exclusive and stable across the two windows.',
  ]

  const uncertainty = [
    'Observational data cannot establish that the release caused the decline.',
    'The instrumentation estimate is model-based with an interval of roughly 3.8–6.1 pp, not an exact measurement.',
    'Different priors or likelihoods would move the posterior; the ranking and conclusions inherit that assumption risk.',
    'The client holdback covered 10% of traffic for three days, so a small version-specific or slow-burn effect cannot be fully excluded.',
    'One release window cannot separate seasonality beyond the measured day-to-day variation.',
  ]

  cachedFindings = {
    primaryHypothesis: 'h-instrumentation',
    secondaryHypothesis: 'h-mix-shift',
    confidence: 'medium',
    statement: `The activation drop is mostly a measurement change, not a behaviour change. The instrumentation audit estimates about 5.0 pp of the ${formatPoints(
      comparison.absoluteChange,
    )} decline is uncounted activations after the required-field change, and a traffic-mix shift toward lower-activating social traffic explains about ${formatPoints(
      decomposition.mix,
    )}. The client holdback and the latency funnel did not support a client defect or a latency effect. Confidence is medium because the correction is an estimate and the prior and likelihood assumptions are declared rather than measured.`,
    facts,
    assumptions,
    uncertainty,
  }
  return cachedFindings
}

function labelFor(hypothesisId: string): string {
  return (
    arenaChallenge.hypotheses.find((hypothesis: Hypothesis) => hypothesis.id === hypothesisId)?.label ??
    hypothesisId
  )
}

function evidenceCoverage(state: ChallengeState): number {
  const total = arenaChallenge.evidence.reduce((sum, item) => sum + item.weight, 0)
  const inspected = arenaChallenge.evidence
    .filter((item) => state.inspected.includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0)
  return total === 0 ? 0 : inspected / total
}

function keyEvidenceCoverage(state: ChallengeState): number {
  const keys = arenaChallenge.keyEvidence
  if (keys.length === 0) return 1
  return keys.filter((id) => state.inspected.includes(id)).length / keys.length
}

const CONFIDENCE_ORDER: RecommendedConfidence[] = ['very-low', 'low', 'medium', 'high']

export function scoreSubmission(state: ChallengeState): DecisionScore {
  const coverage = evidenceCoverage(state)
  const keyCoverage = keyEvidenceCoverage(state)
  const evidenceNote = `${state.inspected.length} of ${
    arenaChallenge.evidence.length
  } evidence panels inspected (${formatPercent(coverage, 0)} of the designed information value).`

  const budget = arenaChallenge.budget ?? Number.POSITIVE_INFINITY
  const def = defensibility(state.experimentsRun, budget)
  const profile = beliefProfile(state.experimentsRun)
  const primary = state.primaryHypothesis

  const conclusionMatch =
    primary === profile.argmax ? 1 : primary === profile.runnerUp ? 0.4 : 0
  const rawInterpretation = 0.55 * conclusionMatch + 0.45 * def.average
  const interpretationScore = clamp01(rawInterpretation * keyCoverage)
  const interpretationNote = `${
    primary === profile.argmax
      ? `Your conclusion matches the most probable explanation given the experiments you ran (${labelFor(
          profile.argmax,
        )}, ${formatPercent(profile.maxProbability)}).`
      : primary === profile.runnerUp
        ? `Your conclusion is the runner-up in your own posterior (${labelFor(profile.argmax)} leads at ${formatPercent(
            profile.maxProbability,
          )}).`
        : `Your conclusion is not supported by the experiments you ran; your posterior favours ${labelFor(
            profile.argmax,
          )}.`
  } Experiment choice, judged by information per cost at the time you chose, averages ${formatPercent(
    def.average,
    0,
  )}. Gated by key-evidence coverage of ${formatPercent(keyCoverage, 0)}.`

  const recommended = recommendedConfidence(profile.maxProbability)
  const recommendedIndex = CONFIDENCE_ORDER.indexOf(recommended)
  const chosenIndex = CONFIDENCE_ORDER.indexOf((state.confidence ?? '') as RecommendedConfidence)
  const distance = chosenIndex === -1 ? 3 : Math.abs(chosenIndex - recommendedIndex)
  const calibration = distance === 0 ? 1 : distance === 1 ? 0.5 : 0
  const requiredCaveats = arenaChallenge.caveats.filter((caveat) => caveat.required)
  const acknowledgedRequired = requiredCaveats.filter((caveat) =>
    state.acknowledgedCaveats.includes(caveat.id),
  ).length
  const caveatScore = requiredCaveats.length === 0 ? 1 : acknowledgedRequired / requiredCaveats.length
  const uncertaintyScore = clamp01(0.5 * calibration + 0.5 * caveatScore)
  const uncertaintyNote = `Your posterior peaks at ${formatPercent(profile.maxProbability)}, which supports "${
    recommended
  }" confidence; you chose "${state.confidence ?? 'none'}". ${acknowledgedRequired} of ${
    requiredCaveats.length
  } required caveats acknowledged.`

  const action = arenaChallenge.nextActionOptions.find((option) => option.id === state.nextAction)
  const spendsBudget = arenaChallenge.budget ?? 0
  const spent = arenaExperiments
    .filter((experiment) => state.experimentsRun.includes(experiment.id))
    .reduce((sum, experiment) => sum + experiment.cost, 0)
  const budgetRemains = spent < spendsBudget
  const actionScore =
    action === undefined
      ? 0
      : action.consistentWith?.includes(primary ?? '')
        ? 1
        : action.id === 'a-run-decisive-experiment' && budgetRemains
          ? 0.7
          : action.id === 'a-collect-more'
            ? 0.6
            : 0.3
  const overconfident = state.confidence === 'high' && (profile.maxProbability < 0.82 || coverage < 0.75)
  const consistencyScore = clamp01(0.6 * actionScore + 0.4 * (overconfident ? 0.2 : 1))
  const consistencyNote = action
    ? `Next action "${action.label}" is ${
        action.consistentWith?.includes(primary ?? '') ? 'consistent' : 'weakly linked'
      } with your stated conclusion.`
    : 'No next action selected.'

  const input: ScoringInput = {
    evidence: { score: coverage, note: evidenceNote },
    interpretation: { score: interpretationScore, note: interpretationNote },
    uncertainty: { score: uncertaintyScore, note: uncertaintyNote },
    consistency: { score: consistencyScore, note: consistencyNote },
  }
  return computeScore(arenaChallenge, input)
}

export function buildDecisionRecord(state: ChallengeState): DecisionRecord {
  const reference = referenceFindings()
  const score = scoreSubmission(state)
  const profile = beliefProfile(state.experimentsRun)
  const budget = arenaChallenge.budget ?? Number.POSITIVE_INFINITY
  const def = defensibility(state.experimentsRun, budget)

  const primaryMatches = state.primaryHypothesis === reference.primaryHypothesis
  const secondaryMatches =
    reference.secondaryHypothesis === null
      ? state.secondaryHypothesis === null
      : state.secondaryHypothesis === reference.secondaryHypothesis

  const notes: string[] = []
  notes.push(
    primaryMatches
      ? 'Your conclusion matches the reference reading (measurement undercount, with a mix component).'
      : `The reference reading treats "${labelFor(reference.primaryHypothesis)}" as primary and "${labelFor(
          reference.secondaryHypothesis ?? reference.primaryHypothesis,
        )}" as secondary.`,
  )
  notes.push(
    state.experimentsRun.length === 0
      ? 'No experiments were run.'
      : `You ran ${state.experimentsRun.length} experiment(s); judged by information per cost at each step, your choices average ${formatPercent(
          def.average,
          0,
        )} and your posterior favours ${labelFor(profile.argmax)} at ${formatPercent(profile.maxProbability)}.`,
  )
  if (reference.secondaryHypothesis !== null) {
    notes.push(
      secondaryMatches
        ? 'You also identified the traffic-mix component.'
        : 'The reference reading identifies a traffic-mix component you did not select.',
    )
  }

  return {
    challengeId: arenaChallenge.id,
    datasetId: ARENA_DATASET_ID,
    engineVersion: ENGINE_VERSION,
    fingerprint: fingerprint(arenaChallenge.id, ARENA_DATASET_ID, state, score.total),
    submittedPrimary: state.primaryHypothesis,
    submittedSecondary: state.secondaryHypothesis,
    confidence: state.confidence,
    nextAction: state.nextAction,
    acknowledgedCaveats: [...state.acknowledgedCaveats],
    targetSelections: { ...state.targetSelections },
    experimentsRun: [...state.experimentsRun],
    inspectedEvidence: [...state.inspected],
    ranComparisons: [...state.ranComparisons],
    filters: { ...state.filters },
    score,
    agreement: { primaryMatches, secondaryMatches, notes },
    reference,
  }
}

export function experimentCount(): number {
  return arenaExperiments.length
}

export { experimentLabel }
