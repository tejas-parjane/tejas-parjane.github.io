import { ArrowUpRight } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { projects, supportingProjects } from '@/data/projects'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export function ProjectsPage() {
  useDocumentMeta(
    'Projects — Tejas Parjane',
    'Selected AI engineering, data science, and product projects with explicit implementation status and verified links.',
  )

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Work, with its implementation status attached."
        description="Every project distinguishes what is implemented, what is in development, and what is planned. Repository and demo links are verified before publication."
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
              Repositories under verification.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              These projects are public, but their implementation details and results have not yet
              been verified for a case study. They are listed with that limitation.
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
