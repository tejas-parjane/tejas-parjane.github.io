import {
  businessDiagnosisRows,
  type Device,
  type ObservationRow,
  type Period,
  type Source,
} from '@/cognitive-os/datasets/businessDiagnosis'

export interface AnalysisFilter {
  source?: string
  device?: string
  landingPage?: string
}

export interface RateStat {
  sessions: number
  purchases: number
  rate: number
}

export interface FunnelStat extends RateStat {
  addToCart: number
  checkoutStarted: number
  revenue: number
  addToCartRate: number
  checkoutRate: number
}

export interface PeriodComparison {
  baseline: FunnelStat
  comparison: FunnelStat
  absoluteChange: number
  relativeChange: number
}

export interface GroupedRate {
  key: string
  baseline: RateStat
  comparison: RateStat
  baselineShare: number
  comparisonShare: number
  rateChange: number
}

export interface Decomposition {
  mix: number
  rate: number
  interaction: number
  total: number
  mixShare: number
  rateShare: number
  interactionShare: number
}

export interface Standardization {
  baselineRate: number
  observedRate: number
  standardizedRate: number
  observedChange: number
  standardizedChange: number
  explainedFraction: number
}

export interface NoiseBand {
  dailyRates: number[]
  mean: number
  stdDev: number
  observedChange: number
  zScore: number
  exceedsNoise: boolean
}

export interface Completeness {
  expectedDays: number
  presentDays: number
  missingDays: string[]
  complete: boolean
  rowCount: number
}

const ALL = 'all'

function isScoped(value: string | undefined): value is string {
  return value !== undefined && value !== ALL
}

export function rowMatches(row: ObservationRow, filter: AnalysisFilter): boolean {
  if (isScoped(filter.source) && row.source !== filter.source) return false
  if (isScoped(filter.device) && row.device !== filter.device) return false
  if (isScoped(filter.landingPage) && row.landingPage !== filter.landingPage) return false
  return true
}

export function filterRows(filter: AnalysisFilter = {}): ObservationRow[] {
  return businessDiagnosisRows.filter((row) => rowMatches(row, filter))
}

function rate(purchases: number, sessions: number): number {
  return sessions === 0 ? 0 : purchases / sessions
}

function stat(rows: ObservationRow[]): RateStat {
  let sessions = 0
  let purchases = 0
  for (const row of rows) {
    sessions += row.sessions
    purchases += row.purchases
  }
  return { sessions, purchases, rate: rate(purchases, sessions) }
}

export function funnelStat(rows: ObservationRow[]): FunnelStat {
  let sessions = 0
  let addToCart = 0
  let checkoutStarted = 0
  let purchases = 0
  let revenue = 0
  for (const row of rows) {
    sessions += row.sessions
    addToCart += row.addToCart
    checkoutStarted += row.checkoutStarted
    purchases += row.purchases
    revenue += row.revenue
  }
  return {
    sessions,
    addToCart,
    checkoutStarted,
    purchases,
    revenue,
    rate: rate(purchases, sessions),
    addToCartRate: rate(addToCart, sessions),
    checkoutRate: rate(checkoutStarted, sessions),
  }
}

function rowsForPeriod(rows: ObservationRow[], period: Period): ObservationRow[] {
  return rows.filter((row) => row.period === period)
}

export function compareFunnels(filter: AnalysisFilter = {}): PeriodComparison {
  const rows = filterRows(filter)
  const baseline = funnelStat(rowsForPeriod(rows, 'baseline'))
  const comparison = funnelStat(rowsForPeriod(rows, 'comparison'))
  const absoluteChange = comparison.rate - baseline.rate
  const relativeChange = baseline.rate === 0 ? 0 : absoluteChange / baseline.rate
  return { baseline, comparison, absoluteChange, relativeChange }
}

function groupStats<K extends string>(
  rows: ObservationRow[],
  keys: readonly K[],
  project: (row: ObservationRow) => K,
): GroupedRate[] {
  const baselineRows = rowsForPeriod(rows, 'baseline')
  const comparisonRows = rowsForPeriod(rows, 'comparison')
  const baselineTotal = stat(baselineRows).sessions
  const comparisonTotal = stat(comparisonRows).sessions

  return keys.map((key) => {
    const base = stat(baselineRows.filter((row) => project(row) === key))
    const comp = stat(comparisonRows.filter((row) => project(row) === key))
    return {
      key,
      baseline: base,
      comparison: comp,
      baselineShare: baselineTotal === 0 ? 0 : base.sessions / baselineTotal,
      comparisonShare: comparisonTotal === 0 ? 0 : comp.sessions / comparisonTotal,
      rateChange: comp.rate - base.rate,
    }
  })
}

export function groupBySource(filter: AnalysisFilter = {}): GroupedRate[] {
  return groupStats(filterRows(filter), ['organic', 'paid_search', 'social', 'email'] as const, (row) => row.source)
}

export function groupByDevice(filter: AnalysisFilter = {}): GroupedRate[] {
  return groupStats(filterRows(filter), ['desktop', 'mobile', 'tablet'] as const, (row) => row.device)
}

export function groupByLandingPage(filter: AnalysisFilter = {}): GroupedRate[] {
  return groupStats(filterRows(filter), ['home', 'pricing', 'feature'] as const, (row) => row.landingPage)
}

export interface SourceDeviceCell {
  source: Source
  device: Device
  baselineRate: number
  comparisonRate: number
  rateChange: number
}

