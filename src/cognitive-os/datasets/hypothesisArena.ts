import type { ChallengeExperiment } from '@/cognitive-os/types'

// Synthetic activation-decline fixture for the Hypothesis Arena challenge.
//
// The aggregate rows are authored so the designed decline is exact and legible.
// The daily rows are generated deterministically from those aggregates (same
// seed -> same series) and only exist so a noise band and a daily chart can be
// computed from data rather than asserted. Nothing here is a real measurement.

export const ARENA_DATASET_ID = 'activation-decline-v1'
export const ARENA_SEED = 20250311

export type ActivationSource = 'organic' | 'paid_search' | 'social' | 'email'
export type ActivationPeriod = 'baseline' | 'comparison'

export const ACTIVATION_SOURCES: ActivationSource[] = ['organic', 'paid_search', 'social', 'email']
export const ACTIVATION_PERIODS: ActivationPeriod[] = ['baseline', 'comparison']

export interface ActivationSegmentRow {
  source: ActivationSource
  period: ActivationPeriod
  signups: number
  activations: number
}

export interface ActivationDailyRow {
  date: string
  period: ActivationPeriod
  signups: number
  activations: number
}

export const activationSegments: ActivationSegmentRow[] = [
  { source: 'organic', period: 'baseline', signups: 10000, activations: 4500 },
  { source: 'paid_search', period: 'baseline', signups: 6000, activations: 2580 },
  { source: 'social', period: 'baseline', signups: 5500, activations: 1760 },
  { source: 'email', period: 'baseline', signups: 3500, activations: 1470 },
  { source: 'organic', period: 'comparison', signups: 9720, activations: 3720 },
  { source: 'paid_search', period: 'comparison', signups: 5940, activations: 2138 },
  { source: 'social', period: 'comparison', signups: 8370, activations: 2478 },
  { source: 'email', period: 'comparison', signups: 2970, activations: 1069 },
]

function createRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function isoDate(start: string, offset: number): string {
  const date = new Date(`${start}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

/** Approximate standard normal from twelve uniforms (mean 0, sd 1). */
function normal(random: () => number): number {
  let sum = 0
  for (let index = 0; index < 12; index += 1) sum += random()
  return sum - 6
}

function allocate(weights: number[], total: number): number[] {
  const sum = weights.reduce((acc, weight) => acc + weight, 0)
  const raw = weights.map((weight) => (sum === 0 ? 0 : (weight / sum) * total))
  const values = raw.map((value) => Math.floor(value))
  let remainder = total - values.reduce((acc, value) => acc + value, 0)
  let index = 0
  while (remainder > 0) {
    const target = index % values.length
    values[target] = (values[target] ?? 0) + 1
    remainder -= 1
    index += 1
  }
  return values
}

function buildDaily(
  period: ActivationPeriod,
  start: string,
  days: number,
  random: () => number,
): ActivationDailyRow[] {
  const scoped = activationSegments.filter((row) => row.period === period)
  const totalSignups = scoped.reduce((acc, row) => acc + row.signups, 0)
  const totalActivations = scoped.reduce((acc, row) => acc + row.activations, 0)
  const baseRate = totalActivations / totalSignups

  const signupWeights = Array.from(
    { length: days },
    (_, day) => 1 + 0.18 * Math.sin((day / 7) * 2 * Math.PI) + (random() - 0.5) * 0.16,
  )
  const signups = allocate(signupWeights, totalSignups)

  const rates = signups.map((_dailySignups, day) => {
    const weekday = 1 + 0.035 * Math.sin((day / 7) * 2 * Math.PI)
    const noisy = baseRate * weekday + 0.014 * normal(random)
    return Math.min(0.95, Math.max(0.05, noisy))
  })

  const activations = signups.map((dailySignups, day) => Math.round(dailySignups * (rates[day] ?? 0)))
  let remainder = totalActivations - activations.reduce((acc, value) => acc + value, 0)
  let cursor = 0
  while (remainder !== 0) {
    const target = cursor % days
    const current = activations[target] ?? 0
    if (remainder > 0) {
      activations[target] = current + 1
      remainder -= 1
    } else if (current > 0) {
      activations[target] = current - 1
      remainder += 1
    }
    cursor += 1
  }

  return activations.map((dailyActivations, day) => ({
    date: isoDate(start, day),
    period,
    signups: signups[day]!,
    activations: dailyActivations,
  }))
}

export const activationDaily: ActivationDailyRow[] = [
  ...buildDaily('baseline', '2025-02-03', 28, createRandom(ARENA_SEED)),
  ...buildDaily('comparison', '2025-03-03', 14, createRandom(ARENA_SEED + 1)),
]

export interface ArenaExperimentOutcome {
  id: string
  label: string
  summary: string
  detail: string[]
}

/**
 * Experiments the visitor may run. Costs are budget units and feasibility notes
 * are operational constraints, both declared up front.
 */
export const arenaExperiments: ChallengeExperiment[] = [
  {
    id: 'run-client-version',
    label: 'Hold back the new client for 10% of traffic',
    description:
      'Split new users between the shipped onboarding client and the previous version for three days and compare activation.',
    cost: 2,
    durationDays: 3,
    risk: 'low',
    feasibility: 'Needs a 10% holdback flag; current traffic gives a usable sample in three days.',
    reveals: ['ev-result-client'],
  },
  {
    id: 'run-instrumentation-audit',
    label: 'Replay the activation event schema',
    description:
      'Compare the emitted activation events before and after the release and estimate how many genuine activations are no longer counted.',
    cost: 3,
    durationDays: 5,
    risk: 'low',
    feasibility: 'Requires engineering to reconcile event counts against the previous schema; no user exposure.',
    reveals: ['ev-result-audit'],
  },
  {
    id: 'run-latency-funnel',
    label: 'Join session latency to activation by cohort',
    description:
      'Check whether activation falls mostly in the slowest session-latency strata after the cache change.',
    cost: 2,
    durationDays: 2,
    risk: 'low',
    feasibility: 'Telemetry already records latency; needs a funnel join, not a new signal.',
    reveals: ['ev-result-latency'],
  },
  {
    id: 'run-rollback',
    label: 'Roll back the release for all users',
    description: 'Revert the onboarding client, instrumentation, and cache changes together and watch activation.',
    cost: 4,
    durationDays: 7,
    risk: 'high',
    feasibility: 'Affects every user and discards the instrumentation changes; treats several causes at once.',
    reveals: ['ev-result-rollback'],
  },
]

/** Authored synthetic results keyed by experiment id. Values are fixtures, not measurements. */
export const EXPERIMENT_OUTCOMES: Record<string, ArenaExperimentOutcome[]> = {
  'run-client-version': [
    {
      id: 'a-both',
      label: 'Both client versions depressed',
      summary:
        'Old and new clients both activate about 6 points below their own baseline; the gap is not specific to the new client.',
      detail: [
        'Held-back old client: 35.1% activation (n = 1,840 signups).',
        'New client: 34.6% activation (n = 16,520 signups).',
        'Difference of 0.5 pp is well inside the sampling error at this sample size.',
        'The holdback ran for three days, so a slow-burn client issue cannot be fully excluded.',
      ],
    },
    {
      id: 'a-new-only',
      label: 'Only the new client depressed',
      summary: 'The held-back old client activates near its baseline while the new client shows the full decline.',
      detail: [
        'Held-back old client: 40.9% activation (n = 1,830 signups).',
        'New client: 34.7% activation (n = 16,540 signups).',
        'The gap is specific to the new client and survives the split.',
      ],
    },
    {
      id: 'a-old-only',
      label: 'Only the old client depressed',
      summary: 'The held-back old client activates below baseline while the new client holds up.',
      detail: [
        'Held-back old client: 31.2% activation (n = 1,810 signups).',
        'New client: 40.4% activation (n = 16,560 signups).',
        'The pattern points away from the new client and toward shared or measurement causes.',
      ],
    },
  ],
  'run-instrumentation-audit': [
    {
      id: 'b-schema',
      label: 'Events are undercounted after a required-field change',
      summary:
        'The activation event now fires only after a newly required profile field, so some genuine activations are never counted.',
      detail: [
        'Replaying pre-release events against the new schema drops roughly 5.0 pp of activations.',
        'The estimate carries an interval of about 3.8 to 6.1 pp, not a single exact value.',
        'Correcting the count leaves an activation rate near 40.9%, close to the 41.2% baseline.',
        'The estimate is model-based: it reconciles event counts, it does not re-measure every user.',
      ],
    },
    {
      id: 'b-clean',
      label: 'Event counting matches the previous definition',
      summary: 'The activation event fires under the same conditions as before; the decline is not a counting artifact.',
      detail: [
        'Replayed and live counts agree within 0.3 pp.',
        'No required-field dependency was introduced for the activation event.',
        'The observed decline cannot be attributed to the instrumentation change.',
      ],
    },
    {
      id: 'b-partial',
      label: 'Counting changed for part of the window',
      summary: 'The event definition drifted partway through the comparison window, contaminating only some days.',
      detail: [
        'Estimated undercount of about 2.4 pp, concentrated after a mid-window deploy.',
        'The remaining decline still exceeds what mix alone would explain.',
        'The interval is wide because only part of the window is affected.',
      ],
    },
  ],
  'run-latency-funnel': [
    {
      id: 'c-uniform',
      label: 'The activation drop is uniform across latency strata',
      summary: 'Fast and slow sessions fall by a similar amount; the cache change does not explain the decline.',
      detail: [
        'Activation change by latency quartile: −6.1, −6.5, −6.3, −6.6 pp.',
        'No monotonic gradient with session latency.',
        'Small latency effects below about 1 pp cannot be excluded at this sample size.',
      ],
    },
    {
      id: 'c-latency-gap',
      label: 'Activation collapses in the slowest sessions',
      summary: 'The decline concentrates in slow sessions, consistent with the cache change.',
      detail: [
        'Slowest latency quartile: −14.8 pp; fastest quartile: −1.2 pp.',
        'A clear monotonic gradient with session latency.',
      ],
    },
    {
      id: 'c-inconclusive',
      label: 'Latency join is inconclusive',
      summary: 'Latency coverage is too sparse to separate strata confidently.',
      detail: [
        'Only 46% of sessions carry a usable latency value after the release.',
        'Confidence intervals across strata overlap heavily.',
      ],
    },
  ],
  'run-rollback': [
    {
      id: 'd-nochange',
      label: 'Activation does not recover after rollback',
      summary: 'Reverting the release leaves activation unchanged over the following week.',
      detail: [
        'Post-rollback activation: 34.9% (n = 13,720 signups).',
        'No meaningful recovery, which argues against a release-code cause.',
        'Rollback also reverted the instrumentation fix, so counts remain ambiguous.',
      ],
    },
    {
      id: 'd-partial-recovery',
      label: 'Activation partly recovers',
      summary: 'About half the decline reverses, mixing a release cause with a persistent shift.',
      detail: [
        'Post-rollback activation: 38.0% (n = 13,650 signups).',
        'Recovery is partial, so at least one non-release factor remains.',
      ],
    },
    {
      id: 'd-full-recovery',
      label: 'Activation fully recovers',
      summary: 'Activation returns to baseline, pointing at the release code.',
      detail: [
        'Post-rollback activation: 41.0% (n = 13,600 signups).',
        'The release is implicated, though the rollback changed several things at once.',
      ],
    },
  ],
}

/** The result each experiment actually returns in this fixture. */
export const GROUND_TRUTH_OUTCOMES: Record<string, string> = {
  'run-client-version': 'a-both',
  'run-instrumentation-audit': 'b-schema',
  'run-latency-funnel': 'c-uniform',
  'run-rollback': 'd-nochange',
}

export interface ArenaMeta {
  seed: number
  datasetId: string
  baselineWindow: string
  comparisonWindow: string
  releaseDate: string
  question: string
  definition: string
  releaseNotes: string[]
  generation: string[]
  disclaimer: string
  experimentBudget: number
}

export const arenaMeta: ArenaMeta = {
  seed: ARENA_SEED,
  datasetId: ARENA_DATASET_ID,
  baselineWindow: '2025-02-03 to 2025-03-02 (28 days)',
  comparisonWindow: '2025-03-03 to 2025-03-16 (14 days)',
  releaseDate: '2025-03-03',
  question: 'Why did signup-to-activation fall right after the release?',
  definition:
    'Activation means a new signup completed the core onboarding action within seven days. Signups are counted at account creation.',
  releaseNotes: [
    'New onboarding client shipped to all new signups.',
    'The activation event schema gained a newly required profile field.',
    'The session service added a cache layer (reported p95 latency roughly +40 ms).',
  ],
  generation: [
    'Activation and signup totals are authored so the designed decline is exact; the daily series is generated from those totals with a fixed seed.',
    'Every rate, share, decomposition term, and noise band on the page is computed from the rows below, not written by hand.',
    'Experiment results are an authored synthetic fixture: they are presented as findings, not derived from the activation table.',
  ],
  disclaimer:
    'Synthetic dataset bundled with the site. It is designed to be inspectable and deterministic, not sampled from a real product.',
  experimentBudget: 5,
}
