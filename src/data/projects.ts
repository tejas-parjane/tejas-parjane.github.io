export type ProjectStatus = 'implemented' | 'in-development' | 'planned'

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
  skills: string[]
  links: ProjectLink[]
  featured: boolean
}

export const statusLabels: Record<ProjectStatus, string> = {
  implemented: 'Implemented',
  'in-development': 'In development',
  planned: 'Planned',
}

export const projects: Project[] = [
  {
    slug: 'jaheeratech',
    name: 'JaheeraTech',
    tagline: 'AI advertising intelligence',
    problem:
      'Advertising teams need to understand what changed, why it changed, and which action to take without treating model output as fact.',
    description:
      'An advertising intelligence workspace that turns campaign signals into evidence, explanations, proposed actions, and approval steps. The live frontend and Meta Ads connector exist; the backend and additional ad-platform integrations are still in development.',
    status: 'in-development',
    statusNote: 'Live frontend and Meta Ads connector. Backend and other integrations in development.',
    skills: ['AI workflows', 'Meta Ads', 'Analytics', 'Product engineering'],
    links: [
      { kind: 'demo', label: 'Live frontend', href: 'https://jaheeratech.com/' },
      { kind: 'case-study', label: 'Case study', href: '/projects/jaheeratech/' },
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
    status: 'implemented',
    statusNote: 'Independent project on synthetic behavioural data. Metrics verified from the repository evaluation log; the small held-out test set limits interpretation.',
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
    slug: 'forecasting-engine',
    name: 'Forecasting & Decision Intelligence Engine',
    tagline: 'Time-series forecasting',
    problem:
      'Forecasts are only useful when model selection, backtesting, uncertainty, and evaluation are explicit and reproducible.',
    description:
      'An open-source forecasting engine with expanding-window backtesting, ARIMA / ETS / XGBoost model selection by sMAPE, uncertainty, explainability, and a FastAPI interface. A live demo is published alongside the repository.',
    status: 'implemented',
    statusNote: 'Independent project on a synthetic single series. Metrics verified from the recorded backtest artifact; validation windows are roughly 109–110 observations, not a 30-step horizon.',
    skills: ['ARIMA', 'ETS', 'XGBoost', 'Backtesting', 'sMAPE'],
    links: [
      {
        kind: 'demo',
        label: 'Live demo',
        href: 'https://tejas-parjane.github.io/forecasting-engine/',
      },
      {
        kind: 'repository',
        label: 'Repository',
        href: 'https://github.com/tejas-parjane/forecasting-engine',
      },
      { kind: 'case-study', label: 'Case study', href: '/projects/forecasting-engine/' },
    ],
    featured: true,
  },
  {
    slug: 'agentci',
    name: 'AgentCI',
    tagline: 'Agent testing and release control',
    problem:
      'AI agents fail in ways ordinary unit tests miss: wrong tools, missing evidence, policy violations, and regressions between runs.',
    description:
      'An open-source CI and release-gate toolkit for AI agents. It captures traces, inspects tool calls, evaluates behavior assertions and policy checks, compares runs, and blocks releases when behavior regresses.',
    status: 'implemented',
    statusNote: 'Early public alpha (v0.1.1). Open source; no hosted demo, so inspect the source and test suite.',
    skills: ['Python', 'Agent traces', 'Policy checks', 'CI/CD'],
    links: [
      { kind: 'repository', label: 'Repository', href: 'https://github.com/tejas-parjane/agentci' },
      { kind: 'case-study', label: 'Case study', href: '/projects/agentci/' },
    ],
    featured: true,
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
  {
    name: 'Business-Intelligent RAG Agent',
    description:
      'An evidence-first retrieval agent with governed SQL and citations, intended to complement core machine-learning work.',
    status: 'in-development',
    statusNote: 'Repository available. Evaluation and case-study write-up are pending.',
    href: 'https://github.com/tejas-parjane/business-intelligent-rag-agent',
  },
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}
