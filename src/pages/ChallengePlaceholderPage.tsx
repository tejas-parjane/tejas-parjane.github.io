import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

interface ChallengePlaceholderProps {
  title: string
  description: string
  objective: string
  duration: string
  interaction: string
  source: string
  willInclude: string[]
}

export function ChallengePlaceholderPage({
  title,
  description,
  objective,
  duration,
  interaction,
  source,
  willInclude,
}: ChallengePlaceholderProps) {
  useDocumentMeta(
    `${title} — Cognitive OS — Tejas Parjane`,
    `${objective} This challenge is in development.`,
  )

  return (
    <>
      <PageHeader eyebrow="Cognitive OS · Challenge" title={title} description={description}>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />
          In development
        </span>
      </PageHeader>

      <Container className="py-14 sm:py-18">
        <Link
          to="/cognitive-os/"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to the laboratory
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">What this challenge will do</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{objective}</p>

            <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-5">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted">
                Release note
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                This page is a published placeholder. The interactive controls, calculations,
                scoring, and decision record are not enabled yet. They will be enabled only after
                the deterministic implementation and its tests are complete.
              </p>
            </div>

            <h2 className="mt-10 text-2xl font-semibold tracking-tight">Planned interaction</h2>
            <ul className="mt-4 space-y-2">
              {willInclude.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
                >
                  <span className="font-mono text-[0.625rem] text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4">
            <div className="surface-card p-5">
              <p className="section-label">Challenge metadata</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    Duration
                  </dt>
                  <dd className="mt-1 text-muted">{duration}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    Interaction type
                  </dt>
                  <dd className="mt-1 text-muted">{interaction}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    Data source
                  </dt>
                  <dd className="mt-1 text-muted">{source}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    Execution
                  </dt>
                  <dd className="mt-1 text-muted">
                    Browser-only, deterministic, no LLM, no arbitrary code execution.
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </Container>
    </>
  )
}
