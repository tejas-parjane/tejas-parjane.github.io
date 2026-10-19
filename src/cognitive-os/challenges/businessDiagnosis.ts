import {
  completeness,
  compareFunnels,
  decomposeMix,
  groupBySource,
  noiseBand,
  sourceDeviceMatrix,
  standardizeToBaselineMix,
} from '@/cognitive-os/analysis/businessDiagnosisAnalysis'
import { DATASET_ID, businessDiagnosisRows } from '@/cognitive-os/datasets/businessDiagnosis'
import {
  computeScore,
  fingerprint,
  type ScoringInput,
  clamp01,
} from '@/cognitive-os/engine'
import { formatPercent, formatRate, formatSignedPercent, formatSigned } from '@/cognitive-os/format'
import {
  ENGINE_VERSION,
  type ChallengeDefinition,
  type ChallengeState,
  type DecisionRecord,
  type DecisionScore,
  type Hypothesis,
  type ReferenceFindings,
} from '@/cognitive-os/types'

export const businessDiagnosisChallenge: ChallengeDefinition = {
  id: 'business-diagnosis',
  title: 'Business Diagnosis',
  steps: [
    {
      id: 'briefing',
      label: 'Briefing',
      description: 'Read the situation and the dataset you will investigate.',
    },
    {
      id: 'investigating',
      label: 'Investigate',
      description: 'Inspect evidence, apply filters, and run predefined comparisons.',
    },
    {
      id: 'deciding',
      label: 'Decide',
      description: 'Commit to a conclusion, a confidence level, and a next action.',
    },
    {
      id: 'record',
      label: 'Decision record',
      description: 'Review your scored conclusion against the reference reading.',
    },
  ],
  hypotheses: [
    {
      id: 'h-mix-shift',
      label: 'Traffic-mix shift',
      statement:
        'The session mix moved toward lower-converting traffic, so the blended rate fell even if each segment behaved as before.',
      kind: 'composition',
    },
    {
      id: 'h-mobile-checkout',
      label: 'Mobile checkout degradation',
      statement:
        'Mobile sessions converted at a genuinely lower rate than before, independently of any change in traffic mix.',
      kind: 'within-segment',
    },
    {
      id: 'h-landing-page',
      label: 'Landing-page change',
      statement:
        'A change to a specific landing page reduced conversion for the sessions that reach it.',
      kind: 'within-segment',
    },
    {
      id: 'h-capacity',
      label: 'Volume overload',
      statement: 'Higher traffic volume strained the funnel and reduced conversion.',
      kind: 'external',
    },
    {
      id: 'h-measurement',
      label: 'Measurement error',
      statement: 'A tracking or instrumentation fault lowered the recorded conversion rate.',
      kind: 'measurement',
    },
    {
      id: 'h-noise',
      label: 'Normal variation',
      statement: 'The change is within ordinary day-to-day variation and needs no explanation.',
      kind: 'none',
    },
  ],
  evidence: [
    {
      id: 'e-funnel',
      title: 'Funnel by period',
      question: 'How large is the change, and where in the funnel does it appear?',
      method:
        'Sums sessions, add-to-carts, checkouts and purchases for each period, then divides each stage by sessions.',
      discriminates: ['h-capacity'],
      weight: 0.1,
    },
    {
      id: 'e-by-source',
      title: 'Conversion and session share by traffic source',
      question: 'Did the source mix change, and do sources convert at different rates?',
      method:
        'Groups both periods by source; reports conversion (purchases ÷ sessions) and each source’s share of sessions.',
      discriminates: ['h-mix-shift', 'h-landing-page'],
      weight: 0.16,
    },
    {
      id: 'e-by-device',
      title: 'Conversion by device (aggregate)',
      question: 'Which devices appear to have changed?',
      method:
        'Groups both periods by device and reports conversion. These totals still contain the source-mix change, so the within-source view is needed to separate the two.',
      discriminates: ['h-mobile-checkout'],
      weight: 0.12,
    },
    {
      id: 'e-standardized-source',
      title: 'Comparison reweighted to the baseline source mix',
      question: 'How much of the change survives if the traffic mix is held constant?',
      method:
        'Multiplies each source’s comparison-period conversion by its baseline-period session share and sums them: a direct standardisation for the composition effect.',
      discriminates: ['h-mix-shift'],
      weight: 0.16,
    },
    {
      id: 'e-decomposition',
      title: 'Shift-share decomposition',
      question: 'How much of the change is composition, how much is within-group?',
      method:
        'Decomposes the rate change into a mix term (baseline rates × share changes), a rate term (baseline shares × rate changes), and their interaction.',
      discriminates: ['h-mix-shift', 'h-mobile-checkout'],
      weight: 0.16,
    },
    {
      id: 'e-by-source-device',
      title: 'Conversion by device within each source',
      question: 'Does the device pattern hold once the traffic source is held constant?',
      method:
        'Contingency table of source × device for both periods; isolates within-segment rate changes from the mix change.',
      discriminates: ['h-mobile-checkout', 'h-mix-shift'],
      weight: 0.12,
    },
    {
      id: 'e-landing-standardized',
      title: 'Landing page: standardised and raw',
      question: 'Can a landing-page change explain the decline?',
      method:
        'Repeats the standardisation and decomposition using landing page as the mix dimension and reports the explained fraction.',
      discriminates: ['h-landing-page'],
      weight: 0.06,
    },
    {
      id: 'e-noise',
      title: 'Day-to-day variation versus the change',
      question: 'Is the change larger than ordinary daily variation?',
      method:
        'Computes the mean and standard deviation of the baseline daily conversion rate and expresses the change as a z-score.',
      discriminates: ['h-noise'],
      weight: 0.06,
    },
    {
      id: 'e-completeness',
      title: 'Data completeness check',
      question: 'Could missing or inconsistent data explain the change?',
      method:
        'Checks that every expected date is present and that funnel stages are ordered (purchases ≤ checkouts ≤ add-to-carts) for each row.',
      discriminates: ['h-measurement'],
      weight: 0.06,
    },
  ],
  comparisons: [
    {
      id: 'c-raw',
      label: 'Raw period comparison',
      description: 'Overall funnel totals and conversion for both periods.',
      reveals: ['e-funnel'],
    },
    {
      id: 'c-source',
      label: 'Compare by traffic source',
      description: 'Conversion and session share for each source in both periods.',
      reveals: ['e-by-source'],
    },
    {
      id: 'c-device',
      label: 'Compare by device',
      description: 'Aggregate conversion for each device in both periods.',
      reveals: ['e-by-device'],
    },
    {
      id: 'c-standardize',
      label: 'Standardise to the baseline source mix',
      description: 'Reweight the comparison period to the baseline source composition.',
      reveals: ['e-standardized-source'],
    },
    {
      id: 'c-decompose',
      label: 'Run the shift-share decomposition',
      description: 'Split the change into mix, within-group rate, and interaction terms.',
      reveals: ['e-decomposition'],
    },
    {
      id: 'c-within-source-device',
      label: 'Compare devices within each source',
      description: 'Hold the source constant and compare device conversion.',
      reveals: ['e-by-source-device'],
    },
    {
      id: 'c-landing',
      label: 'Test the landing-page explanation',
      description: 'Standardise on landing page and report the explained fraction.',
      reveals: ['e-landing-standardized'],
    },
    {
      id: 'c-noise',
      label: 'Check variation versus signal',
      description: 'Compare the change with baseline day-to-day variation.',
      reveals: ['e-noise'],
    },
    {
      id: 'c-completeness',
      label: 'Check data completeness',
      description: 'Verify dates and funnel ordering across the dataset.',
      reveals: ['e-completeness'],
    },
  ],
  filters: [
    {
      id: 'source',
      label: 'Traffic source',
      values: ['organic', 'paid_search', 'social', 'email'],
    },
    { id: 'device', label: 'Device', values: ['desktop', 'mobile', 'tablet'] },
    { id: 'landingPage', label: 'Landing page', values: ['home', 'pricing', 'feature'] },
  ],
  confidenceOptions: [
    { id: 'very-low', label: 'Very low', description: 'Almost no confidence in the direction.' },
    { id: 'low', label: 'Low', description: 'Weak, suggestive evidence.' },
    { id: 'medium', label: 'Medium', description: 'Consistent, decisive descriptive evidence.' },
    { id: 'high', label: 'High', description: 'Strong causal evidence.' },
  ],
  nextActionOptions: [
    {
      id: 'a-standardize-rebalance',
      label: 'Standardise reporting for mix and review social spend',
      description: 'Report mix-adjusted rates and re-examine the reallocation toward social.',
      consistentWith: ['h-mix-shift'],
    },
    {
      id: 'a-mobile-test',
      label: 'Run a controlled test on the mobile checkout flow',
      description: 'Instrument and A/B test mobile checkout before attributing the residual decline.',
      consistentWith: ['h-mobile-checkout', 'h-mix-shift'],
    },
    {
      id: 'a-revert-pricing',
      label: 'Revert the landing-page change',
      description: 'Roll back the landing-page change and re-measure.',
      consistentWith: ['h-landing-page'],
    },
    {
      id: 'a-tracking-audit',
      label: 'Audit the tracking pipeline',
      description: 'Reconcile instrumentation and event logging against the warehouse.',
      consistentWith: ['h-measurement'],
    },
    {
      id: 'a-collect-more',
      label: 'Collect more data before acting',
      description: 'Defer the decision until a longer or cleaner window is available.',
      consistentWith: [],
    },
    {
      id: 'a-no-action',
      label: 'Take no action',
      description: 'Treat the change as normal variation.',
      consistentWith: ['h-noise'],
    },
  ],
  caveats: [
    {
      id: 'caveat-causality',
      label: 'Observational data can show association but cannot establish causation on its own.',
      kind: 'limitation',
      required: true,
    },
    {
      id: 'caveat-synthetic',
      label: 'The dataset is synthetic; the magnitudes are scenario assumptions, not measured facts.',
      kind: 'scope',
      required: true,
    },
    {
      id: 'caveat-interaction',
      label: 'The mix and within-group terms interact, so their shares are approximate.',
      kind: 'limitation',
      required: false,
    },
    {
      id: 'caveat-coverage',
      label: 'Only four traffic sources and three devices are captured; other segments are omitted.',
      kind: 'limitation',
      required: false,
    },
  ],
  keyEvidence: ['e-by-source', 'e-standardized-source', 'e-decomposition', 'e-by-source-device'],
  weights: { evidence: 0.3, interpretation: 0.3, uncertainty: 0.2, consistency: 0.2 },
}

