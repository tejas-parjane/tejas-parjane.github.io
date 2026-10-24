import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const architectureLayers = [
  {
    name: 'Presentation',
    description:
      'React and TypeScript components for layout, navigation, themes, charts, and interactive controls.',
    status: 'verified' as const,
  },
  {
    name: 'Domain logic',
    description:
      'Challenge state transitions, metric calculations, scoring, repair assertions, and decision records kept independent of components.',
    status: 'in-development' as const,
  },
  {
    name: 'Data',
    description:
      'Typed project metadata, synthetic challenge datasets, agent trace fixtures, and reference outcomes with documented provenance.',
    status: 'in-development' as const,
  },
  {
    name: 'Testing',
    description:
      'Unit tests for calculations and state transitions, component tests for interaction, and end-to-end checks for critical journeys.',
    status: 'verified' as const,
  },
  {
    name: 'Deployment',
    description:
      'Static build through GitHub Actions to GitHub Pages, with direct-route fallback and verified asset paths.',
    status: 'verified' as const,
  },
]

const practices = [
  'TypeScript strict mode with explicit data contracts.',
  'Synthetic data is labelled and separated from project artefacts.',
  'Calculations are reproducible and covered by regression tests.',
  'No secrets or provider credentials are shipped in the browser bundle.',
  'Interactive outcomes derive from assertions and calculations, not display-only status labels.',
  'Accessibility and reduced-motion behaviour are treated as acceptance criteria.',
]

export function EngineeringPage() {
  useDocumentMeta(
    'Engineering — Tejas Parjane',
    'Architecture and engineering practices behind the portfolio and the deterministic Cognitive OS laboratory.',
  )

  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="How this system is built and evaluated."
        description="The portfolio is a static React application. The interactive laboratory is designed around deterministic logic, explicit data contracts, and tests rather than presentation-only simulations."
      />

      <section aria-labelledby="layers-heading">
        <Container className="py-14 sm:py-18">
          <h2 id="layers-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Architecture layers
          </h2>
          <ul className="mt-6 border-t border-line">
            {architectureLayers.map((layer) => (
              <li
                key={layer.name}
                className="grid gap-3 border-b border-line py-5 sm:grid-cols-[0.55fr_1.3fr_auto] sm:items-center sm:gap-6"
              >
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                  {layer.name}
                </p>
                <p className="text-sm leading-relaxed text-muted">{layer.description}</p>
                <StatusBadge status={layer.status} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-line bg-surface-2/60" aria-labelledby="practices-heading">
        <Container className="grid gap-10 py-14 sm:py-18 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Practices
            </p>
            <h2
              id="practices-heading"
              className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Constraints that make the work checkable.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The laboratory is being released in stages. Until a challenge is implemented and
              tested, its page states that it is in development instead of presenting a simulated
              result.
            </p>
          </div>
          <ul className="space-y-3">
            {practices.map((practice) => (
              <li
                key={practice}
                className="flex gap-3 rounded-xl border border-line bg-surface px-5 py-4 text-sm leading-relaxed text-muted"
              >
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-lime" />
                {practice}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  )
}
