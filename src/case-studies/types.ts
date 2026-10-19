import type { ProjectStatus } from '@/data/projects'

export interface CaseStudySection {
  heading: string
  body: string[]
}

export interface CaseStudyMetric {
  label: string
  value: string
  definition: string
  verification: 'verified' | 'pending' | 'not-applicable'
}

export interface ProjectCaseStudy {
  slug: string
  title: string
  overview: string
  problem: string
  intendedOutcome: string
  constraints: string[]
  assumptions: string[]
  architecture: string[]
  implementation: {
    status: ProjectStatus
    implemented: string[]
    inDevelopment: string[]
    planned: string[]
  }
  demonstration?: {
    description: string
    href: string
  }
  evaluation: {
    methodology: string
    metrics: CaseStudyMetric[]
  }
  results: string[]
  limitations: string[]
  failureModes: string[]
  nextImprovements: string[]
  links: Array<{ label: string; href: string }>
  sections: CaseStudySection[]
}
