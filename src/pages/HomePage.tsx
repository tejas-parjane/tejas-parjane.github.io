import { ArrowRight, ArrowUpRight, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { GitHubIcon, LinkedInIcon } from '@/components/ui/BrandIcons'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { profile, resume } from '@/data/profile'
import { experience } from '@/data/experience'
import { projects } from '@/data/projects'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const selectedProjects = ['agentci', 'attention-os', 'forecasting-engine']
  .map((slug) => projects.find((project) => project.slug === slug))
  .filter((project) => project !== undefined)

export function HomePage() {
  useDocumentMeta(
    'Tejas Parjane — Applied AI Engineer',
    'Tejas Parjane builds evaluated AI systems, reliable APIs, and decision workflows for startup teams.',
  )

  return (
    <>
      <section className="border-b border-line" aria-labelledby="hero-heading">
        <Container className="py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <p className="section-label">Applied AI engineer · Pune, India</p>
            <h1
              id="hero-heading"
              className="mt-6 text-5xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-7xl"
            >
              I build AI that works <span className="text-muted">in the real world.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
              {profile.supportingCopy} I care about evidence, reliability, and making complex
              systems useful.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href={`mailto:${profile.email}`}>
                <Mail aria-hidden="true" className="size-4" />
                Get in touch
              </ButtonLink>
              <ButtonLink to="/projects/" variant="secondary">
                See my work <ArrowRight aria-hidden="true" className="size-4" />
              </ButtonLink>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="GitHub"
              >
                <GitHubIcon className="size-5" />
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="size-5" />
              </a>
            </div>
            <p className="mt-6 text-sm text-muted">
              {resume.note}{' '}
              <Link to={resume.path} className="link-underline text-ink">
                Request my résumé
              </Link>
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="work-heading">
        <Container className="py-16 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="section-label">Selected work</p>
              <h2 id="work-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                A few things I’ve built.
              </h2>
            </div>
            <Link
              to="/projects/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              All projects <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="mt-10 divide-y divide-line border-y border-line">
            {selectedProjects.map((project) => {
              const repository = project.links.find((link) => link.kind === 'repository')
              const caseStudy = project.links.find((link) => link.kind === 'case-study')
              return (
                <article
                  key={project.slug}
                  className="grid gap-4 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-xl font-semibold tracking-tight">{project.name}</h3>
                      <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                        {project.status.replaceAll('-', ' ')}
                      </span>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {repository ? (
                      <a
                        href={repository.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
                      >
                        GitHub <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </a>
                    ) : null}
                    {caseStudy ? (
                      <Link
                        to={caseStudy.href}
                        className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
                      >
                        Details <ArrowRight aria-hidden="true" className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-surface-2/50" aria-labelledby="lab-heading">
        <Container className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-16">
          <div className="max-w-2xl">
            <p className="section-label">A small interactive demo</p>
            <h2 id="lab-heading" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Want to see how I think through a problem?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Try the AI Lab: short, deterministic exercises using clearly labelled synthetic data.
            </p>
          </div>
          <ButtonLink to="/cognitive-os/" variant="secondary" className="shrink-0">
            Explore the AI Lab <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </Container>
      </section>

      <section aria-labelledby="experience-heading">
        <Container className="py-16 sm:py-24">
          <p className="section-label">Experience</p>
          <h2 id="experience-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Work that shaped my approach.
          </h2>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {experience.map((item) => (
              <li
                key={`${item.company}-${item.period}`}
                className="grid gap-2 py-5 sm:grid-cols-[minmax(220px,0.7fr)_1.3fr] sm:gap-8"
              >
                <div>
                  <p className="text-sm font-semibold">{item.company}</p>
                  <p className="mt-1 text-sm text-muted">{item.role}</p>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                  <p className="text-sm leading-relaxed text-muted">{item.summary}</p>
                  <span className="shrink-0 font-mono text-xs text-muted">{item.period}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            <Link to="/experience/" className="link-underline">
              More experience
            </Link>
            <Link to="/about/" className="link-underline">
              About me
            </Link>
          </div>
        </Container>
      </section>

      <section className="border-t border-line" aria-labelledby="contact-heading">
        <Container className="flex flex-col gap-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-16">
          <div>
            <p className="section-label">Contact</p>
            <h2 id="contact-heading" className="mt-2 text-2xl font-semibold tracking-tight">
              Have a problem worth solving?
            </h2>
          </div>
          <ButtonLink href={`mailto:${profile.email}`}>
            Say hello <ArrowUpRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
