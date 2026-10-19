export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatSignedPercent(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sign}${(Math.abs(value) * 100).toFixed(digits)}%`
}

export function formatRate(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatSigned(value: number, digits = 4): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sign}${Math.abs(value).toFixed(digits)}`
}

/** Absolute rate differences expressed in percentage points. */
export function formatPoints(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sign}${(Math.abs(value) * 100).toFixed(digits)} pp`
}
