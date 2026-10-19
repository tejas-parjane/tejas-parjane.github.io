import type { ProjectStatus } from '@/data/projects'

export type DataProvenance = 'synthetic' | 'simulated' | 'real-world'

export type MetricRole =
  | 'validation'
  | 'held-out-test'
  | 'threshold-sweep'
  | 'simulated-experiment'
  | 'backtest-fold'

export type VerificationLevel = 'verified-from-source' | 'owner-reported' | 'not-verified'

export interface CaseStudyMetric {
  label: string
  value: string
  definition: string
  provenance: DataProvenance
  role: MetricRole
  scope?: string
  caveat?: string
}

export interface CaseStudyMetricGroup {
  name: string
  note?: string
  metrics: CaseStudyMetric[]
}

export type CaseStudyLinkKind = 'repository' | 'demo' | 'source' | 'documentation'

export interface CaseStudyLink {
  label: string
  href: string
  kind: CaseStudyLinkKind
}

export interface CaseStudyVerification {
  level: VerificationLevel
  note: string
}

export interface ProjectCaseStudy {
  slug: string
  title: string
  status: ProjectStatus
  statusNote: string
  verification: CaseStudyVerification
  atAGlance: Array<{ label: string; value: string }>
  overview: string[]
  problem: string[]
  intendedOutcome: string[]
  constraints: string[]
  assumptions: string[]
  architecture: Array<{ step: string; detail: string }>
  implementation: {
    implemented: string[]
    inDevelopment: string[]
    planned: string[]
  }
  demonstration?: {
    description: string
    href: string
    isHosted: boolean
  }
  evaluation: {
    methodology: string[]
    metricGroups: CaseStudyMetricGroup[]
    caveats: string[]
  }
  results: string[]
  limitations: string[]
  failureModes: string[]
  nextImprovements: string[]
  links: CaseStudyLink[]
}

export const provenanceLabels: Record<DataProvenance, string> = {
  synthetic: 'Synthetic',
  simulated: 'Simulated',
  'real-world': 'Real-world',
}

export const metricRoleLabels: Record<MetricRole, string> = {
  validation: 'Validation',
  'held-out-test': 'Held-out test',
  'threshold-sweep': 'Threshold sweep',
  'simulated-experiment': 'Simulated experiment',
  'backtest-fold': 'Backtest folds',
}

export const verificationLabels: Record<VerificationLevel, string> = {
  'verified-from-source': 'Verified from source',
  'owner-reported': 'Owner-reported',
  'not-verified': 'Not verified',
}
