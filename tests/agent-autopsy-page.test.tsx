import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '@/app/theme'
import { AgentAutopsyPage } from '@/pages/AgentAutopsyPage'

function renderChallenge() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/cognitive-os/agent-autopsy/']}>
        <AgentAutopsyPage />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

async function openTrace(user: ReturnType<typeof userEvent.setup>) {
  renderChallenge()
  await user.click(screen.getByRole('button', { name: /review the trace/i }))
}

describe('Agent Autopsy page', () => {
  it('introduces the incident and the trace', () => {
    renderChallenge()
    expect(screen.getByRole('heading', { level: 1, name: 'Agent Autopsy' })).toBeInTheDocument()
    expect(screen.getByText(/synthetic incident trace/i)).toBeInTheDocument()
    expect(screen.getByText(/confident but wrong answer/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review the trace/i })).toBeInTheDocument()
  })

  it('drills into individual timeline events', async () => {
    const user = userEvent.setup()
    await openTrace(user)

    expect(screen.getByText('Execution timeline')).toBeInTheDocument()
    expect(screen.getByText('Diagnostic comparisons')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Event 8 details' }))
    expect(screen.getByText(/kept refund-policy-v2 \(rank 1\)/i)).toBeInTheDocument()
  })

  it('filters the timeline by pipeline stage', async () => {
    const user = userEvent.setup()
    await openTrace(user)

    expect(screen.getByText('11 events shown · expand a row to read its payload')).toBeInTheDocument()

    const stageFilter = screen.getByLabelText('Pipeline stage') as HTMLSelectElement
    await user.selectOptions(stageFilter, 'state')
    expect(stageFilter.value).toBe('state')
    expect(screen.getByText('2 events shown · expand a row to read its payload')).toBeInTheDocument()
  })

  it('reveals evidence when a comparison is run', async () => {
    const user = userEvent.setup()
    await openTrace(user)

    const runButtons = screen.getAllByRole('button', { name: /run comparison/i })
    expect(runButtons).toHaveLength(7)
    await user.click(runButtons[0]!)
    expect(screen.getAllByRole('button', { name: /already run/i })).toHaveLength(1)
  })

  it('blocks submission until a failure point and decisions are made', async () => {
    const user = userEvent.setup()
    await openTrace(user)
    await user.click(screen.getByRole('button', { name: /go to diagnosis/i }))

    const submit = screen.getByRole('button', { name: /submit diagnosis/i })
    expect(submit).toBeDisabled()
    expect(screen.getByText(/choose earliest consequential failure/i)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /context compaction dropped the current policy chunk/i }))
    await user.click(screen.getAllByRole('radio', { name: /state-management loss of evidence/i })[0]!)
    await user.click(screen.getByRole('radio', { name: /^Medium/ }))
    await user.click(screen.getByRole('radio', { name: /fix compaction to preserve authoritative evidence/i }))
    expect(submit).toBeEnabled()
  })

  it('produces a scored, reproducible incident report after submitting', async () => {
    const user = userEvent.setup()
    await openTrace(user)
    await user.click(screen.getByRole('button', { name: /go to diagnosis/i }))

    await user.click(screen.getByRole('radio', { name: /context compaction dropped the current policy chunk/i }))
    await user.click(screen.getAllByRole('radio', { name: /state-management loss of evidence/i })[0]!)
    await user.click(screen.getByRole('radio', { name: /^Medium/ }))
    await user.click(screen.getByRole('radio', { name: /fix compaction to preserve authoritative evidence/i }))
    await user.click(screen.getByRole('button', { name: /submit diagnosis/i }))

    expect(screen.getByRole('heading', { level: 2, name: /scoring breakdown/i })).toBeInTheDocument()
    expect(screen.getByText(/reproducibility fingerprint/i)).toBeInTheDocument()
    expect(screen.getByText(/out of 100/)).toBeInTheDocument()

    const submission = screen.getByRole('heading', { name: /your submission/i }).closest('section')!
    expect(within(submission).getByText(/context compaction dropped the current policy chunk/i)).toBeInTheDocument()
  })

  it('scores a symptom-based diagnosis as insufficient', async () => {
    const user = userEvent.setup()
    await openTrace(user)
    await user.click(screen.getByRole('button', { name: /go to diagnosis/i }))

    await user.click(screen.getByRole('radio', { name: /final answer returned with high confidence/i }))
    await user.click(screen.getAllByRole('radio', { name: /unsupported final answer/i })[0]!)
    await user.click(screen.getByRole('radio', { name: /^High/ }))
    await user.click(screen.getByRole('radio', { name: /add a freshness or citation assertion/i }))
    await user.click(screen.getByRole('button', { name: /submit diagnosis/i }))

    expect(screen.getByText(/insufficient/i)).toBeInTheDocument()
  })

  it('resets and can be run again', async () => {
    const user = userEvent.setup()
    await openTrace(user)
    await user.click(screen.getByRole('button', { name: /go to diagnosis/i }))
    await user.click(screen.getByRole('radio', { name: /context compaction dropped the current policy chunk/i }))
    await user.click(screen.getAllByRole('radio', { name: /state-management loss of evidence/i })[0]!)
    await user.click(screen.getByRole('radio', { name: /^Medium/ }))
    await user.click(screen.getByRole('radio', { name: /fix compaction to preserve authoritative evidence/i }))
    await user.click(screen.getByRole('button', { name: /submit diagnosis/i }))
    await user.click(screen.getByRole('button', { name: /run the challenge again/i }))

    expect(screen.getByRole('button', { name: /review the trace/i })).toBeInTheDocument()
  })
})
