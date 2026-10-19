import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CaseStudyView } from '@/case-studies/CaseStudyView'
import { getCaseStudyBySlug } from '@/case-studies/data'
import type { ProjectCaseStudy } from '@/case-studies/types'

const requiredHeadings = [
  'Overview',
  'Problem and intended outcome',
  'Constraints and assumptions',
  'Architecture and data flow',
  'Implementation status',
  'Evaluation methodology',
  'Results and interpretation',
  'Limitations and failure modes',
  'What I would improve next',
  'Sources and links',
]

function renderStudy(slug: string) {
  const study = getCaseStudyBySlug(slug)
  if (!study) throw new Error(`Missing case study: ${slug}`)
  return {
    study,
    ...render(
      <MemoryRouter>
        <CaseStudyView study={study} skills={['Example skill']} />
      </MemoryRouter>,
    ),
  }
}

function renderRaw(study: ProjectCaseStudy) {
  return render(
    <MemoryRouter>
      <CaseStudyView study={study} skills={['Example skill']} />
    </MemoryRouter>,
  )
}

describe('CaseStudyView', () => {
  it('renders every required section for all four case studies', () => {
    for (const slug of ['jaheeratech', 'attention-os', 'forecasting-engine', 'agentci']) {
      const study = getCaseStudyBySlug(slug)
      if (!study) throw new Error(`Missing case study: ${slug}`)
      const { unmount } = renderRaw(study)

      for (const heading of requiredHeadings) {
        expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
      }

      unmount()
    }
  })

  it('surfaces metric provenance and role for Attention-OS', () => {
    renderStudy('attention-os')

    expect(screen.getAllByText('Synthetic').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Held-out test').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Threshold sweep').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Simulated').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 2, name: 'Metrics' })).toBeInTheDocument()
  })

  it('labels JaheeraTech as owner-reported and omits the metrics section', () => {
    renderStudy('jaheeratech')

    expect(screen.getByText('Owner-reported')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Metrics' })).not.toBeInTheDocument()
  })

  it('renders external source links with safe attributes', () => {
    renderStudy('agentci')

    const repository = screen.getByRole('link', { name: /Repository/i })
    expect(repository).toHaveAttribute('href', 'https://github.com/tejas-parjane/agentci')
    expect(repository).toHaveAttribute('target', '_blank')
    expect(repository).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('states the forecasting horizon caveat in visible content', () => {
    renderStudy('forecasting-engine')

    expect(screen.getByText(/must not be described as a 30-day-horizon score/i)).toBeInTheDocument()
  })
})
