// Documented, deterministic synthetic dataset for the Business Diagnosis challenge.
//
// It is generated in the browser from fixed constants and a fixed-seed linear
// congruential generator, so every visitor sees byte-identical data and every
// calculation in the UI is reproducible. The numbers describe a scenario, not a
// real business, and no figure here is evidence about any actual organisation.

export const SOURCES = ['organic', 'paid_search', 'social', 'email'] as const
export const DEVICES = ['desktop', 'mobile', 'tablet'] as const
export const LANDING_PAGES = ['home', 'pricing', 'feature'] as const
export const PERIODS = ['baseline', 'comparison'] as const

export type Source = (typeof SOURCES)[number]
export type Device = (typeof DEVICES)[number]
export type LandingPage = (typeof LANDING_PAGES)[number]
export type Period = (typeof PERIODS)[number]

export interface ObservationRow {
  date: string
  period: Period
  source: Source
  device: Device
  landingPage: LandingPage
  sessions: number
  addToCart: number
  checkoutStarted: number
  purchases: number
  revenue: number
}

export const DATASET_ID = 'business-diagnosis-funnel-v1'

const SEED = 20240930
const DAYS_PER_PERIOD = 14
const BASELINE_START = Date.UTC(2024, 8, 2)
const COMPARISON_START = Date.UTC(2024, 8, 16)
const DAY_MS = 86_400_000
const AOV = 1200

interface PeriodConfig {
  totalSessions: number
  sourceShare: Record<Source, number>
  deviceShare: Record<Device, number>
  deviceRateModifier: Record<Device, number>
}

const SOURCE_BASE_RATE: Record<Source, number> = {
  organic: 0.05,
  paid_search: 0.042,
  social: 0.02,
  email: 0.065,
}

const LANDING_SHARE: Record<LandingPage, number> = {
  home: 0.5,
  pricing: 0.3,
  feature: 0.2,
}

const CONFIG: Record<Period, PeriodConfig> = {
  baseline: {
    totalSessions: 140_000,
    sourceShare: { organic: 0.32, paid_search: 0.25, social: 0.15, email: 0.28 },
    deviceShare: { desktop: 0.55, mobile: 0.35, tablet: 0.1 },
    deviceRateModifier: { desktop: 1.25, mobile: 0.85, tablet: 1.0 },
  },
  comparison: {
    totalSessions: 150_000,
    sourceShare: { organic: 0.3, paid_search: 0.22, social: 0.3, email: 0.18 },
    deviceShare: { desktop: 0.5, mobile: 0.42, tablet: 0.08 },
    deviceRateModifier: { desktop: 1.25, mobile: 0.72, tablet: 1.0 },
  },
}

function createGenerator(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function round(value: number): number {
  return Math.max(0, Math.round(value))
}

/**
 * Draws `count` values and centres them on 1 so each period has an exact mean of
 * 1. This keeps period totals and rates at their intended values while still
 * producing the day-to-day variation needed for the noise check.
 */
function centredJitters(random: () => number, count: number, spread: number): number[] {
  const raw = Array.from({ length: count }, () => 1 + (random() * 2 - 1) * spread)
  const mean = raw.reduce((sum, value) => sum + value, 0) / count
  return raw.map((value) => value - mean + 1)
}

function generateRows(): ObservationRow[] {
  const random = createGenerator(SEED)
  const rows: ObservationRow[] = []

  const sessionJitters: Record<Period, number[]> = {
    baseline: centredJitters(random, DAYS_PER_PERIOD, 0.03),
    comparison: centredJitters(random, DAYS_PER_PERIOD, 0.03),
  }
  const rateJitters: Record<Period, number[]> = {
    baseline: centredJitters(random, DAYS_PER_PERIOD, 0.1),
    comparison: centredJitters(random, DAYS_PER_PERIOD, 0.1),
  }

  for (const period of PERIODS) {
    const config = CONFIG[period]
    const start = period === 'baseline' ? BASELINE_START : COMPARISON_START
    const sessionsPerDay = config.totalSessions / DAYS_PER_PERIOD

    for (let dayIndex = 0; dayIndex < DAYS_PER_PERIOD; dayIndex += 1) {
      const date = new Date(start + dayIndex * DAY_MS).toISOString().slice(0, 10)
      const sessionsJitter = sessionJitters[period][dayIndex] ?? 1
      const rateJitter = rateJitters[period][dayIndex] ?? 1
      const daySessions = sessionsPerDay * sessionsJitter

      for (const source of SOURCES) {
        for (const device of DEVICES) {
          for (const landingPage of LANDING_PAGES) {
            const sessions = round(
              daySessions *
                config.sourceShare[source] *
                config.deviceShare[device] *
                LANDING_SHARE[landingPage],
            )
            const rate =
              SOURCE_BASE_RATE[source] * config.deviceRateModifier[device] * rateJitter
            const purchases = round(sessions * rate)
            const checkoutStarted = Math.max(purchases, round(sessions * rate * 3))
            const addToCart = Math.max(checkoutStarted, round(sessions * rate * 6))

            rows.push({
              date,
              period,
              source,
              device,
              landingPage,
              sessions,
              addToCart,
              checkoutStarted,
              purchases,
              revenue: purchases * AOV,
            })
          }
        }
      }
    }
  }

  return rows
}

export const businessDiagnosisRows: ObservationRow[] = generateRows()

export const businessDiagnosisMeta = {
  id: DATASET_ID,
  name: 'Synthetic e-commerce funnel',
  seed: SEED,
  days: DAYS_PER_PERIOD * PERIODS.length,
  rows: businessDiagnosisRows.length,
  granularity: 'One row per date × traffic source × device × landing page',
  periods: {
    baseline: { label: 'Baseline', from: '2024-09-02', to: '2024-09-15', days: DAYS_PER_PERIOD },
    comparison: { label: 'Comparison', from: '2024-09-16', to: '2024-09-29', days: DAYS_PER_PERIOD },
  },
  metrics: {
    sessions: 'Visits that started a session on the site.',
    addToCart: 'Sessions that added at least one item to the cart.',
    checkoutStarted: 'Sessions that began checkout.',
    purchases: 'Sessions that completed a purchase.',
    revenue: 'Purchases × a fixed 1200 currency-unit average order value.',
    conversionRate: 'purchases ÷ sessions for the selected scope.',
  },
  generation: [
    'A fixed-seed linear congruential generator drives small daily variation in sessions (±3%) and in conversion (±10%); the variation is centred so each period mean is exact, and no other randomness is used.',
    'Baseline and comparison periods each span 14 consecutive days with no missing dates.',
    'Total sessions rise from 140,000 to 150,000 between periods.',
    'Traffic-source session shares change between periods, with the social share rising from 0.15 to 0.30.',
    'Device session shares also change, with mobile rising from 0.35 to 0.42.',
    'Per-source base conversion differs by source, and a per-device modifier scales it; the mobile modifier falls from 0.85 to 0.72 between periods.',
    'Funnel stages are derived from the same rate so that purchases ≤ checkout started ≤ add to cart.',
  ],
  disclaimer:
    'Synthetic scenario data. It is an assumption set chosen to make a diagnostic pattern inspectable, not a measurement of any real business.',
} as const
