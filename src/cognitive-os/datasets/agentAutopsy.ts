// Documented, deterministic synthetic execution trace for the Agent Autopsy challenge.
//
// The trace describes a fictional enterprise knowledge assistant ("Atlas") that
// returns a confident but wrong answer. It is a fixture, not a recording: the tool
// names, payloads, and timings are authored so a debugging pattern is inspectable.
// Latencies are the only generated values and come from a fixed-seed generator, so
// the timeline is byte-identical for every visitor. No figure here is evidence about
// any real system.

export const TRACE_ID = 'agent-autopsy-trace-v1'

const SEED = 20240521

export type TraceStage = 'input' | 'planning' | 'retrieval' | 'state' | 'governance' | 'synthesis'

export type TraceEventType =
  | 'request'
  | 'plan'
  | 'tool_call'
  | 'tool_result'
  | 'retrieval'
  | 'state_update'
  | 'state_compaction'
  | 'policy_check'
  | 'synthesis'
  | 'response'

export type RecordedSeverity = 'info' | 'notice' | 'warning' | 'error'

export interface RetrievedDocRef {
  docId: string
  rank: number
  score: number
}

export interface VersionInfo {
  docId: string
  status: 'current' | 'superseded'
  effective: string
  supersededOn: string | null
}

export interface BufferState {
  bufferBefore: string[]
  bufferAfter: string[]
  note: string
}

export interface PolicyCheckResult {
  id: string
  label: string
  passed: boolean
}

export interface AnswerClaim {
  text: string
  valueDays: number
}

export interface TraceEvent {
  id: string
  seq: number
  /** Relative offset from the request, derived from cumulative latency. */
  at: string
  latencyMs: number
  actor: string
  type: TraceEventType
  stage: TraceStage
  summary: string
  detail: string[]
  recordedSeverity: RecordedSeverity
  toolCall?: { tool: string }
  plan?: { requiredSteps: string[] }
  retrievedDocs?: RetrievedDocRef[]
  versionInfo?: VersionInfo[]
  buffer?: BufferState
  policy?: { checks: PolicyCheckResult[]; rulesCovered: string[]; freshnessRuleEnforced: boolean }
  synthesis?: { contextDocIds: string[] }
  answer?: { text: string; confidence: string; citations: string[]; claims: AnswerClaim[] }
}

export interface KnowledgeDocument {
  id: string
  family: string
  version: number
  effective: string
  supersededOn: string | null
  statement: string
  authoritative: boolean
}

export const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: 'refund-policy-v2',
    family: 'refund-policy',
    version: 2,
    effective: '2023-04-01',
    supersededOn: '2024-01-10',
    statement: 'Refund window: 60 days for all annual plans.',
    authoritative: false,
  },
  {
    id: 'refund-policy-v3',
    family: 'refund-policy',
    version: 3,
    effective: '2024-01-11',
    supersededOn: null,
    statement: 'Refund window: 30 days for enterprise annual contracts.',
    authoritative: true,
  },
  {
    id: 'refund-faq-v1',
    family: 'refund-faq',
    version: 1,
    effective: '2024-02-01',
    supersededOn: null,
    statement: 'Refunds follow the current policy document; do not rely on cached copies.',
    authoritative: false,
  },
]

