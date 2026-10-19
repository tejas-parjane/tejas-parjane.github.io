import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { GitHubIcon } from '@/components/ui/BrandIcons'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { ProjectCaseStudy, CaseStudyLink } from '@/case-studies/types'
import { ArchitectureFlow } from '@/case-studies/components/ArchitectureFlow'
import { VerificationBadge } from '@/case-studies/components/Badges'
import { ImplementationStatus } from '@/case-studies/components/ImplementationStatus'
import { MetricTable } from '@/case-studies/components/MetricTable'

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-10 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <p key={item} className="max-w-3xl text-base leading-relaxed text-muted">
          {item}
        </p>
      ))}
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid max-w-3xl gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
          <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-lime" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function LinkIcon({ kind }: { kind: CaseStudyLink['kind'] }) {
  if (kind === 'repository') return <GitHubIcon className="size-4" />
  if (kind === 'demo') return <ArrowUpRight aria-hidden="true" className="size-4" />
  return <FileText aria-hidden="true" className="size-4" />
}

function SourceLink({ link }: { link: CaseStudyLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm transition-colors hover:border-line-strong"
    >
      <LinkIcon kind={link.kind} />
      {link.label}
    </a>
  )
}

export function CaseStudyView({
  study,
  skills,
}: {
  study: ProjectCaseStudy
  skills: string[]
}) {
  const { evaluation, implementation } = study

  return (
    <Container className="py-14 sm:py-18">
      <Link
        to="/projects/"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All projects
      </Link>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          <Section id="overview" title="Overview">
            <Paragraphs items={study.overview} />
          </Section>

          <Section id="problem" title="Problem and intended outcome">
            <h3 className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              Problem
            </h3>
            <div className="mt-3">
              <Paragraphs items={study.problem} />
            </div>
            <h3 className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              Intended outcome
            </h3>
            <div className="mt-3">
              <Paragraphs items={study.intendedOutcome} />
            </div>
          </Section>

          <Section id="constraints" title="Constraints and assumptions">
            <h3 className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              Constraints
            </h3>
            <div className="mt-3">
              <Bullets items={study.constraints} />
            </div>
            <h3 className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              Assumptions
            </h3>
            <div className="mt-3">
              <Bullets items={study.assumptions} />
            </div>
          </Section>

          <Section id="architecture" title="Architecture and data flow">
            <ArchitectureFlow steps={study.architecture} />
          </Section>

          <Section id="implementation" title="Implementation status">
            <ImplementationStatus implementation={implementation} />
          </Section>

          {study.demonstration ? (
            <Section id="demonstration" title="Interactive demonstration">
              <div className="rounded-2xl border border-line bg-surface-2 p-5">
                <p className="text-sm leading-relaxed text-muted">{study.demonstration.description}</p>
                <div className="mt-4">
                  <ButtonLink href={study.demonstration.href} variant="secondary">
                    Open demonstration
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </ButtonLink>
                </div>
              </div>
            </Section>
          ) : null}

          <Section id="evaluation" title="Evaluation methodology">
            <Bullets items={evaluation.methodology} />
            {evaluation.caveats.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-5">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
                  Read with care
                </p>
                <ul className="mt-3 space-y-2">
                  {evaluation.caveats.map((caveat) => (
                    <li key={caveat} className="text-sm leading-relaxed text-muted">
                      {caveat}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Section>

          {evaluation.metricGroups.length > 0 ? (
            <Section id="metrics" title="Metrics">
              <MetricTable groups={evaluation.metricGroups} />
            </Section>
          ) : null}

          <Section id="results" title="Results and interpretation">
            <Paragraphs items={study.results} />
          </Section>

          <Section id="limitations" title="Limitations and failure modes">
            <h3 className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              Limitations
            </h3>
            <div className="mt-3">
              <Bullets items={study.limitations} />
            </div>
            <h3 className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
              Failure modes
            </h3>
            <div className="mt-3">
              <Bullets items={study.failureModes} />
            </div>
          </Section>

          <Section id="next" title="What I would improve next">
            <Bullets items={study.nextImprovements} />
          </Section>

          <Section id="sources" title="Sources and links">
            <div className="flex flex-wrap gap-3">
              {study.links.map((link) => (
                <SourceLink key={`${link.kind}-${link.href}`} link={link} />
              ))}
            </div>
          </Section>

          <div className="border-t border-line pt-8">
            <ButtonLink to="/projects/" variant="secondary">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to projects
            </ButtonLink>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="surface-card p-5">
            <p className="section-label">At a glance</p>
            <dl className="mt-4 space-y-3">
              {study.atAGlance.map((item) => (
                <div key={item.label}>
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="surface-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={study.status} />
              <VerificationBadge level={study.verification.level} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">{study.statusNote}</p>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
              {study.verification.note}
            </p>
          </div>

          <div className="surface-card p-5">
            <p className="section-label">Skills</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.625rem] text-muted"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  )
}
