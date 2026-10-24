import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { projects, supportingProjects } from '@/data/projects'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export function ProjectsPage() {
  useDocumentMeta(
    'Work — Tejas Parjane',
    'Applied AI engineering work with explicit implementation status, evidence, and limitations.',
  )

  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="Applied AI work, with evidence attached."
        description="Every project states its current status, the evidence available today, and the limitations that remain."
      />

      <section aria-labelledby="featured-projects-heading">
        <Container className="py-14 sm:py-18">
          <h2 id="featured-projects-heading" className="sr-only">
            Featured projects
          </h2>
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-line" aria-labelledby="supporting-projects-heading">
        <Container className="py-14 sm:py-18">
          <div className="max-w-3xl">
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Supporting work
            </p>
            <h2
              id="supporting-projects-heading"
              className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Supporting work.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Public repositories that support the core portfolio story. Their current verification
              status is stated directly rather than inferred from a technology list.
            </p>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {supportingProjects.map((project) => (
              <li key={project.href} className="surface-card flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
                  <StatusBadge status={project.status} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{project.description}</p>
                <p className="mt-4 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted">
                  {project.statusNote}
                </p>
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-medium text-muted transition-colors hover:text-ink"
                >
                  View repository
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  )
}
