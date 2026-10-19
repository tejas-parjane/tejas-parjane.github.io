import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '@/app/theme'
import { BusinessDiagnosisPage } from '@/pages/BusinessDiagnosisPage'

function renderChallenge() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/cognitive-os/business-diagnosis/']}>
        <BusinessDiagnosisPage />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('Business Diagnosis page', () => {
  it('introduces the challenge and the dataset', () => {
    renderChallenge()
    expect(screen.getByRole('heading', { level: 1, name: 'Business Diagnosis' })).toBeInTheDocument()
    expect(screen.getByText(/synthetic scenario data/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin investigation/i })).toBeInTheDocument()
  })

  it('reveals evidence when a comparison is run and honours filters', async () => {
    const user = userEvent.setup()
    renderChallenge()

    await user.click(screen.getByRole('button', { name: /begin investigation/i }))
    expect(screen.getByRole('heading', { name: 'Evidence' })).toBeInTheDocument()
    expect(screen.getByText('Competing hypotheses')).toBeInTheDocument()

    const runButtons = screen.getAllByRole('button', { name: /run comparison/i })
    expect(runButtons).toHaveLength(9)
    await user.click(runButtons[0]!)
    expect(screen.getAllByRole('button', { name: /already run/i })).toHaveLength(1)

    const sourceFilter = screen.getByLabelText('Traffic source') as HTMLSelectElement
    await user.selectOptions(sourceFilter, 'social')
    expect(sourceFilter.value).toBe('social')
  })

  it('blocks submission until the required decisions are made', async () => {
    const user = userEvent.setup()
    renderChallenge()

    await user.click(screen.getByRole('button', { name: /begin investigation/i }))
    await user.click(screen.getByRole('button', { name: /go to decision/i }))

    const submit = screen.getByRole('button', { name: /submit conclusion/i })
    expect(submit).toBeDisabled()
    expect(screen.getByText(/choose a primary hypothesis/i)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /^Medium/ }))
    await user.click(screen.getByRole('radio', { name: /run a controlled test/i }))
    expect(submit).toBeDisabled()

    await user.click(screen.getAllByRole('radio', { name: /traffic-mix shift/i })[0]!)
    expect(submit).toBeEnabled()
  })

  it('produces a scored, reproducible decision record after submitting', async () => {
    const user = userEvent.setup()
    renderChallenge()

    await user.click(screen.getByRole('button', { name: /begin investigation/i }))
    await user.click(screen.getByRole('button', { name: /go to decision/i }))

    await user.click(screen.getAllByRole('radio', { name: /traffic-mix shift/i })[0]!)
    await user.click(screen.getByRole('radio', { name: /^Medium/ }))
    await user.click(screen.getByRole('radio', { name: /run a controlled test/i }))
    await user.click(screen.getByRole('button', { name: /submit conclusion/i }))

    expect(screen.getByRole('heading', { level: 2, name: /scoring breakdown/i })).toBeInTheDocument()
    expect(screen.getByText(/reproducibility fingerprint/i)).toBeInTheDocument()
    expect(screen.getByText(/out of 100/)).toBeInTheDocument()

    const submission = screen.getByRole('heading', { name: /your submission/i }).closest('section')!
    expect(within(submission).getByText('Traffic-mix shift')).toBeInTheDocument()
  })

  it('resets and can be run again', async () => {
    const user = userEvent.setup()
    renderChallenge()

    await user.click(screen.getByRole('button', { name: /begin investigation/i }))
    await user.click(screen.getByRole('button', { name: /go to decision/i }))
    await user.click(screen.getAllByRole('radio', { name: /traffic-mix shift/i })[0]!)
    await user.click(screen.getByRole('radio', { name: /^Medium/ }))
    await user.click(screen.getByRole('radio', { name: /run a controlled test/i }))
    await user.click(screen.getByRole('button', { name: /submit conclusion/i }))

    await user.click(screen.getByRole('button', { name: /run the challenge again/i }))
    expect(screen.getByRole('button', { name: /begin investigation/i })).toBeInTheDocument()
  })
})
