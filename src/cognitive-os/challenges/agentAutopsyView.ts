import {
  analyseAutopsy,
  filterTrace,
  type AutopsyAnalysis,
  type TraceFilter,
} from '@/cognitive-os/analysis/agentAutopsyAnalysis'
import type { TraceEvent } from '@/cognitive-os/datasets/agentAutopsy'

export interface AgentAutopsyView {
  filter: TraceFilter
  events: TraceEvent[]
  analysis: AutopsyAnalysis
}

/** Everything the Agent Autopsy panels need, scoped to the active trace filter. */
export function buildAgentAutopsyView(filter: TraceFilter): AgentAutopsyView {
  return { filter, events: filterTrace(filter), analysis: analyseAutopsy() }
}
