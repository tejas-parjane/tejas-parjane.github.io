import { describe, expect, it } from 'vitest'
import { projects, statusLabels } from '@/data/projects'
import { profile } from '@/data/profile'

describe('project data integrity', () => {
  it('contains the five projects with three recruiter-facing featured projects exactly once', () => {
    expect(projects).toHaveLength(5)
    expect(projects.filter((project) => project.featured)).toHaveLength(3)
    expect(new Set(projects.map((project) => project.slug)).size).toBe(projects.length)
    expect(new Set(projects.map((project) => project.name)).size).toBe(projects.length)
  })

  it('uses only declared implementation statuses', () => {
    for (const project of projects) {
      expect(Object.keys(statusLabels)).toContain(project.status)
      expect(project.statusNote.trim().length).toBeGreaterThan(0)
    }
  })

  it('uses verified absolute external links and internal case-study routes', () => {
    for (const project of projects) {
      for (const link of project.links) {
        if (link.kind === 'case-study') {
          expect(link.href.startsWith('/projects/')).toBe(true)
          continue
        }

        expect(link.href).toMatch(/^https:\/\//)
      }
    }
  })

  it('links to the verified repositories and demos', () => {
    const hrefs = projects.flatMap((project) => project.links.map((link) => link.href))

    expect(hrefs).toContain('https://github.com/tejas-parjane/attention-os')
    expect(hrefs).toContain('https://github.com/tejas-parjane/forecasting-engine')
    expect(hrefs).toContain('https://github.com/tejas-parjane/agentci')
    expect(hrefs).toContain('https://github.com/tejas-parjane/business-intelligent-rag-agent')
    expect(hrefs).toContain('https://tejas-parjane.github.io/attention-os/')
    expect(hrefs).toContain('https://tejas-parjane.github.io/forecasting-engine/')
    expect(hrefs).toContain('https://jaheeratech.com/')
  })

  it('keeps the published contact destinations explicit', () => {
    expect(profile.email).toBe('tejasparjane7334@gmail.com')
    expect(profile.github).toBe('https://github.com/tejas-parjane')
    expect(profile.linkedin).toBe('https://www.linkedin.com/in/tejas-parjane/')
  })
})
