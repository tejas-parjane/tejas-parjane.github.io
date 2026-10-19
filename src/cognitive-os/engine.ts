import {
  ENGINE_VERSION,
  type ChallengeAction,
  type ChallengeDefinition,
  type ChallengeState,
  type ChallengeStepId,
  type CriterionId,
  type DecisionScore,
  type ScoreBand,
  type ScoreCriterion,
} from '@/cognitive-os/types'

export const ALL_FILTER_VALUE = 'all'

export interface CriterionScoreInput {
  score: number
  note: string
}

export type ScoringInput = Record<CriterionId, CriterionScoreInput>

const CRITERION_LABELS: Record<CriterionId, string> = {
  evidence: 'Evidence selection',
  interpretation: 'Correct interpretation',
  uncertainty: 'Uncertainty handling',
  consistency: 'Decision consistency',
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function createInitialState(definition: ChallengeDefinition): ChallengeState {
  const filters: Record<string, string> = {}
  for (const dimension of definition.filters) filters[dimension.id] = ALL_FILTER_VALUE

  const targetSelections: Record<string, string | null> = {}
  for (const group of definition.decisionTargets ?? []) targetSelections[group.id] = null

  const firstStep = definition.steps[0]?.id ?? 'briefing'
  return {
    step: firstStep,
    inspected: [],
    ranComparisons: [],
    filters,
    primaryHypothesis: null,
    secondaryHypothesis: null,
    confidence: null,
    acknowledgedCaveats: [],
    nextAction: null,
    targetSelections,
    experimentsRun: [],
    notes: '',
    submitted: false,
  }
}

export function experimentCost(definition: ChallengeDefinition, ids: readonly string[]): number {
  let total = 0
  for (const id of ids) {
    const experiment = (definition.experiments ?? []).find((item) => item.id === id)
    if (experiment) total += experiment.cost
  }
  return total
}

export function experimentBudget(definition: ChallengeDefinition): number {
  return definition.budget ?? Number.POSITIVE_INFINITY
}

function requiredTargetGroups(definition: ChallengeDefinition) {
  return (definition.decisionTargets ?? []).filter((group) => group.required)
}

function targetSelectionSatisfied(state: ChallengeState, definition: ChallengeDefinition): boolean {
  return requiredTargetGroups(definition).every((group) => {
    const selection = state.targetSelections[group.id]
    return selection !== undefined && selection !== null && hasId(group.options, selection)
  })
}

function stepOrder(definition: ChallengeDefinition): ChallengeStepId[] {
  return definition.steps.map((step) => step.id)
}

function hasId<T extends { id: string }>(items: readonly T[], id: string): boolean {
  return items.some((item) => item.id === id)
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id]
}

/** A step is enterable only if the state can support it. The record step follows submission. */
export function canEnterStep(state: ChallengeState, step: ChallengeStepId, definition: ChallengeDefinition): boolean {
  if (!stepOrder(definition).includes(step)) return false
  if (step === 'record') return state.submitted
  return true
}

export function canSubmit(state: ChallengeState, definition: ChallengeDefinition): boolean {
  return (
    state.primaryHypothesis !== null &&
    hasId(definition.hypotheses, state.primaryHypothesis) &&
    state.confidence !== null &&
    hasId(definition.confidenceOptions, state.confidence) &&
    state.nextAction !== null &&
    hasId(definition.nextActionOptions, state.nextAction) &&
    targetSelectionSatisfied(state, definition) &&
    state.experimentsRun.length >= (definition.minExperiments ?? 0)
  )
}

