import { Container } from '@/components/layout/Container'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export function NotFoundPage() {
  useDocumentMeta(
    'Page not found — Tejas Parjane',
    'The requested page could not be found. Return to the homepage or browse projects.',
  )

  return (
    <Container className="py-24 sm:py-32">
      <p className="section-label flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-8 bg-lime" />
        404
      </p>
      <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        This page is not part of the system.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
        The address may be incorrect, or the page may not have been published yet.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/">Return home</ButtonLink>
        <ButtonLink to="/projects/" variant="secondary">
          Browse projects
        </ButtonLink>
      </div>
    </Container>
  )
}
