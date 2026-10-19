import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { GitHubIcon } from '@/components/ui/BrandIcons'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProjectBySlug, statusLabels, type ProjectLink } from '@/data/projects'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { NotFoundPage } from '@/pages/NotFoundPage'

const caseStudySections = [
  'Overview',
  'Problem and intended outcome',
  'Constraints and assumptions',
  'Architecture and data flow',
  'Technical implementation',
  'Interactive demonstration, where available',
  'Evaluation methodology',
  'Results and interpretation',
  'Failure modes and limitations',
  'What I would improve next',
  'Source repository and live demo',
]

function ExternalLink({ link }: { link: ProjectLink }) {
  const Icon = link.kind === 'repository' ? GitHubIcon : ArrowUpRight
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm transition-colors hover:border-line-strong"
    >
      <Icon aria-hidden="true" className="size-4" />
      {link.label}
    </a>
  )
}

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const project = slug ? getProjectBySlug(slug) : undefined

  useDocumentMeta(
    project ? `${project.name} — Tejas Parjane` : 'Project not found — Tejas Parjane',
    project
      ? `${project.tagline}. Implementation status, verified links, and case-study progress.`
      : 'The requested project could not be found.',
  )

  if (!project) return <NotFoundPage />

  const externalLinks = project.links.filter((link) => !link.href.startsWith('/'))

  return (
    <>
      <PageHeader
        eyebrow={project.tagline}
        title={project.name}
        description={project.problem}
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          <span className="text-sm text-muted">{project.statusNote}</span>
        </div>
      </PageHeader>

      <Container className="py-14 sm:py-18">
        <Link
          to="/projects/"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All projects
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Current status</h2>
            <div className="mt-4 rounded-2xl border border-line bg-surface-2 p-5">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
                {statusLabels[project.status]}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{project.statusNote}</p>
            </div>

            <h2 className="mt-10 text-2xl font-semibold tracking-tight">Case study in progress</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              The full case study for this project is being prepared. It will separate implemented
              functionality from planned work, document the evaluation methodology, and state
              limitations rather than only presenting results.
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
              In the meantime, the verified links below point to the current implementation.
            </p>

            {externalLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {externalLinks.map((link) => (
                  <ExternalLink key={`${link.kind}-${link.href}`} link={link} />
                ))}
              </div>
            ) : null}

            <h2 className="mt-10 text-2xl font-semibold tracking-tight">
              What the case study will cover
            </h2>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {caseStudySections.map((section, index) => (
                <li
                  key={section}
                  className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
                >
                  <span className="font-mono text-[0.625rem] text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section}
                </li>
              ))}
            </ol>
          </div>

          <aside className="space-y-5">
            <div className="surface-card p-5">
              <p className="section-label">Skills</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {project.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.625rem] text-muted"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card p-5">
              <p className="section-label">Supporting evidence</p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Claims on this page are limited to repository descriptions and verified
                destinations. No performance metrics are published until the underlying dataset,
                split, metric definitions, and evaluation design have been checked.
              </p>
            </div>

            <div className="surface-card p-5">
              <p className="section-label">Read next</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link to="/cognitive-os/" className="text-muted hover:text-ink">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText aria-hidden="true" className="size-3.5" />
                      Cognitive OS laboratory
                    </span>
                  </Link>
                </li>
                <li>
                  <Link to="/engineering/" className="text-muted hover:text-ink">
                    Engineering practice
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-12 border-t border-line pt-8">
          <ButtonLink to="/projects/" variant="secondary">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to projects
          </ButtonLink>
        </div>
      </Container>
    </>
  )
}
