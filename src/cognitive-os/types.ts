// Shared, framework-agnostic contract for the Cognitive OS challenges.
// Everything here is data or pure-function shaped so the deterministic core can
// be tested without rendering and reused by more than one challenge.

export const ENGINE_VERSION = '1.0.0'

export type ChallengeStepId = 'briefing' | 'investigating' | 'deciding' | 'record'

export interface ChallengeStep {
  id: ChallengeStepId
  label: string
  description: string
}

export type HypothesisKind =
  | 'composition'
  | 'within-segment'
  | 'measurement'
  | 'external'
  | 'none'
  // Agent Autopsy kinds: failure modes rather than metric mechanisms.
  | 'retrieval'
  | 'tooling'
  | 'state'
  | 'synthesis'
  | 'policy'
  | 'symptom'
  | 'environment'

export interface Hypothesis {
  id: string
  label: string
  statement: string
  kind: HypothesisKind
  /** Hypothesis ids this statement is mutually exclusive with as a sole cause. */
  conflictsWith?: string[]
}

export type EvidenceId = string
export type ComparisonId = string
export type FilterDimensionId = string

export interface EvidenceItem {
  id: EvidenceId
  title: string
  /** The decision question this evidence helps answer. */
  question: string
  /** Documented, human-readable description of how the value is computed. */
  method: string
  /** Hypothesis ids this evidence helps separate. */
  discriminates: string[]
  /** Designed information value in [0, 1]; the evidence-coverage rubric uses these. */
  weight: number
}

export interface ComparisonDefinition {
  id: ComparisonId
  label: string
  description: string
  /** Evidence that becomes available/inspected when this comparison is run. */
  reveals: EvidenceId[]
}

export interface FilterDimension {
  id: FilterDimensionId
  label: string
  values: string[]
}

export interface DecisionOption {
  id: string
  label: string
  description: string
  /** For next-action options: hypothesis ids this action is consistent with. */
  consistentWith?: string[]
  /** For next-action options: the cost or downside a careful decision should state. */
  tradeoffs?: string
}

/**
 * A decision the challenge requires beyond the hypothesis: a locus, a stage, or
 * any other choice the state machine must gate and fingerprint. Business
 * Diagnosis has none; Agent Autopsy uses one to name the earliest failure.
 */
export interface DecisionTargetGroup {
  id: string
  label: string
  description: string
  options: DecisionOption[]
  /** When true, the challenge cannot be submitted until a valid option is chosen. */
  required: boolean
}

export interface Caveat {
  id: string
  label: string
  kind: 'limitation' | 'scope'
  required: boolean
}

export interface ScoringWeights {
  evidence: number
  interpretation: number
  uncertainty: number
  consistency: number
}

export interface ChallengeDefinition {
  id: string
  title: string
  steps: ChallengeStep[]
  hypotheses: Hypothesis[]
  evidence: EvidenceItem[]
  comparisons: ComparisonDefinition[]
  filters: FilterDimension[]
  confidenceOptions: DecisionOption[]
  nextActionOptions: DecisionOption[]
  caveats: Caveat[]
  /** Extra required decisions beyond the hypothesis pair. Omitted when unused. */
  decisionTargets?: DecisionTargetGroup[]
  /** Evidence the interpretation rubric treats as discriminating and necessary. */
  keyEvidence: EvidenceId[]
  weights: ScoringWeights
}

export interface ChallengeState {
  step: ChallengeStepId
  inspected: EvidenceId[]
  ranComparisons: ComparisonId[]
  filters: Record<FilterDimensionId, string>
  primaryHypothesis: string | null
  secondaryHypothesis: string | null
  confidence: string | null
  acknowledgedCaveats: string[]
  nextAction: string | null
  /** Selections for each declared decision target group, keyed by group id. */
  targetSelections: Record<string, string | null>
  notes: string
  submitted: boolean
}

export type ChallengeAction =
  | { type: 'GO_TO_STEP'; step: ChallengeStepId }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'INSPECT_EVIDENCE'; id: EvidenceId }
  | { type: 'RUN_COMPARISON'; id: ComparisonId }
  | { type: 'SET_FILTER'; dimension: FilterDimensionId; value: string }
  | { type: 'SET_PRIMARY_HYPOTHESIS'; id: string }
  | { type: 'SET_SECONDARY_HYPOTHESIS'; id: string | null }
  | { type: 'SET_CONFIDENCE'; id: string }
  | { type: 'TOGGLE_CAVEAT'; id: string }
  | { type: 'SET_NEXT_ACTION'; id: string }
  | { type: 'SET_TARGET_SELECTION'; group: string; id: string | null }
  | { type: 'SET_NOTES'; value: string }
  | { type: 'SUBMIT' }
  | { type: 'RESET' }

export type CriterionId = 'evidence' | 'interpretation' | 'uncertainty' | 'consistency'

export type ScoreBand = 'strong' | 'developing' | 'insufficient'

export interface ScoreCriterion {
  id: CriterionId
  label: string
  weight: number
  score: number
  weighted: number
  note: string
}

export interface DecisionScore {
  total: number
  band: ScoreBand
  criteria: ScoreCriterion[]
}

/** A reading of the dataset used to ground both the reference answer and the rubric. */
export interface ReferenceFindings {
  primaryHypothesis: string
  secondaryHypothesis: string | null
  confidence: string
  statement: string
  facts: string[]
  assumptions: string[]
  uncertainty: string[]
}

export interface DecisionRecord {
  challengeId: string
  datasetId: string
  engineVersion: string
  fingerprint: string
  submittedPrimary: string | null
  submittedSecondary: string | null
  confidence: string | null
  nextAction: string | null
  acknowledgedCaveats: string[]
  targetSelections: Record<string, string | null>
  inspectedEvidence: EvidenceId[]
  ranComparisons: ComparisonId[]
  filters: Record<FilterDimensionId, string>
  score: DecisionScore
  agreement: {
    primaryMatches: boolean
    secondaryMatches: boolean
    notes: string[]
  }
  reference: ReferenceFindings
}
