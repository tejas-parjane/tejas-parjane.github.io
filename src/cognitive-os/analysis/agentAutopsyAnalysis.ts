import {
  findTraceEvent,
  knowledgeDocuments,
  traceEvents,
  type AnswerClaim,
  type KnowledgeDocument,
  type PolicyCheckResult,
  type TraceEvent,
  type VersionInfo,
} from '@/cognitive-os/datasets/agentAutopsy'

const ALL = 'all'

export function docById(docId: string): KnowledgeDocument | undefined {
  return knowledgeDocuments.find((doc) => doc.id === docId)
}

export function authoritativeDocument(): KnowledgeDocument | undefined {
  return knowledgeDocuments.find((doc) => doc.authoritative)
}

export function authoritativeDocId(): string | null {
  return authoritativeDocument()?.id ?? null
}

function daysInStatement(statement: string): number | null {
  const match = statement.match(/(\d+)\s*days/)
  return match?.[1] ? Number(match[1]) : null
}

export interface RetrievedDocAudit {
  docId: string
  rank: number
  score: number
  family: string
  version: number
  authoritative: boolean
  supersededOn: string | null
  statement: string
}

export interface RetrievalAudit {
  docs: RetrievedDocAudit[]
  authoritativeDocId: string | null
  authoritativeRank: number | null
  outdatedRank: number | null
  outdatedPresent: boolean
  authoritativePresent: boolean
  staleRankedFirst: boolean
}

/** Joins the retrieval event with the document catalogue to score relevance and freshness. */
export function retrievalAudit(): RetrievalAudit {
  const event = findTraceEvent('ev-04')
  const refs = event?.retrievedDocs ?? []
  const docs: RetrievedDocAudit[] = refs.map((ref) => {
    const doc = docById(ref.docId)
    return {
      docId: ref.docId,
      rank: ref.rank,
      score: ref.score,
      family: doc?.family ?? 'unknown',
      version: doc?.version ?? 0,
      authoritative: doc?.authoritative ?? false,
      supersededOn: doc?.supersededOn ?? null,
      statement: doc?.statement ?? '',
    }
  })

  const authoritative = docs.find((doc) => doc.authoritative)
  const outdated = docs.find((doc) => doc.supersededOn !== null)

  return {
    docs,
    authoritativeDocId: authoritative?.docId ?? null,
    authoritativeRank: authoritative?.rank ?? null,
    outdatedRank: outdated?.rank ?? null,
    outdatedPresent: outdated !== undefined,
    authoritativePresent: authoritative !== undefined,
    staleRankedFirst: (outdated?.rank ?? Infinity) < (authoritative?.rank ?? Infinity),
  }
}

export interface VersionAudit {
  info: VersionInfo[]
  current: VersionInfo | null
  superseded: VersionInfo[]
}

/** Reads the version-check result to identify the current and superseded documents. */
export function versionAudit(): VersionAudit {
  const event = findTraceEvent('ev-06')
  const info = event?.versionInfo ?? []
  return {
    info,
    current: info.find((item) => item.status === 'current') ?? null,
    superseded: info.filter((item) => item.status === 'superseded'),
  }
}

export interface ContextDiff {
  eventId: string
  before: string[]
  after: string[]
  dropped: string[]
  droppedAuthoritative: boolean
  note: string
}

/** Diffs the evidence buffer across the compaction step. */
export function contextDiff(): ContextDiff {
  const update = findTraceEvent('ev-07')
  const compaction = findTraceEvent('ev-08')
  const before = compaction?.buffer?.bufferBefore ?? update?.buffer?.bufferAfter ?? []
  const after = compaction?.buffer?.bufferAfter ?? []
  const dropped = before.filter((id) => !after.includes(id))
  return {
    eventId: compaction?.id ?? 'ev-08',
    before,
    after,
    dropped,
    droppedAuthoritative: authoritativeDocId() !== null && dropped.includes(authoritativeDocId() as string),
    note: compaction?.buffer?.note ?? '',
  }
}

export interface StepAudit {
  step: string
  executed: boolean
}

export interface ToolAudit {
  requiredSteps: string[]
  steps: StepAudit[]
  missingSteps: string[]
  allRequiredCalled: boolean
}

const STEP_PREDICATES: Record<string, (events: TraceEvent[]) => boolean> = {
  search_kb: (events) => events.some((event) => event.toolCall?.tool === 'search_kb'),
  check_doc_version: (events) => events.some((event) => event.toolCall?.tool === 'check_doc_version'),
  policy_check: (events) => events.some((event) => event.type === 'policy_check'),
  synthesize: (events) => events.some((event) => event.type === 'synthesis'),
}

/** Verifies that every step the plan marked required actually ran. */
export function toolAudit(): ToolAudit {
  const plan = findTraceEvent('ev-02')
  const required = plan?.plan?.requiredSteps ?? []
  const steps = required.map((step) => {
    const predicate = STEP_PREDICATES[step]
    return { step, executed: predicate ? predicate(traceEvents) : false }
  })
  const missingSteps = steps.filter((item) => !item.executed).map((item) => item.step)
  return { requiredSteps: required, steps, missingSteps, allRequiredCalled: missingSteps.length === 0 }
}

export interface ClaimSupport {
  claim: string
  valueDays: number
  authoritativeDays: number | null
  supported: boolean
}

export interface AnswerSupport {
  answerDays: number | null
  authoritativeDays: number | null
  supported: boolean
  contradictsTrace: boolean
  citations: string[]
  citesOutdatedSource: boolean
  claims: ClaimSupport[]
}

