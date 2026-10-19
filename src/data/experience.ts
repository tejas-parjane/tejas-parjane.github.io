export interface ExperienceItem {
  company: string
  role: string
  period: string
  current: boolean
  summary: string
  highlights: string[]
}

export interface EducationItem {
  qualification: string
  institution: string
  period: string
  detail: string
}

export const experience: ExperienceItem[] = [
  {
    company: 'Building In — Stealth AI Startup',
    role: 'Data & Analytics Engineer',
    period: 'Apr 2026 — Present',
    current: true,
    summary:
      'Building data and analytics foundations for an AI campaign operating system for digital advertising.',
    highlights: [
      'Building an AI campaign operating system that connects advertising platforms such as Meta Ads with analytics and automation workflows.',
      'Designing the underlying data layer end to end: schema, transformation logic, and metric definitions for campaign performance tracking.',
    ],
  },
  {
    company: 'TSL Consulting Pvt Ltd',
    role: 'Data Analyst',
    period: 'Jun 2023 — Apr 2026',
    current: false,
    summary:
      'Analytics, business intelligence, and measurement across 20+ client accounts.',
    highlights: [
      'Built and maintained dbt models on Snowflake to standardise KPI and metric definitions across client engagements.',
      'Designed Power BI dashboards integrating CRM, advertising, and sales data for conversion funnels, ROI, pipeline, and growth metrics.',
      'Automated multi-source ETL workflows with Python and SQL, reducing manual reporting effort by 10+ hours per week.',
      'Ran exploratory, statistical, and trend analyses, including hypothesis testing and A/B and multivariate testing, to inform campaign strategy.',
    ],
  },
  {
    company: 'Kanverse.ai',
    role: 'Junior Data Analyst',
    period: 'May 2022 — Nov 2022',
    current: false,
    summary: 'Data quality and analytical readiness for AI and NLP products.',
    highlights: [
      'Analysed large-scale datasets supporting AI and NLP products, ensuring data quality, consistency, and readiness for model development.',
      'Developed structured preprocessing and validation workflows that improved data-preparation efficiency by 50%.',
    ],
  },
]

export const education: EducationItem[] = [
  {
    qualification: 'Master of Business Administration, Data Science',
    institution: 'Amity University (Online) · Noida',
    period: 'Jan 2024 — May 2026',
    detail: 'GPA 3.20 / 4.00',
  },
  {
    qualification: 'Bachelor of Computer Applications',
    institution: 'Bharati Vidyapeeth College of Engineering · Navi Mumbai',
    period: 'Jul 2018 — Aug 2021',
    detail: 'GPA 3.6 / 4.00',
  },
]

export const certifications: string[] = [
  'IBM Data Analyst Professional Certificate',
  'Google Cloud Skills Boost',
  'Accenture Data Analytics Virtual Experience',
]