export interface ReferenceAnalysis {
  overall: ReturnType<typeof compareFunnels>
  decomposition: ReturnType<typeof decomposeMix>
  standardization: ReturnType<typeof standardizeToBaselineMix>
  landingStandardization: ReturnType<typeof standardizeToBaselineMix>
  noise: ReturnType<typeof noiseBand>
  dataCompleteness: ReturnType<typeof completeness>
  sources: ReturnType<typeof groupBySource>
  matrix: ReturnType<typeof sourceDeviceMatrix>
  sessionGrowth: number
  mobileWithinChange: number
  contradicted: string[]
  primaryHypothesis: string
  secondaryHypothesis: string | null
}

let cachedAnalysis: ReferenceAnalysis | null = null

export function analyseReference(): ReferenceAnalysis {
  if (cachedAnalysis) return cachedAnalysis

  const overall = compareFunnels()
  const decomposition = decomposeMix('source')
  const standardization = standardizeToBaselineMix('source')
  const landingStandardization = standardizeToBaselineMix('landingPage')
  const noise = noiseBand()
  const dataCompleteness = completeness()
  const sources = groupBySource()
  const matrix = sourceDeviceMatrix()

  const sessionGrowth = overall.baseline.sessions === 0 ? 0 : overall.comparison.sessions / overall.baseline.sessions - 1

  const mobileCells = matrix.filter((cell) => cell.device === 'mobile' && cell.baselineRate > 0)
  const mobileWithinChange =
    mobileCells.length === 0
      ? 0
      : mobileCells.reduce((sum, cell) => sum + (cell.comparisonRate / cell.baselineRate - 1), 0) /
        mobileCells.length

  const contradicted: string[] = []
  if (landingStandardization.explainedFraction < 0.15) contradicted.push('h-landing-page')
  if (noise.exceedsNoise) contradicted.push('h-noise')
  if (dataCompleteness.complete) contradicted.push('h-measurement')
  if (sessionGrowth < 0.2) contradicted.push('h-capacity')

  const primaryHypothesis = decomposition.mixShare >= 0.4 ? 'h-mix-shift' : 'h-mobile-checkout'
  const secondaryHypothesis =
    primaryHypothesis === 'h-mix-shift' && decomposition.rateShare >= 0.15 && mobileWithinChange <= -0.05
      ? 'h-mobile-checkout'
      : null

  cachedAnalysis = {
    overall,
    decomposition,
    standardization,
    landingStandardization,
    noise,
    dataCompleteness,
    sources,
    matrix,
    sessionGrowth,
    mobileWithinChange,
    contradicted,
    primaryHypothesis,
    secondaryHypothesis,
  }
  return cachedAnalysis
}

