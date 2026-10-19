import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { certifications, education, experience } from '@/data/experience'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export function ExperiencePage() {
  useDocumentMeta(
    'Experience — Tejas Parjane',
    'Professional experience across data analytics, business intelligence, AI campaign systems, and applied machine learning.',
  )

  return (
    <>
      <PageHeader
        eyebrow="Experience"
        title="Analytics, engineering, and measurement in practice."
        description="Roles where I built reporting systems, statistical analyses, data models, and the workflows that turn them into decisions."
      />

      <section aria-labelledby="roles-heading">
        <Container className="py-14 sm:py-18">
          <h2 id="roles-heading" className="sr-only">
            Roles
          </h2>
          <ol className="border-t border-line">
            {experience.map((item) => (
              <li
                key={`${item.company}-${item.period}`}
                className="grid gap-6 border-b border-line py-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                      {item.period}
                    </p>
                    {item.current ? (
                      <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em]">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">{item.role}</h3>
                  <p className="mt-1 text-sm text-muted">{item.company}</p>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                    {item.summary}
                  </p>
                </div>
                <ul className="space-y-3">
                  {item.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3 text-sm leading-relaxed text-muted">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1 shrink-0 rounded-full bg-lime"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-t border-line bg-surface-2/60" aria-labelledby="education-heading">
        <Container className="grid gap-10 py-14 sm:py-18 lg:grid-cols-2">
          <div>
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Education
            </p>
            <h2
              id="education-heading"
              className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Formal foundations.
            </h2>
            <ul className="mt-6 space-y-4">
              {education.map((item) => (
                <li key={item.qualification} className="surface-card p-5">
                  <p className="text-sm font-semibold">{item.qualification}</p>
                  <p className="mt-1 text-sm text-muted">{item.institution}</p>
                  <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                    {item.period} · {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Certifications
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Continued learning.
            </h2>
            <ul className="mt-6 space-y-3">
              {certifications.map((certification) => (
                <li
                  key={certification}
                  className="rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted"
                >
                  {certification}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  )
}
