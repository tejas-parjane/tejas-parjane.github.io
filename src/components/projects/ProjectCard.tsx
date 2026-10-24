import { Link } from 'react-router-dom'
import { ArrowUpRight, FileText } from 'lucide-react'
import type { Project, ProjectLink } from '@/data/projects'
import { GitHubIcon } from '@/components/ui/BrandIcons'
import { StatusBadge } from '@/components/ui/StatusBadge'

const linkIcons = {
  repository: GitHubIcon,
  demo: ArrowUpRight,
  'case-study': FileText,
} as const

function ProjectLinkItem({ link }: { link: ProjectLink }) {
  const Icon = linkIcons[link.kind]
  const classes =
    'inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink'

  if (link.href.startsWith('/')) {
    return (
      <Link to={link.href} className={classes}>
        {link.label}
        <Icon aria-hidden="true" className="size-3.5" />
      </Link>
    )
  }

  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={classes}>
      {link.label}
      <Icon aria-hidden="true" className="size-3.5" />
    </a>
  )
}

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const caseStudy = project.links.find((link) => link.kind === 'case-study')

  return (
    <article className="surface-card group flex h-full flex-col p-6 transition-colors hover:border-line-strong sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="mt-3 text-xl font-semibold leading-tight tracking-tight">
            {caseStudy ? (
              <Link
                to={caseStudy.href}
                className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors group-hover:decoration-lime"
              >
                {project.name}
              </Link>
            ) : (
              project.name
            )}
          </h3>
          <p className="mt-1 text-sm text-muted">{project.tagline}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-6">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">Problem</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{project.problem}</p>
      </div>

      <p className="mt-4 text-sm leading-relaxed">{project.description}</p>

      <div className="mt-4 border-l-2 border-lime pl-3">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
          Startup relevance
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{project.startupRelevance}</p>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
          Implementation status
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink">{project.statusNote}</p>
      </div>

      <ul className="mt-5 flex flex-wrap gap-1.5" aria-label={`${project.name} skills`}>
        {project.skills.map((skill) => (
          <li
            key={skill}
            className="rounded-full border border-line px-2 py-1 font-mono text-[0.625rem] text-muted"
          >
            {skill}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-6">
        {project.links.map((link) => (
          <ProjectLinkItem key={`${link.kind}-${link.href}`} link={link} />
        ))}
      </div>
    </article>
  )
}
