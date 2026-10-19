export interface Capability {
  title: string
  description: string
  items: string[]
}

export const capabilities: Capability[] = [
  {
    title: 'AI Engineering',
    description:
      'Designing AI applications and agent workflows with explicit tool boundaries, structured outputs, and evaluation.',
    items: [
      'LLM APIs and agent workflows',
      'Tool integration and guardrails',
      'Structured outputs and validation',
      'Evaluation and failure analysis',
      'FastAPI and Streamlit services',
    ],
  },
  {
    title: 'Data Science',
    description:
      'Statistical analysis, predictive modelling, experimentation, and forecasting with reproducible evaluation.',
    items: [
      'Python, pandas, NumPy, scikit-learn',
      'SQL and dbt on Snowflake',
      'Hypothesis and A/B testing',
      'Churn and propensity modelling',
      'Time-series backtesting',
    ],
  },
  {
    title: 'Product Building',
    description:
      'Turning business problems into usable interfaces, decision workflows, and intelligent systems.',
    items: [
      'React and TypeScript interfaces',
      'Dashboards and data visualisation',
      'KPI and metric definition',
      'Decision and approval workflows',
      'Technical communication',
    ],
  },
]
