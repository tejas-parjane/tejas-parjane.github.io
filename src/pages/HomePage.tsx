import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Database,
  FlaskConical,
  Layers,
  Mail,
} from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { GitHubIcon, LinkedInIcon } from '@/components/ui/BrandIcons'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { capabilities } from '@/data/capabilities'
import { experience } from '@/data/experience'
import { profile, resume } from '@/data/profile'
import { projects, supportingProjects } from '@/data/projects'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const capabilityIcons = [Brain, Database, Layers] as const

const challengePreviews = [
  {
    title: 'Business Diagnosis',
    to: '/cognitive-os/business-diagnosis/',
    objective: 'Test competing explanations for a conversion-rate decline.',
    duration: '10–15 min',
    interaction: 'Hypothesis testing · funnel data',
    source: 'Synthetic dataset',
    status: 'available' as const,
  },
  {
    title: 'Agent Autopsy',
    to: '/cognitive-os/agent-autopsy/',
    objective: 'Debug a synthetic agent trace that gave a confident but wrong answer.',
    duration: '10–15 min',
    interaction: 'Trace timeline · root-cause vs symptom',
    source: 'Synthetic seeded trace',
    status: 'available' as const,
  },
  {
    title: 'Hypothesis Arena',
    to: '/cognitive-os/hypothesis-arena/',
    objective: 'Choose experiments by information gain and update beliefs without overclaiming causality.',
    duration: '10–15 min',
    interaction: 'Bayesian beliefs · budgeted experiments',
    source: 'Synthetic activation dataset',
    status: 'available' as const,
  },
]

const openSource = [
  {
    name: 'AgentCI',
    description: 'CI and release gates for AI agents: traces, assertions, policy checks, and diffs.',
    href: 'https://github.com/tejas-parjane/agentci',
  },
  {
    name: 'Attention-OS',
    description: 'Predictive decision system with churn and monetization models and a decision engine.',
    href: 'https://github.com/tejas-parjane/attention-os',
  },
  {
    name: 'Forecasting Engine',
    description: 'Time-series forecasting with expanding-window backtesting and sMAPE model selection.',
    href: 'https://github.com/tejas-parjane/forecasting-engine',
  },
  ...supportingProjects.map((project) => ({
    name: project.name,
    description: project.description,
    href: project.href,
  })),
]