export function sourceDeviceMatrix(filter: AnalysisFilter = {}): SourceDeviceCell[] {
  const rows = filterRows(filter)
  const sources: Source[] = ['organic', 'paid_search', 'social', 'email']
  const devices: Device[] = ['desktop', 'mobile', 'tablet']
  const cells: SourceDeviceCell[] = []
  for (const source of sources) {
    for (const device of devices) {
      const scoped = rows.filter((row) => row.source === source && row.device === device)
      const baselineRate = stat(rowsForPeriod(scoped, 'baseline')).rate
      const comparisonRate = stat(rowsForPeriod(scoped, 'comparison')).rate
      cells.push({ source, device, baselineRate, comparisonRate, rateChange: comparisonRate - baselineRate })
    }
  }
  return cells
}

export type MixDimension = 'source' | 'device' | 'landingPage'

function mixGroups(dimension: MixDimension, filter: AnalysisFilter): GroupedRate[] {
  if (dimension === 'source') return groupBySource(filter)
  if (dimension === 'device') return groupByDevice(filter)
  return groupByLandingPage(filter)
}

function safeShare(part: number, total: number): number {
  return total === 0 ? 0 : part / total
}

/**
 * Two-way shift-share decomposition of the change in overall conversion rate:
 *   change = mix + rate + interaction
 * mix holds group rates at baseline while shifting shares; rate holds shares at
 * baseline while moving group rates; interaction is the cross term.
 */
export function decomposeMix(dimension: MixDimension = 'source', filter: AnalysisFilter = {}): Decomposition {
  const groups = mixGroups(dimension, filter)
  let mix = 0
  let rateEffect = 0
  let interaction = 0
  for (const group of groups) {
    const deltaShare = group.comparisonShare - group.baselineShare
    const deltaRate = group.comparison.rate - group.baseline.rate
    mix += deltaShare * group.baseline.rate
    rateEffect += group.baselineShare * deltaRate
    interaction += deltaShare * deltaRate
  }
  const total = mix + rateEffect + interaction
  return {
    mix,
    rate: rateEffect,
    interaction,
    total,
    mixShare: safeShare(mix, total),
    rateShare: safeShare(rateEffect, total),
    interactionShare: safeShare(interaction, total),
  }
}

/**
 * Reweights comparison-period group rates to the baseline mix. The fraction of
 * the observed change that disappears is the share attributable to mix.
 */
export function standardizeToBaselineMix(
  dimension: MixDimension = 'source',
  filter: AnalysisFilter = {},
): Standardization {
  const groups = mixGroups(dimension, filter)
  const overall = compareFunnels(filter)
  const standardizedRate = groups.reduce(
    (sum, group) => sum + group.baselineShare * group.comparison.rate,
    0,
  )
  const observedChange = overall.comparison.rate - overall.baseline.rate
  const standardizedChange = standardizedRate - overall.baseline.rate
  const explainedFraction = observedChange === 0 ? 0 : (observedChange - standardizedChange) / observedChange
  return {
    baselineRate: overall.baseline.rate,
    observedRate: overall.comparison.rate,
    standardizedRate,
    observedChange,
    standardizedChange,
    explainedFraction,
  }
}

export function noiseBand(filter: AnalysisFilter = {}): NoiseBand {
  const rows = filterRows(filter)
  const baselineRows = rowsForPeriod(rows, 'baseline')
  const dates = [...new Set(baselineRows.map((row) => row.date))].sort()
  const dailyRates = dates.map((date) =>
    stat(baselineRows.filter((row) => row.date === date)).rate,
  )
  const mean = dailyRates.length === 0 ? 0 : dailyRates.reduce((sum, value) => sum + value, 0) / dailyRates.length
  const variance =
    dailyRates.length === 0
      ? 0
      : dailyRates.reduce((sum, value) => sum + (value - mean) ** 2, 0) / dailyRates.length
  const stdDev = Math.sqrt(variance)
  const overall = compareFunnels(filter)
  const observedChange = overall.comparison.rate - overall.baseline.rate
  const zScore = stdDev === 0 ? 0 : observedChange / stdDev
  return { dailyRates, mean, stdDev, observedChange, zScore, exceedsNoise: Math.abs(zScore) >= 2 }
}

export function completeness(): Completeness {
  const dates = [...new Set(businessDiagnosisRows.map((row) => row.date))].sort()
  const expectedDays = 28
  const presentDays = dates.length
  const missingDays: string[] = []
  for (let index = 0; index < expectedDays; index += 1) {
    const date = new Date(Date.UTC(2024, 8, 2) + index * 86_400_000).toISOString().slice(0, 10)
    if (!dates.includes(date)) missingDays.push(date)
  }
  return {
    expectedDays,
    presentDays,
    missingDays,
    complete: missingDays.length === 0,
    rowCount: businessDiagnosisRows.length,
  }
}

export function funnelOrderIssues(): number {
  return businessDiagnosisRows.filter(
    (row) =>
      !(
        row.purchases <= row.checkoutStarted &&
        row.checkoutStarted <= row.addToCart &&
        row.addToCart <= row.sessions
      ),
  ).length
}

export function groupKeyLabel(key: string): string {
  const labels: Record<string, string> = {
    organic: 'Organic',
    paid_search: 'Paid search',
    social: 'Social',
    email: 'Email',
    desktop: 'Desktop',
    mobile: 'Mobile',
    tablet: 'Tablet',
    home: 'Home',
    pricing: 'Pricing',
    feature: 'Feature',
    [ALL]: 'All',
  }
  return labels[key] ?? key
}

export const MIX_DIMENSION_LABELS: Record<MixDimension, string> = {
  source: 'traffic source',
  device: 'device',
  landingPage: 'landing page',
}
