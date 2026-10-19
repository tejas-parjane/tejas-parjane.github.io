import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '@/app/theme'
import { ThemeToggle } from '@/components/navigation/ThemeToggle'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('theme system', () => {
  it('defaults to the light theme when the system is light and no preference is stored', () => {
    renderToggle()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument()
  })

  it('toggles the theme and persists the explicit preference', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(window.localStorage.getItem('tejas-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument()
  })

  it('respects a stored preference over the system default', () => {
    window.localStorage.setItem('tejas-theme', 'dark')
    renderToggle()

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument()
  })

  it('uses the theme already applied by the no-flash bootstrap script', () => {
    document.documentElement.dataset.theme = 'dark'
    renderToggle()

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
