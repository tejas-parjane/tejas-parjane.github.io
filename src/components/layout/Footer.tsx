import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { GitHubIcon, LinkedInIcon } from '@/components/ui/BrandIcons'
import { profile } from '@/data/profile'

const currentYear = new Date().getFullYear()

const footerLinks = [
  { label: 'Projects', to: '/projects/' },
  { label: 'Cognitive OS', to: '/cognitive-os/' },
  { label: 'Engineering', to: '/engineering/' },
  { label: 'Experience', to: '/experience/' },
  { label: 'About', to: '/about/' },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-lg font-semibold tracking-tight">{profile.name}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              {profile.headline}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
              >
                <Mail aria-hidden="true" className="size-4" />
                Email
              </a>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
              >
                <GitHubIcon className="size-4" />
                GitHub
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
              >
                <LinkedInIcon className="size-4" />
                LinkedIn
                <ArrowUpRight aria-hidden="true" className="size-3" />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="md:justify-self-end">
            <p className="section-label">Navigate</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-1">
              {footerLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-muted transition-colors hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Tejas Parjane. Built with React, TypeScript, and Vite.</p>
          <p className="font-mono">Evidence over assertion.</p>
        </div>
      </Container>
    </footer>
  )
}
