import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { ThemeToggle } from '@/components/navigation/ThemeToggle'
import { resume } from '@/data/profile'
import { cn } from '@/lib/cn'

const navigation = [
  { label: 'Work', to: '/projects/' },
  { label: 'AI Lab', to: '/cognitive-os/' },
  { label: 'Experience', to: '/experience/' },
  { label: 'About', to: '/about/' },
  { label: 'Contact', to: '/contact/' },
]

export function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight"
          aria-label="Tejas Parjane — home"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-lg bg-lime font-mono text-xs font-bold text-lime-ink"
          >
            TP
          </span>
          <span className="hidden sm:inline">Tejas Parjane<span className="text-signal">.</span></span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-surface-2 font-medium text-ink'
                    : 'text-muted hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={resume.path}
            className="ml-1 rounded-full border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            Résumé
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X aria-hidden="true" className="size-4" />
            ) : (
              <Menu aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </Container>

      <div
        id="mobile-navigation"
        hidden={!open}
        className="border-t border-line bg-canvas md:hidden"
      >
        <Container className="py-4">
          <nav aria-label="Mobile" className="flex flex-col">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-3 text-sm transition-colors',
                    isActive
                      ? 'bg-surface-2 font-medium text-ink'
                      : 'text-muted hover:bg-surface-2 hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to={resume.path}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Résumé
            </Link>
          </nav>
        </Container>
      </div>
    </header>
  )
}