export function transition(
  state: ChallengeState,
  action: ChallengeAction,
  definition: ChallengeDefinition,
): ChallengeState {
  switch (action.type) {
    case 'GO_TO_STEP': {
      return canEnterStep(state, action.step, definition) ? { ...state, step: action.step } : state
    }
    case 'NEXT_STEP': {
      const order = stepOrder(definition)
      const index = order.indexOf(state.step)
      const next = order[index + 1]
      return next && canEnterStep(state, next, definition) ? { ...state, step: next } : state
    }
    case 'PREVIOUS_STEP': {
      const order = stepOrder(definition)
      const index = order.indexOf(state.step)
      const previous = order[index - 1]
      return previous ? { ...state, step: previous } : state
    }
    case 'INSPECT_EVIDENCE': {
      if (!hasId(definition.evidence, action.id)) return state
      return { ...state, inspected: toggle(state.inspected, action.id) }
    }
    case 'RUN_COMPARISON': {
      const comparison = definition.comparisons.find((item) => item.id === action.id)
      if (!comparison) return state
      const ranComparisons = state.ranComparisons.includes(comparison.id)
        ? state.ranComparisons
        : [...state.ranComparisons, comparison.id]
      const inspected = [...state.inspected]
      for (const evidenceId of comparison.reveals) {
        if (!inspected.includes(evidenceId)) inspected.push(evidenceId)
      }
      return { ...state, ranComparisons, inspected }
    }
    case 'SET_FILTER': {
      const dimension = definition.filters.find((item) => item.id === action.dimension)
      if (!dimension) return state
      const allowed = action.value === ALL_FILTER_VALUE || dimension.values.includes(action.value)
      if (!allowed) return state
      return { ...state, filters: { ...state.filters, [dimension.id]: action.value } }
    }
    case 'SET_PRIMARY_HYPOTHESIS': {
      if (!hasId(definition.hypotheses, action.id)) return state
      const secondary = state.secondaryHypothesis === action.id ? null : state.secondaryHypothesis
      return { ...state, primaryHypothesis: action.id, secondaryHypothesis: secondary }
    }
    case 'SET_SECONDARY_HYPOTHESIS': {
      if (action.id === null) return { ...state, secondaryHypothesis: null }
      if (!hasId(definition.hypotheses, action.id)) return state
      if (action.id === state.primaryHypothesis) return state
      return { ...state, secondaryHypothesis: action.id }
    }
    case 'SET_CONFIDENCE': {
      if (!hasId(definition.confidenceOptions, action.id)) return state
      return { ...state, confidence: action.id }
    }
    case 'TOGGLE_CAVEAT': {
      if (!hasId(definition.caveats, action.id)) return state
      return { ...state, acknowledgedCaveats: toggle(state.acknowledgedCaveats, action.id) }
    }
    case 'SET_NEXT_ACTION': {
      if (!hasId(definition.nextActionOptions, action.id)) return state
      return { ...state, nextAction: action.id }
    }
    case 'SET_TARGET_SELECTION': {
      const group = (definition.decisionTargets ?? []).find((item) => item.id === action.group)
      if (!group) return state
      if (action.id === null) {
        return { ...state, targetSelections: { ...state.targetSelections, [group.id]: null } }
      }
      if (!hasId(group.options, action.id)) return state
      return { ...state, targetSelections: { ...state.targetSelections, [group.id]: action.id } }
    }
    case 'RUN_EXPERIMENT': {
      const experiment = (definition.experiments ?? []).find((item) => item.id === action.id)
      if (!experiment) return state
      if (state.experimentsRun.includes(experiment.id)) return state
      if (experimentCost(definition, state.experimentsRun) + experiment.cost > experimentBudget(definition)) {
        return state
      }
      const experimentsRun = [...state.experimentsRun, experiment.id]
      const inspected = [...state.inspected]
      for (const evidenceId of experiment.reveals) {
        if (!inspected.includes(evidenceId)) inspected.push(evidenceId)
      }
      return { ...state, experimentsRun, inspected }
    }
    case 'SET_NOTES': {
      return { ...state, notes: action.value.slice(0, 2000) }
    }
    case 'SUBMIT': {
      if (!canSubmit(state, definition)) return state
      return { ...state, submitted: true, step: 'record' }
    }
    case 'RESET': {
      return createInitialState(definition)
    }
  }
}

