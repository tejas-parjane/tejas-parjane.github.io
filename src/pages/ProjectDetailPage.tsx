import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { GitHubIcon } from '@/components/ui/BrandIcons'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CaseStudyView } from '@/case-studies/CaseStudyView'
import { getCaseStudyBySlug } from '@/case-studies/data'
import { getProjectBySlug, statusLabels, type Project, type ProjectLink } from '@/data/projects'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { NotFoundPage } from '@/pages/NotFoundPage'

function FallbackLink({ link }: { link: ProjectLink }) {
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

function CaseStudyInProgress({ project }: { project: Project }) {
  const externalLinks = project.links.filter((link) => !link.href.startsWith('/'))

  return (
    <Container className="py-14 sm:py-18">
      <div className="rounded-2xl border border-line bg-surface-2 p-6">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
          {statusLabels[project.status]}
        </p>
        <p className="mt-2 text-sm leading-relaxed">{project.statusNote}</p>
      </div>

      <h2 className="mt-10 text-2xl font-semibold tracking-tight">Case study in progress</h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
        A detailed case study for this project is being prepared. It will separate implemented
        functionality from planned work, document the evaluation methodology, and state limitations
        rather than only presenting results. The verified links below point to the current
        implementation.
      </p>

      {externalLinks.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {externalLinks.map((link) => (
            <FallbackLink key={`${link.kind}-${link.href}`} link={link} />
          ))}
        </div>
      ) : null}

      <div className="mt-10">
        <Link
          to="/projects/"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All projects
        </Link>
      </div>
    </Container>
  )
}

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const project = slug ? getProjectBySlug(slug) : undefined
  const study = slug ? getCaseStudyBySlug(slug) : undefined

  useDocumentMeta(
    project ? `${project.name} — Tejas Parjane` : 'Project not found — Tejas Parjane',
    project
      ? `${project.tagline}. ${study ? study.statusNote : 'Implementation status and case-study progress.'}`
      : 'The requested project could not be found.',
  )

  if (!project) return <NotFoundPage />

  return (
    <>
      <PageHeader eyebrow={project.tagline} title={project.name} description={project.problem}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          <span className="text-sm text-muted">{project.statusNote}</span>
        </div>
      </PageHeader>

      {study ? (
        <CaseStudyView study={study} skills={project.skills} />
      ) : (
        <CaseStudyInProgress project={project} />
      )}
    </>
  )
}
