import { describe, expect, it } from 'vitest'
import { caseStudies, getCaseStudyBySlug } from '@/case-studies/data'
import { metricRoleLabels, provenanceLabels, verificationLabels } from '@/case-studies/types'
import { projects } from '@/data/projects'

const provenanceKeys = Object.keys(provenanceLabels)
const roleKeys = Object.keys(metricRoleLabels)
const verificationKeys = Object.keys(verificationLabels)

describe('case-study data integrity', () => {
  it('provides exactly one case study for every featured project', () => {
    const studySlugs = caseStudies.map((study) => study.slug)

    expect(caseStudies).toHaveLength(5)
    expect(new Set(studySlugs).size).toBe(studySlugs.length)
    for (const project of projects.filter((item) => item.featured)) {
      if (project.slug === 'business-intelligent-rag-agent') continue

      expect(studySlugs).toContain(project.slug)
    }
  })

  it('uses valid provenance, role, and verification values', () => {
    for (const study of caseStudies) {
      expect(verificationKeys).toContain(study.verification.level)
      expect(study.verification.note.trim().length).toBeGreaterThan(0)

      for (const group of study.evaluation.metricGroups) {
        for (const metric of group.metrics) {
          expect(provenanceKeys).toContain(metric.provenance)
          expect(roleKeys).toContain(metric.role)
          expect(metric.definition.trim().length).toBeGreaterThan(0)
          expect(metric.value.trim().length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('uses only absolute https links', () => {
    for (const study of caseStudies) {
      for (const link of study.links) {
        expect(link.href).toMatch(/^https:\/\//)
      }
    }
  })

  it('never labels metrics from synthetic projects as real-world', () => {
    for (const slug of ['attention-os', 'forecasting-engine']) {
      const study = getCaseStudyBySlug(slug)
      expect(study).toBeDefined()
      for (const group of study!.evaluation.metricGroups) {
        for (const metric of group.metrics) {
          expect(metric.provenance).not.toBe('real-world')
        }
      }
    }
  })

  it('marks JaheeraTech as owner-reported with no published metrics', () => {
    const study = getCaseStudyBySlug('jaheeratech')
    expect(study).toBeDefined()
    expect(study!.verification.level).toBe('owner-reported')
    expect(study!.evaluation.metricGroups).toHaveLength(0)
  })

  it('states the forecasting backtest-window versus 30-step caveat', () => {
    const study = getCaseStudyBySlug('forecasting-engine')
    expect(study).toBeDefined()
    expect(study!.evaluation.caveats.join(' ')).toMatch(/30 steps/i)

    const firstGroup = study!.evaluation.metricGroups[0]
    expect(firstGroup).toBeDefined()
    expect(firstGroup!.metrics[0]?.value).toBe('11.35')
    expect(firstGroup!.metrics[0]?.scope).toMatch(/109\/109\/110\/110/)
  })

  it('records the Attention-OS small-sample and threshold caveats', () => {
    const study = getCaseStudyBySlug('attention-os')
    expect(study).toBeDefined()
    const caveatText = study!.evaluation.caveats.join(' ')
    expect(caveatText).toMatch(/75 users/i)
    expect(caveatText).toMatch(/13 positives/i)

    const thresholdGroup = study!.evaluation.metricGroups.find((group) =>
      group.name.toLowerCase().includes('threshold'),
    )
    expect(thresholdGroup).toBeDefined()
    expect(thresholdGroup!.metrics[0]?.role).toBe('threshold-sweep')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getCaseStudyBySlug('not-a-project')).toBeUndefined()
  })
})