export function validateState(state: ChallengeState, definition: ChallengeDefinition): string[] {
  const problems: string[] = []

  if (!stepOrder(definition).includes(state.step)) problems.push(`Unknown step: ${state.step}`)

  for (const id of state.inspected) {
    if (!hasId(definition.evidence, id)) problems.push(`Unknown evidence: ${id}`)
  }
  for (const id of state.ranComparisons) {
    if (!hasId(definition.comparisons, id)) problems.push(`Unknown comparison: ${id}`)
  }
  if (state.primaryHypothesis !== null && !hasId(definition.hypotheses, state.primaryHypothesis)) {
    problems.push(`Unknown primary hypothesis: ${state.primaryHypothesis}`)
  }
  if (state.secondaryHypothesis !== null) {
    if (!hasId(definition.hypotheses, state.secondaryHypothesis)) {
      problems.push(`Unknown secondary hypothesis: ${state.secondaryHypothesis}`)
    }
    if (state.secondaryHypothesis === state.primaryHypothesis) {
      problems.push('Secondary hypothesis cannot equal the primary hypothesis')
    }
  }
  if (state.confidence !== null && !hasId(definition.confidenceOptions, state.confidence)) {
    problems.push(`Unknown confidence: ${state.confidence}`)
  }
  if (state.nextAction !== null && !hasId(definition.nextActionOptions, state.nextAction)) {
    problems.push(`Unknown next action: ${state.nextAction}`)
  }
  for (const id of state.acknowledgedCaveats) {
    if (!hasId(definition.caveats, id)) problems.push(`Unknown caveat: ${id}`)
  }
  for (const group of definition.decisionTargets ?? []) {
    const selection = state.targetSelections[group.id]
    if (selection === undefined) {
      problems.push(`Missing decision target: ${group.id}`)
    } else if (selection !== null && !hasId(group.options, selection)) {
      problems.push(`Unknown option for decision target ${group.id}: ${selection}`)
    } else if (group.required && selection === null && state.submitted) {
      problems.push(`Required decision target not selected: ${group.id}`)
    }
  }
  for (const id of state.experimentsRun) {
    if (!hasId(definition.experiments ?? [], id)) problems.push(`Unknown experiment: ${id}`)
  }
  if (new Set(state.experimentsRun).size !== state.experimentsRun.length) {
    problems.push('An experiment cannot be run more than once')
  }
  if (experimentCost(definition, state.experimentsRun) > experimentBudget(definition)) {
    problems.push('Experiments exceed the declared budget')
  }
  if (state.submitted && state.experimentsRun.length < (definition.minExperiments ?? 0)) {
    problems.push('Fewer experiments were run than the challenge requires')
  }
  for (const dimension of definition.filters) {
    const value = state.filters[dimension.id]
    if (value === undefined) {
      problems.push(`Missing filter: ${dimension.id}`)
    } else if (value !== ALL_FILTER_VALUE && !dimension.values.includes(value)) {
      problems.push(`Invalid filter value for ${dimension.id}: ${value}`)
    }
  }
  if (state.submitted && !canSubmit(state, definition)) {
    problems.push('State is submitted but does not satisfy the submission requirements')
  }

  return problems
}

export function bandFor(total: number): ScoreBand {
  if (total >= 75) return 'strong'
  if (total >= 50) return 'developing'
  return 'insufficient'
}

export function computeScore(
  definition: ChallengeDefinition,
  input: ScoringInput,
): DecisionScore {
  const ids: CriterionId[] = ['evidence', 'interpretation', 'uncertainty', 'consistency']
  const criteria: ScoreCriterion[] = ids.map((id) => {
    const weight = definition.weights[id]
    const score = clamp01(input[id].score)
    return {
      id,
      label: CRITERION_LABELS[id],
      weight,
      score,
      weighted: weight * score,
      note: input[id].note,
    }
  })

  const total = Math.round(criteria.reduce((sum, criterion) => sum + criterion.weighted, 0) * 100)
  return { total, band: bandFor(total), criteria }
}

function sortRecord(record: Record<string, string>): Array<[string, string]> {
  return Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
}

/** Stable, decision-relevant serialization of state. Excludes UI-only fields. */
export function canonicalState(state: ChallengeState): string {
  return JSON.stringify({
    step: state.step,
    inspected: [...state.inspected].sort(),
    ranComparisons: [...state.ranComparisons].sort(),
    filters: sortRecord(state.filters),
    primaryHypothesis: state.primaryHypothesis,
    secondaryHypothesis: state.secondaryHypothesis,
    confidence: state.confidence,
    acknowledgedCaveats: [...state.acknowledgedCaveats].sort(),
    nextAction: state.nextAction,
    targetSelections: Object.entries(state.targetSelections).sort(([a], [b]) => a.localeCompare(b)),
    experimentsRun: [...state.experimentsRun],
    notes: state.notes.trim(),
    submitted: state.submitted,
  })
}

/** FNV-1a, 32-bit. Small and dependency-free; used only for a visible reproducibility id. */
export function fnv1a(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function fingerprint(
  challengeId: string,
  datasetId: string,
  state: ChallengeState,
  scoreTotal: number,
): string {
  const payload = [challengeId, datasetId, ENGINE_VERSION, canonicalState(state), `score:${scoreTotal}`].join(
    '|',
  )
  return fnv1a(payload)
}
