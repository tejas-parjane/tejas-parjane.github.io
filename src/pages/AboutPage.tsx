import { ArrowUpRight, Mail } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { GitHubIcon, LinkedInIcon } from '@/components/ui/BrandIcons'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { PageHeader } from '@/components/ui/PageHeader'
import { profile, resume } from '@/data/profile'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const evidenceTypes = [
  {
    title: 'Observed fact',
    description:
      'Directly supported by a dataset, trace, source file, or verified application behaviour.',
    marker: 'Fact',
  },
  {
    title: 'Hypothesis',
    description:
      'A possible explanation that requires further evidence before it is treated as true.',
    marker: 'Hypothesis',
  },
  {
    title: 'Recommendation',
    description:
      'A proposed action derived from evidence and explicit assumptions, not a statement of fact.',
    marker: 'Recommendation',
  },
]

export function AboutPage() {
  useDocumentMeta(
    'About — Tejas Parjane',
    'Tejas Parjane is a data scientist and AI engineer in Pune working across machine learning, experimentation, AI workflows, and product engineering.',
  )

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="I build systems that make reasoning inspectable."
        description={`Data scientist and AI engineer based in ${profile.location}. I work across machine learning, statistical analysis, forecasting, AI agent workflows, and the interfaces that make those systems usable.`}
      />

      <section aria-labelledby="focus-heading">
        <Container className="grid gap-10 py-14 sm:py-18 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 id="focus-heading" className="text-2xl font-semibold tracking-tight">
              What I focus on
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">
              <p>
                My work sits between analysis and delivery. That means modelling churn and
                propensity, designing evaluation, forecasting time series, and building the
                decision logic and interfaces that put those outputs to use.
              </p>
              <p>
                More recently, I have been building AI campaign and agent systems. The common
                thread is a separation between what a model or agent proposes and what the
                application is allowed to do: evidence stays inspectable, calculations stay
                deterministic, and consequential actions require approval.
              </p>
              <p>
                I am most useful when a problem is ambiguous, the data is imperfect, and the
                output has to survive scrutiny from both technical and business stakeholders.
              </p>
            </div>
          </div>

          <aside className="surface-card h-fit p-6">
            <p className="section-label">Contact</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-2 text-muted transition-colors hover:text-ink"
                >
                  <Mail aria-hidden="true" className="size-4" />
                  {profile.email}
                </a>
              </li>
              <li>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted transition-colors hover:text-ink"
                >
                  <GitHubIcon className="size-4" />
                  github.com/tejas-parjane
                  <ArrowUpRight aria-hidden="true" className="size-3" />
                </a>
              </li>
              <li>
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted transition-colors hover:text-ink"
                >
                  <LinkedInIcon className="size-4" />
                  linkedin.com/in/tejas-parjane
                  <ArrowUpRight aria-hidden="true" className="size-3" />
                </a>
              </li>
            </ul>
            <p className="mt-5 border-t border-line pt-4 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted">
              {profile.location}
            </p>
          </aside>
        </Container>
      </section>

      <section className="border-y border-line bg-surface-2/60" aria-labelledby="principles-heading">
        <Container className="py-14 sm:py-18">
          <div className="max-w-3xl">
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Working principles
            </p>
            <h2
              id="principles-heading"
              className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Keep fact, hypothesis, and recommendation separate.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              This distinction is part of the product, not just the documentation. It makes the
              limits of the evidence visible and prevents a plausible explanation from being
              quietly promoted to a fact.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {evidenceTypes.map((type) => (
              <article key={type.title} className="surface-card p-5">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
                  {type.marker}
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{type.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{type.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="resume-heading">
        <Container className="py-14 sm:py-18">
          <div
            id="resume"
            className="scroll-mt-24 rounded-2xl border border-line bg-surface p-7 sm:p-10"
          >
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Resume
            </p>
            <h2
              id="resume-heading"
              className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              The latest resume is available on request.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              {resume.note} A downloadable PDF will be published here. In the meantime, email me
              and I will send the current version.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={`mailto:${profile.email}?subject=Resume%20request`}>
                <Mail aria-hidden="true" className="size-4" />
                Request resume
              </ButtonLink>
              <ButtonLink href={profile.linkedin} variant="secondary">
                <LinkedInIcon className="size-4" />
                LinkedIn
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
