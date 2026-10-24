import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { getProjectBySlug } from '@/data/projects'

const attentionOs = getProjectBySlug('attention-os')

if (!attentionOs) throw new Error('Attention-OS fixture is missing')

describe('ProjectCard', () => {
  it('renders the verified repository link with safe external attributes', () => {
    render(
      <MemoryRouter>
        <ProjectCard project={attentionOs} index={1} />
      </MemoryRouter>,
    )

    const repository = screen.getByRole('link', { name: /repository/i })
    expect(repository).toHaveAttribute('href', 'https://github.com/tejas-parjane/attention-os')
    expect(repository).toHaveAttribute('target', '_blank')
    expect(repository).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('links to the internal case study and exposes implementation status', () => {
    render(
      <MemoryRouter>
        <ProjectCard project={attentionOs} index={1} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /case study/i })).toHaveAttribute(
      'href',
      '/projects/attention-os/',
    )
    expect(screen.getByText('Live demo')).toBeInTheDocument()
  })
})