/** Checks the final answer's claims against the authoritative document in the trace. */
export function answerSupport(): AnswerSupport {
  const response = findTraceEvent('ev-11')
  const authoritative = authoritativeDocument()
  const authoritativeDays = authoritative ? daysInStatement(authoritative.statement) : null
  const answerDays = response?.answer?.claims?.[0]?.valueDays ?? null
  const citations = response?.answer?.citations ?? []

  const claims: ClaimSupport[] = (response?.answer?.claims ?? []).map((claim: AnswerClaim) => ({
    claim: claim.text,
    valueDays: claim.valueDays,
    authoritativeDays,
    supported: authoritativeDays === null ? false : claim.valueDays === authoritativeDays,
  }))

  return {
    answerDays,
    authoritativeDays,
    supported: authoritativeDays !== null && answerDays === authoritativeDays,
    contradictsTrace: authoritativeDays !== null && answerDays !== null && answerDays !== authoritativeDays,
    citations,
    citesOutdatedSource: citations.some((id) => docById(id)?.authoritative === false),
    claims,
  }
}

export interface PolicyAudit {
  checks: PolicyCheckResult[]
  allPassed: boolean
  freshnessRuleEnforced: boolean
  gap: string
}

/** Summarises which policies ran and which did not exist. */
export function policyAudit(): PolicyAudit {
  const event = findTraceEvent('ev-09')
  const checks = event?.policy?.checks ?? []
  const freshnessRuleEnforced = event?.policy?.freshnessRuleEnforced ?? false
  return {
    checks,
    allPassed: checks.length > 0 && checks.every((check) => check.passed),
    freshnessRuleEnforced,
    gap: freshnessRuleEnforced
      ? 'A freshness rule ran.'
      : 'No policy asserted that the answer used the current document version.',
  }
}

export interface SynthesisContext {
  eventId: string
  contextDocIds: string[]
  conflictPresent: boolean
}

/** What the synthesis step actually saw. */
export function synthesisContext(): SynthesisContext {
  const event = findTraceEvent('ev-10')
  const contextDocIds = event?.synthesis?.contextDocIds ?? []
  return { eventId: event?.id ?? 'ev-10', contextDocIds, conflictPresent: contextDocIds.length > 1 }
}

export interface EarliestFailure {
  eventId: string | null
  seq: number | null
  reason: string
  unrecoverable: boolean
}

/**
 * Finds the first event after which the authoritative evidence is gone and never
 * restored: the earliest point at which the outcome became unrecoverable. This is
 * computed from the buffer states, not asserted, so it follows the trace data.
 */
export function earliestFailure(): EarliestFailure {
  const authId = authoritativeDocId()
  if (authId === null) {
    return { eventId: null, seq: null, reason: 'No authoritative document is defined.', unrecoverable: false }
  }

  let lossIndex = -1
  for (let index = 0; index < traceEvents.length; index += 1) {
    const event = traceEvents[index]
    if (!event?.buffer) continue
    const had = event.buffer.bufferBefore.includes(authId)
    const has = event.buffer.bufferAfter.includes(authId)
    if (had && !has) {
      lossIndex = index
      break
    }
  }

  if (lossIndex === -1) {
    return {
      eventId: null,
      seq: null,
      reason: `The authoritative document (${authId}) stays in the buffer for the whole trace.`,
      unrecoverable: false,
    }
  }

  const loss = traceEvents[lossIndex]
  const restoredLater = traceEvents
    .slice(lossIndex + 1)
    .some((event) => event.buffer?.bufferAfter.includes(authId))

  return {
    eventId: loss?.id ?? null,
    seq: loss?.seq ?? null,
    reason: `${loss?.id ?? 'the compaction step'} removes ${authId} from the evidence buffer and never restores it.`,
    unrecoverable: !restoredLater,
  }
}

export interface TraceFilter {
  stage?: string
}

export function filterTrace(filter: TraceFilter = {}): TraceEvent[] {
  if (!filter.stage || filter.stage === ALL) return traceEvents
  return traceEvents.filter((event) => event.stage === filter.stage)
}

export interface AutopsyAnalysis {
  retrieval: RetrievalAudit
  versions: VersionAudit
  context: ContextDiff
  tools: ToolAudit
  answer: AnswerSupport
  policy: PolicyAudit
  synthesis: SynthesisContext
  earliest: EarliestFailure
  contradicted: string[]
  rootCauseEventId: string | null
}

let cached: AutopsyAnalysis | null = null

/** One deterministic reading of the trace that grounds the reference and the rubric. */
export function analyseAutopsy(): AutopsyAnalysis {
  if (cached) return cached

  const retrieval = retrievalAudit()
  const versions = versionAudit()
  const context = contextDiff()
  const tools = toolAudit()
  const answer = answerSupport()
  const policy = policyAudit()
  const synthesis = synthesisContext()
  const earliest = earliestFailure()

  const contradicted: string[] = []
  if (tools.allRequiredCalled) contradicted.push('h-tool-wrong')
  if (policy.allPassed) contradicted.push('h-policy-failed')
  if (!synthesis.conflictPresent) contradicted.push('h-synthesis-ignored')

  cached = {
    retrieval,
    versions,
    context,
    tools,
    answer,
    policy,
    synthesis,
    earliest,
    contradicted,
    rootCauseEventId: earliest.eventId,
  }
  return cached
}