let cachedFindings: ReferenceFindings | null = null

export function referenceFindings(): ReferenceFindings {
  if (cachedFindings) return cachedFindings
  const analysis = analyseReference()
  const { overall, decomposition, standardization, landingStandardization, noise, mobileWithinChange } =
    analysis

  const facts = [
    `Blended conversion fell from ${formatRate(overall.baseline.rate)} to ${formatRate(overall.comparison.rate)} (${formatSignedPercent(overall.relativeChange)} relative) while sessions changed by ${formatSignedPercent(analysis.sessionGrowth)}.`,
    `Traffic source shares shifted: social rose from ${formatPercent(
      analysis.sources.find((group) => group.key === 'social')?.baselineShare ?? 0,
      0,
    )} to ${formatPercent(analysis.sources.find((group) => group.key === 'social')?.comparisonShare ?? 0, 0)} of sessions.`,
    `Standardising the comparison period to the baseline source mix moves the rate to ${formatRate(standardization.standardizedRate)} and removes ${formatPercent(standardization.explainedFraction)} of the observed change.`,
    `The shift-share decomposition attributes ${formatPercent(decomposition.mixShare)} of the change to mix, ${formatPercent(decomposition.rateShare)} to within-group rates, and ${formatPercent(decomposition.interactionShare)} to their interaction.`,
    `Within every source, mobile conversion fell by about ${formatPercent(Math.abs(mobileWithinChange))} while desktop and tablet were broadly flat.`,
    `Landing-page standardisation removes only ${formatPercent(landingStandardization.explainedFraction)} of the change, so landing page is not the driver.`,
    `The decline is ${formatSigned(noise.zScore, 2)} standard deviations of baseline daily variation, so it is not ordinary noise.`,
  ]

  const assumptions = [
    'The dataset is synthetic and deterministic; total sessions, source shares, device shares, base rates, and the mobile modifier are chosen scenario values.',
    'Average order value is fixed at 1200 currency units, so revenue adds no independent information.',
    'Each period is exactly 14 consecutive days with no missing dates.',
  ]

  const uncertainty = [
    'The evidence is observational and covers a single two-week comparison; it cannot by itself establish why the mobile rate changed.',
    'The mix and within-group terms interact, so their shares are approximate rather than exact partitions.',
    'Uncaptured sources, devices, seasonality, and concurrent changes are outside the dataset.',
    'Because the data are synthetic, the direction of the pattern is designed; the intended lesson is the method, not the magnitude.',
  ]

  const statement =
    analysis.primaryHypothesis === 'h-mix-shift'
      ? `The decline is mainly composition: the traffic mix shifted toward lower-converting traffic, which accounts for roughly ${formatPercent(
          standardization.explainedFraction,
        )} of it. A smaller but real within-segment decline remains, concentrated on mobile (about ${formatPercent(
          Math.abs(mobileWithinChange),
        )} within every source), which warrants a controlled test rather than a causal claim.`
      : 'A within-segment decline dominates the change, with composition playing a smaller role.'

  cachedFindings = {
    primaryHypothesis: analysis.primaryHypothesis,
    secondaryHypothesis: analysis.secondaryHypothesis,
    confidence: 'medium',
    statement,
    facts,
    assumptions,
    uncertainty,
  }
  return cachedFindings
}