function createGenerator(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function formatOffset(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const millis = ms % 1000
  return `${seconds}.${String(millis).padStart(3, '0')}s`
}

interface TraceSpec extends Omit<TraceEvent, 'seq' | 'at' | 'latencyMs'> {
  baseLatencyMs: number
}

const SPECS: TraceSpec[] = [
  {
    id: 'ev-01',
    actor: 'user',
    type: 'request',
    stage: 'input',
    summary: 'Refund-window question received',
    detail: [
      'Question: "What is our current standard refund window for enterprise annual contracts?"',
      'Channel: web assistant · locale en-US · no attachments',
    ],
    recordedSeverity: 'info',
    baseLatencyMs: 0,
  },
  {
    id: 'ev-02',
    actor: 'planner',
    type: 'plan',
    stage: 'planning',
    summary: 'Plan selected four required steps',
    detail: [
      'Required: search_kb → check_doc_version → policy_check → synthesize',
      'Budget: 16,000 tokens; every claim in the answer must be cited.',
    ],
    recordedSeverity: 'info',
    plan: { requiredSteps: ['search_kb', 'check_doc_version', 'policy_check', 'synthesize'] },
    baseLatencyMs: 620,
  },
  {
    id: 'ev-03',
    actor: 'agent',
    type: 'tool_call',
    stage: 'retrieval',
    summary: 'search_kb invoked',
    detail: ['tool=search_kb · query="refund window enterprise annual plan" · top_k=3'],
    recordedSeverity: 'info',
    toolCall: { tool: 'search_kb' },
    baseLatencyMs: 480,
  },
  {
    id: 'ev-04',
    actor: 'retriever',
    type: 'retrieval',
    stage: 'retrieval',
    summary: 'Three snippets returned; the outdated version ranked first',
    detail: [
      'rank 1 · refund-policy-v2 (0.91) · "Refund window: 60 days for all annual plans."',
      'rank 2 · refund-policy-v3 (0.88) · "Refund window: 30 days for enterprise annual contracts."',
      'rank 3 · refund-faq-v1 (0.64) · "Refunds follow the current policy document."',
    ],
    recordedSeverity: 'notice',
    retrievedDocs: [
      { docId: 'refund-policy-v2', rank: 1, score: 0.91 },
      { docId: 'refund-policy-v3', rank: 2, score: 0.88 },
      { docId: 'refund-faq-v1', rank: 3, score: 0.64 },
    ],
    baseLatencyMs: 910,
  },
  {
    id: 'ev-05',
    actor: 'agent',
    type: 'tool_call',
    stage: 'retrieval',
    summary: 'check_doc_version invoked',
    detail: ['tool=check_doc_version · doc_ids=[refund-policy-v2, refund-policy-v3]'],
    recordedSeverity: 'info',
    toolCall: { tool: 'check_doc_version' },
    baseLatencyMs: 540,
  },
  {
    id: 'ev-06',
    actor: 'tool:check_doc_version',
    type: 'tool_result',
    stage: 'retrieval',
    summary: 'Document-version check: v3 is current',
    detail: [
      'refund-policy-v2 · superseded 2024-01-10',
      'refund-policy-v3 · current since 2024-01-11 (refund window 30 days)',
    ],
    recordedSeverity: 'info',
    versionInfo: [
      {
        docId: 'refund-policy-v2',
        status: 'superseded',
        effective: '2023-04-01',
        supersededOn: '2024-01-10',
      },
      {
        docId: 'refund-policy-v3',
        status: 'current',
        effective: '2024-01-11',
        supersededOn: null,
      },
    ],
    baseLatencyMs: 760,
  },
  {
    id: 'ev-07',
    actor: 'state',
    type: 'state_update',
    stage: 'state',
    summary: 'Evidence buffer assembled; context over budget',
    detail: [
      'buffer=[refund-policy-v2 snippet, refund-policy-v3 chunk, doc-version result]',
      'context 18,420 / 16,000 tokens → compaction required',
    ],
    recordedSeverity: 'warning',
    buffer: {
      bufferBefore: ['refund-policy-v2', 'refund-policy-v3', 'doc-version-result'],
      bufferAfter: ['refund-policy-v2', 'refund-policy-v3', 'doc-version-result'],
      note: 'Assembled before compaction; the current chunk is present.',
    },
    baseLatencyMs: 400,
  },
  {
    id: 'ev-08',
    actor: 'state',
    type: 'state_compaction',
    stage: 'state',
    summary: 'Context compaction dropped the current policy chunk',
    detail: [
      'dedupe key = document family; keeps the first occurrence seen',
      'kept refund-policy-v2 (rank 1) · dropped the refund-policy-v3 chunk',
      'tool_result metadata is not inlined, so the version check is not carried into context',
      'buffer now=[refund-policy-v2 snippet] · 1,910 tokens · 6,100 lost',
    ],
    recordedSeverity: 'error',
    buffer: {
      bufferBefore: ['refund-policy-v2', 'refund-policy-v3', 'doc-version-result'],
      bufferAfter: ['refund-policy-v2'],
      note: 'Compaction kept the first version per document family and discarded the current chunk.',
    },
    baseLatencyMs: 1180,
  },
  {
    id: 'ev-09',
    actor: 'guardrails',
    type: 'policy_check',
    stage: 'governance',
    summary: 'Output policy check passed',
    detail: [
      'pii_scan=pass · permission=pass · output_filter=pass',
      'No rule asserts source freshness or citation validity.',
    ],
    recordedSeverity: 'info',
    policy: {
      checks: [
        { id: 'pii_scan', label: 'PII scan', passed: true },
        { id: 'permission', label: 'Permission', passed: true },
        { id: 'output_filter', label: 'Output filter', passed: true },
      ],
      rulesCovered: ['pii', 'permission', 'output_filter'],
      freshnessRuleEnforced: false,
    },
    baseLatencyMs: 690,
  },
  {
    id: 'ev-10',
    actor: 'synthesizer',
    type: 'synthesis',
    stage: 'synthesis',
    summary: 'Answer synthesized from the compacted buffer',
    detail: [
      'context doc ids=[refund-policy-v2]',
      'output: "60 days" · confidence high · no citation to refund-policy-v3',
    ],
    recordedSeverity: 'notice',
    synthesis: { contextDocIds: ['refund-policy-v2'] },
    baseLatencyMs: 1240,
  },
  {
    id: 'ev-11',
    actor: 'agent',
    type: 'response',
    stage: 'synthesis',
    summary: 'Final answer returned with high confidence',
    detail: [
      'answer="The standard refund window for enterprise annual contracts is 60 days."',
      'confidence=high · citations=[refund-policy-v2]',
    ],
    recordedSeverity: 'error',
    answer: {
      text: 'The standard refund window for enterprise annual contracts is 60 days.',
      confidence: 'high',
      citations: ['refund-policy-v2'],
      claims: [{ text: 'Refund window is 60 days', valueDays: 60 }],
    },
    baseLatencyMs: 720,
  },
]

function buildTrace(specs: TraceSpec[]): TraceEvent[] {
  const random = createGenerator(SEED)
  let elapsed = 0
  return specs.map((spec, index) => {
    const jitter = spec.baseLatencyMs === 0 ? 0 : (random() * 2 - 1) * 0.12
    const latencyMs = Math.max(0, Math.round(spec.baseLatencyMs * (1 + jitter)))
    elapsed += latencyMs
    const { baseLatencyMs: _baseLatencyMs, ...rest } = spec
    return { ...rest, seq: index + 1, latencyMs, at: formatOffset(elapsed) }
  })
}

export const traceEvents: TraceEvent[] = buildTrace(SPECS)

export function findTraceEvent(id: string): TraceEvent | undefined {
  return traceEvents.find((event) => event.id === id)
}

export const TRACE_STAGES: TraceStage[] = [
  'planning',
  'retrieval',
  'state',
  'governance',
  'synthesis',
]

export const STAGE_LABELS: Record<TraceStage, string> = {
  input: 'Input',
  planning: 'Planning',
  retrieval: 'Retrieval',
  state: 'State',
  governance: 'Governance',
  synthesis: 'Synthesis',
}

const expectedDoc = knowledgeDocuments.find((doc) => doc.authoritative)

export const agentAutopsyMeta = {
  id: TRACE_ID,
  name: 'Synthetic enterprise knowledge-assistant trace',
  assistant: 'Atlas Enterprise Assistant (fictional)',
  seed: SEED,
  events: traceEvents.length,
  question: 'What is our current standard refund window for enterprise annual contracts?',
  answerReturned: '60 days (high confidence)',
  correctAnswer: expectedDoc
    ? `${expectedDoc.statement.match(/(\d+)\s*days/)?.[1] ?? '30'} days, per ${expectedDoc.id}`
    : '30 days',
  requiredSteps: ['search_kb', 'check_doc_version', 'policy_check', 'synthesize'],
  disclaimer:
    'Synthetic incident trace. It is authored to make one debugging pattern inspectable, and is not a recording of any real deployment or model output.',
  generation: [
    'The trace is a fixed fixture: actors, tool calls, payloads, and the final answer are authored constants, not sampled at runtime.',
    'Latencies are the only generated values. A fixed-seed linear congruential generator adds a bounded ±12% jitter to each base latency; the recorded offsets are the cumulative sums.',
    'The pipeline runs four required steps — search_kb, check_doc_version, policy_check, synthesize — in that order.',
    'Retrieval returns one outdated and one current policy document; a version-check tool then confirms which is current.',
    'A token budget (16,000) forces a context compaction step between retrieval and synthesis.',
    'The timeline is byte-identical on every load, so any finding can be reproduced from the same events.',
  ],
} as const
