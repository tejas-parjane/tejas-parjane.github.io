import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '@/app/theme'
import { HypothesisArenaPage } from '@/pages/HypothesisArenaPage'

function renderChallenge() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/cognitive-os/hypothesis-arena/']}>
        <HypothesisArenaPage />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

async function openArena(user: ReturnType<typeof userEvent.setup>) {
  renderChallenge()
  await user.click(screen.getByRole('button', { name: /start investigating/i }))
}

async function runExperiment(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  const buttons = screen.getAllByRole('button', { name: /run experiment/i })
  const button = buttons.find((candidate) => name.test(candidate.closest('li')?.textContent ?? ''))
  expect(button).toBeTruthy()
  await user.click(button!)
}

describe('Hypothesis Arena page', () => {
  it('introduces the problem and the data', () => {
    renderChallenge()
    expect(screen.getByRole('heading', { level: 1, name: 'Hypothesis Arena' })).toBeInTheDocument()
    expect(screen.getByText(/signup-to-activation fell/i)).toBeInTheDocument()
    expect(screen.getByText('What the data shows')).toBeInTheDocument()
    expect(screen.getByText(/Synthetic dataset bundled with the site/i)).toBeInTheDocument()
  })

  it('ranks experiments and runs one within budget', async () => {
    const user = userEvent.setup()
    await openArena(user)

    expect(screen.getByText('Experiments')).toBeInTheDocument()
    expect(screen.getByText(/Budget remaining 5 \/ 5/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /run experiment/i })).toHaveLength(4)

    await runExperiment(user, /Replay the activation event schema/i)

    expect(screen.getAllByRole('button', { name: /already run/i })).toHaveLength(1)
    expect(screen.getByText(/Budget remaining 2 \/ 5/)).toBeInTheDocument()
    expect(screen.getAllByText(/undercounted after a required.field change/i).length).toBeGreaterThan(0)
  })

  it('disables experiments the remaining budget cannot afford', async () => {
    const user = userEvent.setup()
    await openArena(user)
    await runExperiment(user, /Replay the activation event schema/i)

    const rollback = screen.getAllByRole('button', { name: /not enough budget/i })
    expect(rollback.length).toBeGreaterThan(0)
    expect(rollback[0]).toBeDisabled()
  })

  it('blocks submission until an experiment and decisions are made', async () => {
    const user = userEvent.setup()
    await openArena(user)
    await user.click(screen.getByRole('button', { name: /go to decision/i }))

    const submit = screen.getByRole('button', { name: /submit decision/i })
    expect(submit).toBeDisabled()
    expect(screen.getByText(/at least 1 experiment/i)).toBeInTheDocument()
  })

  it('produces a scored, reproducible decision record', async () => {
    const user = userEvent.setup()
    await openArena(user)
    await runExperiment(user, /Replay the activation event schema/i)
    await user.click(screen.getByRole('button', { name: /go to decision/i }))

    await user.click(screen.getAllByRole('radio', { name: /Activation is undercounted after the schema change/i })[0]!)
    await user.click(screen.getByRole('radio', { name: /^Medium/ }))
    await user.click(
      screen.getByRole('radio', { name: /Fix the activation event and backfill the affected counts/i }),
    )
    await user.click(screen.getByRole('button', { name: /submit decision/i }))

    expect(screen.getByRole('heading', { level: 2, name: /scoring breakdown/i })).toBeInTheDocument()
    expect(screen.getByText(/reproducibility fingerprint/i)).toBeInTheDocument()

    const submission = screen.getByRole('heading', { name: /your submission/i }).closest('section')!
    expect(within(submission).getByText(/Replay the activation event schema/i)).toBeInTheDocument()
  })

  it('shows updated posterior beliefs after a decisive experiment', async () => {
    const user = userEvent.setup()
    await openArena(user)
    await runExperiment(user, /Replay the activation event schema/i)

    const beliefs = screen.getByText('Beliefs').closest('div')!.parentElement!
    expect(within(beliefs).getByText(/1 experiment\(s\) applied/i)).toBeInTheDocument()
    expect(within(beliefs).getByText(/recommended confidence medium/i)).toBeInTheDocument()
  })

  it('resets and can be run again', async () => {
    const user = userEvent.setup()
    await openArena(user)
    await runExperiment(user, /Replay the activation event schema/i)
    await user.click(screen.getByRole('button', { name: /go to decision/i }))
    await user.click(screen.getAllByRole('radio', { name: /Activation is undercounted after the schema change/i })[0]!)
    await user.click(screen.getByRole('radio', { name: /^Medium/ }))
    await user.click(
      screen.getByRole('radio', { name: /Fix the activation event and backfill the affected counts/i }),
    )
    await user.click(screen.getByRole('button', { name: /submit decision/i }))
    await user.click(screen.getByRole('button', { name: /run the challenge again/i }))

    expect(screen.getByRole('button', { name: /start investigating/i })).toBeInTheDocument()
  })
})