function isContradicted(hypothesisId: string | null): boolean {
  if (!hypothesisId) return false
  return analyseReference().contradicted.includes(hypothesisId)
}

function evidenceCoverage(state: ChallengeState): number {
  const total = businessDiagnosisChallenge.evidence.reduce((sum, item) => sum + item.weight, 0)
  const inspected = businessDiagnosisChallenge.evidence
    .filter((item) => state.inspected.includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0)
  return total === 0 ? 0 : inspected / total
}

function keyEvidenceCoverage(state: ChallengeState): number {
  const keys = businessDiagnosisChallenge.keyEvidence
  if (keys.length === 0) return 1
  return keys.filter((id) => state.inspected.includes(id)).length / keys.length
}

export function scoreSubmission(state: ChallengeState): DecisionScore {
  const reference = referenceFindings()
  const coverage = evidenceCoverage(state)
  const keyCoverage = keyEvidenceCoverage(state)

  const evidenceNote = `${state.inspected.length} of ${businessDiagnosisChallenge.evidence.length} evidence panels inspected (${formatPercent(
    coverage,
    0,
  )} of the designed information value).`

  const primaryMatch = state.primaryHypothesis === reference.primaryHypothesis
  const pairMatches =
    reference.secondaryHypothesis === null
      ? state.secondaryHypothesis === null
      : state.secondaryHypothesis === reference.secondaryHypothesis ||
        (state.primaryHypothesis === reference.secondaryHypothesis &&
          state.secondaryHypothesis === reference.primaryHypothesis)
  const complement = pairMatches ? 1 : state.secondaryHypothesis === null ? 0.3 : 0.4
  const contradictionAvoided = isContradicted(state.primaryHypothesis) ? 0 : 1

  const rawInterpretation = 0.6 * (primaryMatch ? 1 : 0) + 0.25 * complement + 0.15 * contradictionAvoided
  const interpretationScore = clamp01(rawInterpretation * keyCoverage)
  const interpretationNote = primaryMatch
    ? `Primary conclusion matches the reference (${labelFor(reference.primaryHypothesis)}). ${
        reference.secondaryHypothesis ? `Secondary component acknowledged: ${pairMatches ? 'yes' : 'no'}.` : ''
      } Gated by key-evidence coverage of ${formatPercent(keyCoverage, 0)}.`
    : `Primary conclusion does not match the reference (${labelFor(reference.primaryHypothesis)})${
        state.primaryHypothesis && isContradicted(state.primaryHypothesis)
          ? ' and is contradicted by the inspected evidence'
          : ''
      }. Gated by key-evidence coverage of ${formatPercent(keyCoverage, 0)}.`

  const confidenceScore =
    state.confidence === 'low' || state.confidence === 'medium'
      ? 1
      : state.confidence === 'very-low'
        ? 0.7
        : state.confidence === 'high'
          ? 0.4
          : 0
  const requiredCaveats = businessDiagnosisChallenge.caveats.filter((caveat) => caveat.required)
  const acknowledgedRequired = requiredCaveats.filter((caveat) =>
    state.acknowledgedCaveats.includes(caveat.id),
  ).length
  const caveatScore = requiredCaveats.length === 0 ? 1 : acknowledgedRequired / requiredCaveats.length
  const uncertaintyScore = clamp01(0.5 * confidenceScore + 0.5 * caveatScore)
  const uncertaintyNote = `Confidence "${state.confidence ?? 'none'}", and ${acknowledgedRequired} of ${requiredCaveats.length} required caveats acknowledged. ${
    state.confidence === 'high'
      ? 'High confidence is not supported by single-window observational data.'
      : 'Cautious confidence is appropriate for this evidence.'
  }`

  const action = businessDiagnosisChallenge.nextActionOptions.find(
    (option) => option.id === state.nextAction,
  )
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
    ? `Next action "${action.label}" is ${
        action.consistentWith?.includes(state.primaryHypothesis ?? '') ? 'consistent' : 'weakly linked'
      } with the stated conclusion.`
    : 'No next action selected.'

  const input: ScoringInput = {
    evidence: { score: coverage, note: evidenceNote },
    interpretation: { score: interpretationScore, note: interpretationNote },
    uncertainty: { score: uncertaintyScore, note: uncertaintyNote },
    consistency: { score: consistencyScore, note: consistencyNote },
  }
  return computeScore(businessDiagnosisChallenge, input)
}

