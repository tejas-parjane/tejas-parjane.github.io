import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/theme-context'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextLabel = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextLabel} theme`}
      title={`Switch to ${nextLabel} theme`}
      className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      {theme === 'dark' ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </button>
  )
}
