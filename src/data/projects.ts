export type ProjectStatus = 'verified' | 'live-demo' | 'open-source-alpha' | 'in-development'

export type ProjectLinkKind = 'repository' | 'demo' | 'case-study'

export interface ProjectLink {
  kind: ProjectLinkKind
  label: string
  href: string
}

export interface Project {
  slug: string
  name: string
  tagline: string
  problem: string
  description: string
  status: ProjectStatus
  statusNote: string
  startupRelevance: string
  skills: string[]
  links: ProjectLink[]
  featured: boolean
}

export const statusLabels: Record<ProjectStatus, string> = {
  verified: 'Verified',
  'live-demo': 'Live demo',
  'open-source-alpha': 'Open-source alpha',
  'in-development': 'In development',
}

export const projects: Project[] = [
  {
    slug: 'agentci',
    name: 'AgentCI',
    tagline: 'Agent testing and release control',
    problem:
      'AI agents fail in ways ordinary unit tests miss: wrong tools, missing evidence, policy violations, and regressions between runs.',
    description:
      'An open-source CI and release-gate toolkit for AI agents. It captures traces, inspects tool calls, evaluates behavior assertions and policy checks, compares runs, and blocks releases when behavior regresses.',
    status: 'open-source-alpha',
    statusNote: 'Early public alpha (v0.1.1). Source and deterministic tests are available; no hosted demo.',
    startupRelevance: 'Demonstrates how I would prevent silent AI-agent regressions before release.',
    skills: ['Python', 'Agent traces', 'Policy checks', 'CI/CD'],
    links: [
      { kind: 'repository', label: 'Repository', href: 'https://github.com/tejas-parjane/agentci' },
      { kind: 'case-study', label: 'Case study', href: '/projects/agentci/' },
    ],
    featured: true,
  },
  {
    slug: 'attention-os',
    name: 'Attention-OS',
    tagline: 'Predictive decision systems',
    problem:
      'Prediction alone does not produce a decision. Retention teams need calibrated risk, business context, and a governed next action.',
    description:
      'An open-source predictive decision system covering churn and monetization modeling, stratified evaluation, a rules-based decision engine with guardrails, and a FastAPI service. A live demo is published alongside the repository.',
    status: 'live-demo',
    statusNote: 'Independent project on synthetic behavioural data. Metrics verified from the repository evaluation log; the small held-out test set limits interpretation.',
    startupRelevance: 'Demonstrates the path from prediction through evaluation to a governed next action.',
    skills: ['Scikit-learn', 'XGBoost', 'Model evaluation', 'FastAPI'],
    links: [
      { kind: 'demo', label: 'Live demo', href: 'https://tejas-parjane.github.io/attention-os/' },
      {
        kind: 'repository',
        label: 'Repository',
        href: 'https://github.com/tejas-parjane/attention-os',
      },
      { kind: 'case-study', label: 'Case study', href: '/projects/attention-os/' },
    ],
    featured: true,
  },
  {
    slug: 'business-intelligent-rag-agent',
    name: 'Business-Intelligent RAG Agent',
    tagline: 'Governed, evidence-first RAG',
    problem:
      'Business questions need grounded answers with traceable evidence, without handing database control to a language model.',
    description:
      'An evidence-first BI RAG application using reviewed, application-selected SQL templates, citations, and a deterministic grounded fallback. Broader metric and semantic-retrieval work remains in development.',
    status: 'in-development',
    statusNote: 'The deterministic governed path is documented; deployment and expanded semantic-retrieval validation are still in development.',
    startupRelevance: 'Demonstrates a practical guardrail: models can explain approved data access without generating executable SQL.',
    skills: ['LangChain', 'Governed SQL', 'Citations', 'FastAPI'],
    links: [
      { kind: 'repository', label: 'Repository', href: 'https://github.com/tejas-parjane/business-intelligent-rag-agent' },
      { kind: 'case-study', label: 'Case study', href: '/projects/business-intelligent-rag-agent/' },
    ],
    featured: true,
  },
  {
    slug: 'forecasting-engine',
    name: 'Forecasting & Decision Intelligence Engine',
    tagline: 'Time-series forecasting',
    problem:
      'Forecasts are only useful when model selection, backtesting, uncertainty, and evaluation are explicit and reproducible.',
    description:
      'An open-source forecasting engine with expanding-window backtesting, ARIMA / ETS / XGBoost model selection by sMAPE, uncertainty, explainability, and a FastAPI interface.',
    status: 'live-demo',
    statusNote: 'Independent project on a synthetic single series. Metrics are verified from the recorded backtest artifact; validation windows are roughly 109–110 observations, not a 30-step horizon.',
    startupRelevance: 'Demonstrates disciplined model selection and uncertainty communication before a forecast becomes a decision.',
    skills: ['ARIMA', 'ETS', 'XGBoost', 'Backtesting', 'sMAPE'],
    links: [
      { kind: 'demo', label: 'Live demo', href: 'https://tejas-parjane.github.io/forecasting-engine/' },
      { kind: 'repository', label: 'Repository', href: 'https://github.com/tejas-parjane/forecasting-engine' },
      { kind: 'case-study', label: 'Case study', href: '/projects/forecasting-engine/' },
    ],
    featured: true,
  },
  {
    slug: 'customer-cohort-intelligence',
    name: 'Customer Cohort Intelligence',
    tagline: 'Cohort analysis and retention signals',
    problem:
      'Teams need to see how customer behaviour changes by acquisition cohort before deciding where retention work belongs.',
    description:
      'A customer cohort analysis project that structures retention and behavioural analysis into a decision-ready view. The public repository is the source of record for the current implementation.',
    status: 'verified',
    statusNote: 'Public repository linked below. Detailed case-study evidence is still being prepared.',
    startupRelevance: 'Demonstrates cohort-based analysis as an input to retention and customer-value decisions.',
    skills: ['Python', 'SQL', 'Cohort analysis', 'Data visualisation'],
    links: [
      { kind: 'repository', label: 'Repository', href: 'https://github.com/tejas-parjane/customer-cohort-intelligence' },
      { kind: 'case-study', label: 'Case study', href: '/projects/customer-cohort-intelligence/' },
    ],
    featured: false,
  },
  {
    slug: 'jaheeratech',
    name: 'JaheeraTech',
    tagline: 'AI advertising intelligence',
    problem:
      'Advertising teams need to understand what changed, why it changed, and which action to take without treating model output as fact.',
    description:
      'An advertising intelligence workspace that turns campaign signals into evidence, explanations, proposed actions, and approval steps. The live frontend and Meta Ads connector exist; the backend and additional ad-platform integrations are still in development.',
    status: 'in-development',
    statusNote: 'Live frontend and Meta Ads connector. Backend and other integrations are in development.',
    startupRelevance: 'Demonstrates product judgment: evidence and approval stay visible before automation affects spend.',
    skills: ['AI workflows', 'Meta Ads', 'Analytics', 'Product engineering'],
    links: [
      { kind: 'demo', label: 'Live frontend', href: 'https://jaheeratech.com/' },
      { kind: 'case-study', label: 'Case study', href: '/projects/jaheeratech/' },
    ],
    featured: false,
  },
]

export interface SupportingProject {
  name: string
  description: string
  status: ProjectStatus
  statusNote: string
  href: string
}

export const supportingProjects: SupportingProject[] = [
  {
    name: 'Growth Decision Engine',
    description:
      'Churn prediction and next-best-action scaffolding: feature engineering, model training, decision rules, and a FastAPI / Streamlit interface.',
    status: 'in-development',
    statusNote: 'Repository available. Implementation and results are pending verification for a case study.',
    href: 'https://github.com/tejas-parjane/growth-decision-engine',
  },
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}