export function HomePage() {
  useDocumentMeta(
    'Tejas Parjane — AI Engineering, Data Science, Product',
    'Tejas Parjane builds data-driven systems and AI-powered applications across machine learning, experimentation, AI workflows, and product engineering.',
  )

  return (
    <>
      <section className="border-b border-line" aria-labelledby="hero-heading">
        <Container className="grid gap-14 py-16 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16 lg:py-24">
          <div>
            <p className="section-label flex flex-wrap items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              {profile.role}
            </p>
            <h1
              id="hero-heading"
              className="mt-6 max-w-3xl text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[4.5rem]"
            >
              From data to intelligence.
              <span className="block text-muted">From intelligence to products.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {profile.supportingCopy}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink to="/projects/">
                Explore Projects
                <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
              <ButtonLink to="/cognitive-os/" variant="secondary">
                <FlaskConical aria-hidden="true" className="size-4" />
                Enter Cognitive OS
              </ButtonLink>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <Link
                to={resume.path}
                className="text-muted transition-colors hover:text-ink"
              >
                View Resume
              </Link>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
              >
                <GitHubIcon className="size-4" />
                GitHub
                <ArrowUpRight aria-hidden="true" className="size-3" />
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
              >
                <LinkedInIcon className="size-4" />
                LinkedIn
                <ArrowUpRight aria-hidden="true" className="size-3" />
              </a>
            </div>
          </div>

          <aside
            aria-label="Capability map"
            className="surface-card h-fit p-6 sm:p-7 lg:mt-2"
          >
            <div className="flex items-center justify-between">
              <p className="section-label">System map</p>
              <span className="font-mono text-[0.625rem] text-muted">v1.0</span>
            </div>
            <ol className="mt-6">
              {capabilities.map((capability, index) => (
                <li key={capability.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < capabilities.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[6px] top-4 h-full w-px bg-line"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="relative mt-1 size-3.5 shrink-0 rounded-full border-2 border-lime bg-surface"
                  />
                  <div>
                    <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{capability.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {capability.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-2 border-t border-line pt-4">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
                Delivery loop
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Signal → evidence → explanation → action → evaluation
              </p>
            </div>
          </aside>
        </Container>
      </section>

      <section aria-labelledby="selected-work-heading">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            id="selected-work-heading"
            eyebrow="Selected work"
            title="Systems built to support decisions."
            description="Each project below states what exists today, what is still being built, and how the work is evaluated. No metrics are published without a documented methodology."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
          <div className="mt-8">
            <ButtonLink to="/projects/" variant="secondary">
              View all projects
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-surface-2/60" aria-labelledby="cognitive-os-heading">
        <Container className="py-16 sm:py-20">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-7 sm:p-10 lg:p-12">
                <p className="section-label flex items-center gap-3">
                  <span aria-hidden="true" className="h-px w-8 bg-lime" />
                  Cognitive OS · Interactive laboratory
                </p>
                <h2
                  id="cognitive-os-heading"
                  className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                >
                  Don't just read how I think. Test it.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
                  Investigate real-world-style problems, challenge assumptions, inspect evidence,
                  and see how decisions change when the evidence changes.
                </p>
                <div className="mt-8">
                  <ButtonLink to="/cognitive-os/">
                    Enter the laboratory
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </ButtonLink>
                </div>
                <p className="mt-5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                  Deterministic · No LLM required · Data sources labelled
                </p>
              </div>

              <div className="border-t border-line bg-surface-2/50 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
                <p className="section-label">Cognitive OS challenges</p>
                <ul className="mt-5 space-y-3">
                  {challengePreviews.map((challenge) => (
                    <li key={challenge.title}>
                      <Link
                        to={challenge.to}
                        className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold">{challenge.title}</p>
                          <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                            {challenge.status === 'available' ? 'Available' : 'In development'} ·{' '}
                            {challenge.duration}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted">
                          {challenge.objective}
                        </p>
                        <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                          {challenge.interaction} · {challenge.source}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="capabilities-heading">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            id="capabilities-heading"
            eyebrow="Technical capabilities"
            title="Three capabilities, one delivery loop."
            description="The work connects modelling, engineering, and product decisions rather than treating them as separate disciplines."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {capabilities.map((capability, index) => {
              const Icon = capabilityIcons[index] ?? Layers
              return (
                <article key={capability.title} className="surface-card p-6">
                  <span className="inline-grid size-10 place-items-center rounded-xl bg-lime/15 text-ink">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {capability.description}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-line pt-4">
                    {capability.items.map((item) => (
                      <li key={item} className="flex gap-2 text-xs text-muted">
                        <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-lime" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-surface-2/60" aria-labelledby="experience-heading">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <header>
              <p className="section-label flex items-center gap-3">
                <span aria-hidden="true" className="h-px w-8 bg-lime" />
                Professional experience
              </p>
              <h2
                id="experience-heading"
                className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
              >
                Analytics and engineering in practice.
              </h2>
            </header>
            <ButtonLink to="/experience/" variant="secondary" className="shrink-0">
              Full experience
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
          </div>
          <ol className="mt-10 border-t border-line">
            {experience.map((item) => (
              <li
                key={`${item.company}-${item.period}`}
                className="grid gap-3 border-b border-line py-6 sm:grid-cols-[0.9fr_1.4fr] sm:gap-8"
              >
                <div>
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                    {item.period}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{item.company}</p>
                  <p className="text-sm text-muted">{item.role}</p>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-muted">{item.summary}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="open-source-heading">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            id="open-source-heading"
            eyebrow="Open source"
            title="Selected repositories."
            description="Public code with documented scope and limitations. Repository descriptions are verified; results are not published until their methodology is checked."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {openSource.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface-card flex h-full flex-col p-5 transition-colors hover:border-line-strong"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.name}</span>
                    <GitHubIcon className="size-4 text-muted" />
                  </span>
                  <span className="mt-2 text-xs leading-relaxed text-muted">
                    {item.description}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                    github.com/tejas-parjane
                    <ArrowUpRight aria-hidden="true" className="size-3" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-line" aria-labelledby="about-heading">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="section-label flex items-center gap-3">
                <span aria-hidden="true" className="h-px w-8 bg-lime" />
                About
              </p>
              <h2
                id="about-heading"
                className="mt-4 text-3xl font-semibold leading-tight tracking-tight"
              >
                Evidence first.
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-base leading-relaxed text-muted">
                I'm a data scientist and AI engineer based in {profile.location}. My work spans
                applied machine learning, statistical analysis, forecasting, AI agent workflows,
                and the interfaces required to make those systems usable. I care about separating
                observed facts from hypotheses, documenting limitations, and testing whether a
                system actually works.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to="/about/" variant="secondary">
                  More about me
                  <ArrowRight aria-hidden="true" className="size-4" />
                </ButtonLink>
                <ButtonLink href={`mailto:${profile.email}`} variant="ghost">
                  <Mail aria-hidden="true" className="size-4" />
                  Get in touch
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
