import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '@/App'
import { ThemeProvider } from '@/app/theme'
import { NavBar } from '@/components/navigation/NavBar'

function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('application routes', () => {
  it('renders the homepage', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', { level: 1, name: /from data to intelligence/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /don't just read how i think/i })).toBeInTheDocument()
  })

  it('renders the projects index', () => {
    renderAt('/projects/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /work, with its implementation status attached/i,
    )
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('supports a direct project URL and renders its case study', () => {
    renderAt('/projects/agentci/')
    expect(screen.getByRole('heading', { level: 1, name: 'AgentCI' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument()
    expect(screen.getAllByText(/early public alpha/i).length).toBeGreaterThan(0)
  })

  it('renders a 404 page for an unknown project slug', () => {
    renderAt('/projects/not-a-real-project/')
    expect(
      screen.getByRole('heading', { level: 1, name: /this page is not part of the system/i }),
    ).toBeInTheDocument()
  })

  it('renders the Cognitive OS laboratory and challenge placeholders', () => {
    renderAt('/cognitive-os/')
    expect(
      screen.getByRole('heading', { level: 1, name: /investigate\. challenge\. decide\./i }),
    ).toBeInTheDocument()

    renderAt('/cognitive-os/business-diagnosis/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Business Diagnosis' }),
    ).toBeInTheDocument()

    renderAt('/cognitive-os/agent-autopsy/')
    expect(screen.getByRole('heading', { level: 1, name: 'Agent Autopsy' })).toBeInTheDocument()
  })

  it('renders a 404 page for an unknown route', () => {
    renderAt('/does-not-exist')
    expect(
      screen.getByRole('heading', { level: 1, name: /this page is not part of the system/i }),
    ).toBeInTheDocument()
  })
})

describe('primary navigation', () => {
  it('exposes every required destination', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <NavBar />
        </MemoryRouter>
      </ThemeProvider>,
    )

    for (const label of ['Home', 'Projects', 'Cognitive OS', 'Engineering', 'Experience', 'About']) {
      expect(screen.getAllByRole('link', { name: label }).length).toBeGreaterThan(0)
    }

    expect(screen.getAllByRole('link', { name: 'Resume' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument()
  })
})
