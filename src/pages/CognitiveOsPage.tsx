import { Link } from 'react-router-dom'
import { ArrowRight, Clock, FlaskConical, ShieldCheck } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const challenges = [
  {
    title: 'Business Diagnosis',
    to: '/cognitive-os/business-diagnosis/',
    objective: 'Investigate a decline in conversion rate using synthetic funnel and campaign data.',
    duration: '10–15 minutes',
    interaction: 'Select hypotheses, inspect evidence, filter dimensions, and run predefined comparisons.',
    source: 'Synthetic dataset bundled with the site',
    status: 'available' as const,
  },
  {
    title: 'Agent Autopsy',
    to: '/cognitive-os/agent-autopsy/',
    objective: 'Debug a synthetic AI agent trace that returned a confident but incorrect answer.',
    duration: '10–15 minutes',
    interaction: 'Walk the timeline, inspect evidence, name the earliest failure, and submit a scored diagnosis.',
    source: 'Synthetic seeded trace fixture',
    status: 'available' as const,
  },
  {
    title: 'Hypothesis Arena',
    to: '/cognitive-os/hypothesis-arena/',
    objective: 'Compare explanations for an activation decline and choose experiments under a budget.',
    duration: '10–15 minutes',
    interaction: 'Rank experiments by information gain, run them within a budget, and update beliefs.',
    source: 'Synthetic seeded activation dataset',
    status: 'available' as const,
  },
]

const loop = [
  'Select a challenge.',
  'Read the problem statement.',
  'Inspect the available evidence.',
  'Compare competing hypotheses.',
  'Run an experiment or change an assumption.',
  'Observe how the calculations change.',
  'Review the recommended decision.',
  'Inspect uncertainty and alternative explanations.',
]

export function CognitiveOsPage() {
  useDocumentMeta(
    'Cognitive OS — Tejas Parjane',
    'An interactive laboratory for investigating problems with evidence, hypotheses, experiments, and explicit decision criteria. Deterministic and browser-only.',
  )

  return (
    <>
      <PageHeader
        eyebrow="Cognitive OS · Interactive laboratory"
        title="Investigate. Challenge. Decide."
        description="A structured environment for examining problems the way an analyst should: separate evidence from explanation, test assumptions, and state what remains uncertain."
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <FlaskConical aria-hidden="true" className="size-4" />
            Deterministic, no LLM required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="size-4" />
            No arbitrary code execution
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" />
            10–15 minutes per challenge
          </span>
        </div>
      </PageHeader>

      <section aria-labelledby="challenges-heading">
        <Container className="py-14 sm:py-18">
          <div className="max-w-3xl">
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Laboratory status
            </p>
            <h2
              id="challenges-heading"
              className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Three challenges, all interactive.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Business Diagnosis, Agent Autopsy, and Hypothesis Arena are fully interactive: inspect evidence, run
              comparisons or budgeted experiments, and submit a scored conclusion, diagnosis, or decision.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {challenges.map((challenge, index) => (
              <article key={challenge.title} className="surface-card flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <span
                    className={
                      'rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] ' +
                      (challenge.status === 'available'
                        ? 'border-lime/60 bg-lime/15 text-ink'
                        : 'border-line bg-surface-2 text-muted')
                    }
                  >
                    {challenge.status === 'available' ? 'Available' : 'In development'}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{challenge.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{challenge.objective}</p>

                <dl className="mt-5 space-y-3 border-t border-line pt-4 text-xs">
                  <div>
                    <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                      Interaction
                    </dt>
                    <dd className="mt-1 leading-relaxed text-muted">{challenge.interaction}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                      Data source
                    </dt>
                    <dd className="mt-1 leading-relaxed text-muted">{challenge.source}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                      Duration
                    </dt>
                    <dd className="mt-1 leading-relaxed text-muted">{challenge.duration}</dd>
                  </div>
                </dl>

                <Link
                  to={challenge.to}
                  className="mt-auto inline-flex items-center gap-1.5 pt-6 text-xs font-medium text-muted transition-colors hover:text-ink"
                >
                  {challenge.status === 'available' ? 'Start challenge' : 'View challenge'}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-surface-2/60" aria-labelledby="loop-heading">
        <Container className="grid gap-10 py-14 sm:py-18 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Core interaction loop
            </p>
            <h2
              id="loop-heading"
              className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Learn by exploring, not by reading a finished answer.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A completed challenge produces a decision record: the evidence examined, the
              calculations used, supporting and contradicting evidence, uncertainty, limitations,
              and the next information required.
            </p>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {loop.map((step, index) => (
              <li
                key={step}
                className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
              >
                <span className="font-mono text-[0.625rem] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="scoring-heading">
        <Container className="py-14 sm:py-18">
          <div className="max-w-3xl">
            <p className="section-label flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Scoring
            </p>
            <h2
              id="scoring-heading"
              className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Evidence quality, not confidence.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The planned rubric weights evidence selection, interpretation, uncertainty handling,
              and decision consistency. It is a designed educational rubric, not a validated
              measure of general intelligence. Cautious conclusions are not penalised when the
              evidence is insufficient.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Evidence selection', '30%'],
              ['Correct interpretation', '30%'],
              ['Uncertainty handling', '20%'],
              ['Decision consistency', '20%'],
            ].map(([label, weight]) => (
              <div key={label} className="surface-card p-5">
                <p className="font-mono text-2xl font-semibold">{weight}</p>
                <p className="mt-2 text-sm text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
