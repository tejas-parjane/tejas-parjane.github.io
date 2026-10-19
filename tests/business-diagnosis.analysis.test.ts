import { describe, expect, it } from 'vitest'
import { businessDiagnosisRows } from '@/cognitive-os/datasets/businessDiagnosis'
import {
  compareFunnels,
  completeness,
  decomposeMix,
  filterRows,
  funnelOrderIssues,
  groupBySource,
  noiseBand,
  sourceDeviceMatrix,
  standardizeToBaselineMix,
} from '@/cognitive-os/analysis/businessDiagnosisAnalysis'

/** Independent recomputation straight from the raw rows, not via the analysis module. */
function independentTotals(period: 'baseline' | 'comparison', source?: string) {
  let sessions = 0
  let purchases = 0
  for (const row of businessDiagnosisRows) {
    if (row.period !== period) continue
    if (source !== undefined && row.source !== source) continue
    sessions += row.sessions
    purchases += row.purchases
  }
  return { sessions, purchases, rate: purchases / sessions }
}

describe('business diagnosis dataset', () => {
  it('has the documented shape and monotonic funnel ordering', () => {
    expect(businessDiagnosisRows).toHaveLength(1008)
    for (const row of businessDiagnosisRows) {
      expect(row.purchases).toBeLessThanOrEqual(row.checkoutStarted)
      expect(row.checkoutStarted).toBeLessThanOrEqual(row.addToCart)
      expect(row.addToCart).toBeLessThanOrEqual(row.sessions)
    }
  })

  it('is deterministic across repeated reads', () => {
    expect(businessDiagnosisRows[0]).toEqual(businessDiagnosisRows[0])
    expect(filterRows().length).toBe(businessDiagnosisRows.length)
  })
})

describe('period comparison', () => {
  it('matches an independent recomputation of totals and rates', () => {
    const overall = compareFunnels()
    const baseline = independentTotals('baseline')
    const comparison = independentTotals('comparison')

    expect(overall.baseline.sessions).toBe(baseline.sessions)
    expect(overall.baseline.purchases).toBe(baseline.purchases)
    expect(overall.baseline.rate).toBeCloseTo(baseline.rate, 12)
    expect(overall.comparison.sessions).toBe(comparison.sessions)
    expect(overall.comparison.rate).toBeCloseTo(comparison.rate, 12)
  })

  it('shows a decline of roughly 18 percent', () => {
    const overall = compareFunnels()
    expect(overall.relativeChange).toBeGreaterThan(-0.22)
    expect(overall.relativeChange).toBeLessThan(-0.15)
    expect(overall.absoluteChange).toBeCloseTo(overall.comparison.rate - overall.baseline.rate, 12)
  })

  it('honours filters in the evidence view', () => {
    const social = compareFunnels({ source: 'social' })
    const expected = independentTotals('baseline', 'social')
    expect(social.baseline.sessions).toBe(expected.sessions)
    expect(social.baseline.rate).toBeCloseTo(expected.rate, 12)
  })
})

describe('mix decomposition', () => {
  it('adds up to the observed change and is dominated by mix', () => {
    const overall = compareFunnels()
    const decomposition = decomposeMix('source')
    const observed = overall.comparison.rate - overall.baseline.rate

    expect(decomposition.mix + decomposition.rate + decomposition.interaction).toBeCloseTo(decomposition.total, 12)
    expect(decomposition.total).toBeCloseTo(observed, 12)
    expect(decomposition.mixShare).toBeGreaterThan(0.5)
    expect(decomposition.mixShare + decomposition.rateShare + decomposition.interactionShare).toBeCloseTo(1, 12)
  })

  it('standardising to the baseline mix removes most of the decline', () => {
    const standardization = standardizeToBaselineMix('source')
    expect(standardization.explainedFraction).toBeGreaterThan(0.5)
    expect(standardization.standardizedRate).toBeGreaterThan(standardization.observedRate)
    expect(standardization.standardizedRate).toBeLessThan(standardization.baselineRate)
  })

  it('shows social rising sharply as a session share', () => {
    const source = groupBySource()
    const social = source.find((group) => group.key === 'social')
    expect(social).toBeDefined()
    expect(social!.baselineShare).toBeCloseTo(0.15, 2)
    expect(social!.comparisonShare).toBeCloseTo(0.3, 2)
  })

  it('rejects the landing-page explanation as the driver', () => {
    const landing = standardizeToBaselineMix('landingPage')
    expect(landing.explainedFraction).toBeLessThan(0.15)
  })
})

describe('within-segment signal', () => {
  it('shows mobile falling within every source while desktop and tablet stay flat', () => {
    const matrix = sourceDeviceMatrix()
    const mobile = matrix.filter((cell) => cell.device === 'mobile')
    const desktop = matrix.filter((cell) => cell.device === 'desktop')

    for (const cell of mobile) {
      const relative = cell.comparisonRate / cell.baselineRate - 1
      expect(relative).toBeLessThan(-0.1)
    }
    for (const cell of desktop) {
      const relative = cell.comparisonRate / cell.baselineRate - 1
      expect(Math.abs(relative)).toBeLessThan(0.02)
    }
  })
})

describe('noise and completeness checks', () => {
  it('finds the change larger than baseline daily variation', () => {
    const noise = noiseBand()
    expect(noise.dailyRates).toHaveLength(14)
    expect(noise.exceedsNoise).toBe(true)
    expect(noise.zScore).toBeLessThan(-2)
  })

  it('finds no missing days and no funnel-order violations', () => {
    const check = completeness()
    expect(check.complete).toBe(true)
    expect(check.presentDays).toBe(28)
    expect(check.missingDays).toHaveLength(0)
    expect(funnelOrderIssues()).toBe(0)
  })
})