function labelFor(hypothesisId: string): string {
  return (
    businessDiagnosisChallenge.hypotheses.find((hypothesis: Hypothesis) => hypothesis.id === hypothesisId)
      ?.label ?? hypothesisId
  )
}

export function buildDecisionRecord(state: ChallengeState): DecisionRecord {
  const reference = referenceFindings()
  const score = scoreSubmission(state)
  const primaryMatches = state.primaryHypothesis === reference.primaryHypothesis
  const secondaryMatches =
    reference.secondaryHypothesis === null
      ? state.secondaryHypothesis === null
      : state.secondaryHypothesis === reference.secondaryHypothesis

  const notes: string[] = []
  if (primaryMatches) notes.push('Your primary conclusion matches the reference reading.')
  else notes.push(`The reference reading treats "${labelFor(reference.primaryHypothesis)}" as the primary driver.`)
  if (reference.secondaryHypothesis !== null) {
    notes.push(
      secondaryMatches
        ? 'You also captured the secondary within-segment component.'
        : 'The reference reading identifies an additional within-segment component you did not select.',
    )
  }

  return {
    challengeId: businessDiagnosisChallenge.id,
    datasetId: DATASET_ID,
    engineVersion: ENGINE_VERSION,
    fingerprint: fingerprint(businessDiagnosisChallenge.id, DATASET_ID, state, score.total),
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

export function datasetRowCount(): number {
  return businessDiagnosisRows.length
}
