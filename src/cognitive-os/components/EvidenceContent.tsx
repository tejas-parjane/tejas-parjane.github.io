import type { ReactNode } from 'react'
import { groupKeyLabel } from '@/cognitive-os/analysis/businessDiagnosisAnalysis'
import type { BusinessDiagnosisView } from '@/cognitive-os/challenges/businessDiagnosisView'
import { formatNumber, formatPercent, formatPoints, formatRate, formatSigned } from '@/cognitive-os/format'

function Table({
  caption,
  head,
  rows,
}: {
  caption: string
  head: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-surface-2 text-xs uppercase tracking-[0.08em] text-muted">
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-3 py-2 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-line last:border-b-0">
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row" className="px-3 py-2 align-top font-medium">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex} className="px-3 py-2 align-top">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DefinitionList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-line bg-surface px-3 py-2">
          <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted">{label}</dt>
          <dd className="mt-1 text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function relativeChange(base: number, next: number): string {
  if (base === 0) return '±0%'
  return formatPercent(next / base - 1)
}

function sourceRows(view: BusinessDiagnosisView): ReactNode[][] {
  return view.sources.map((group) => [
    groupKeyLabel(group.key),
    `${formatNumber(group.baseline.sessions)} → ${formatNumber(group.comparison.sessions)}`,
    `${formatPercent(group.baselineShare, 1)} → ${formatPercent(group.comparisonShare, 1)}`,
    formatRate(group.baseline.rate),
    formatRate(group.comparison.rate),
    formatPoints(group.rateChange),
    relativeChange(group.baseline.rate, group.comparison.rate),
  ])
}

export function EvidenceContent({ id, view }: { id: string; view: BusinessDiagnosisView }) {
  switch (id) {
    case 'e-funnel': {
      const { baseline, comparison } = view.funnel
      return (
        <div className="space-y-4">
          <Table
            caption="Funnel counts by period"
            head={['Stage', 'Baseline', 'Comparison', 'Change']}
            rows={[
              ['Sessions', formatNumber(baseline.sessions), formatNumber(comparison.sessions), formatPercent(comparison.sessions / baseline.sessions - 1)],
              ['Add to cart', formatNumber(baseline.addToCart), formatNumber(comparison.addToCart), formatPercent(comparison.addToCart / baseline.addToCart - 1)],
              ['Checkout started', formatNumber(baseline.checkoutStarted), formatNumber(comparison.checkoutStarted), formatPercent(comparison.checkoutStarted / baseline.checkoutStarted - 1)],
              ['Purchases', formatNumber(baseline.purchases), formatNumber(comparison.purchases), formatPercent(comparison.purchases / baseline.purchases - 1)],
              ['Revenue', formatNumber(baseline.revenue), formatNumber(comparison.revenue), formatPercent(comparison.revenue / baseline.revenue - 1)],
            ]}
          />
          <Table
            caption="Funnel stage rates by period"
            head={['Stage rate', 'Baseline', 'Comparison', 'Change']}
            rows={[
              ['Add-to-cart rate', formatRate(baseline.addToCartRate), formatRate(comparison.addToCartRate), formatPoints(comparison.addToCartRate - baseline.addToCartRate)],
              ['Checkout rate', formatRate(baseline.checkoutRate), formatRate(comparison.checkoutRate), formatPoints(comparison.checkoutRate - baseline.checkoutRate)],
              ['Conversion rate', formatRate(baseline.rate), formatRate(comparison.rate), formatPoints(view.funnel.absoluteChange)],
            ]}
          />
        </div>
      )
    }

    case 'e-by-source': {
      return (
        <Table
          caption="Conversion and session share by traffic source"
          head={['Source', 'Sessions', 'Share of sessions', 'Conversion (base)', 'Conversion (comp.)', 'Change', 'Relative']}
          rows={sourceRows(view)}
        />
      )
    }

    case 'e-by-device': {
      return (
        <div className="space-y-3">
          <Table
            caption="Aggregate conversion by device"
            head={['Device', 'Sessions', 'Conversion (base)', 'Conversion (comp.)', 'Change', 'Relative']}
            rows={view.devices.map((group) => [
              groupKeyLabel(group.key),
              `${formatNumber(group.baseline.sessions)} → ${formatNumber(group.comparison.sessions)}`,
              formatRate(group.baseline.rate),
              formatRate(group.comparison.rate),
              formatPoints(group.rateChange),
              relativeChange(group.baseline.rate, group.comparison.rate),
            ])}
          />
          <p className="text-xs leading-relaxed text-muted">
            Caution: each device row still contains the traffic-source mix change, so a lower device rate
            here does not prove that device behaved differently. Use the within-source, within-device
            comparison to separate the two.
          </p>
        </div>
      )
    }

    case 'e-standardized-source': {
      const standard = view.standardizedSource
      return (
        <div className="space-y-4">
          <DefinitionList
            rows={[
              ['Baseline rate', formatRate(standard.baselineRate)],
              ['Observed comparison rate', formatRate(standard.observedRate)],
              ['Standardised comparison rate', formatRate(standard.standardizedRate)],
              ['Observed change', formatPoints(standard.observedChange)],
              ['Change after standardising', formatPoints(standard.standardizedChange)],
              ['Explained by mix', formatPercent(standard.explainedFraction)],
            ]}
          />
          <p className="text-sm leading-relaxed text-muted">
            Reweighting the comparison period to the baseline source mix raises the rate to{' '}
            {formatRate(standard.standardizedRate)}, removing {formatPercent(standard.explainedFraction)} of the
            observed change. The remainder, {formatPoints(standard.standardizedChange)}, is not explained by mix.
          </p>
        </div>
      )
    }

    case 'e-decomposition': {
      const decomposition = view.decomposition
      const segments = [
        { label: 'Mix', value: decomposition.mix, tone: 'bg-lime' },
        { label: 'Within-group rate', value: decomposition.rate, tone: 'bg-amber-500' },
        { label: 'Interaction', value: decomposition.interaction, tone: 'bg-sky-500' },
      ]
      const totalMagnitude = Math.abs(decomposition.mix) + Math.abs(decomposition.rate) + Math.abs(decomposition.interaction)
      return (
        <div className="space-y-4">
          <Table
            caption="Shift-share decomposition of the conversion-rate change"
            head={['Term', 'Contribution', 'Share of change']}
            rows={[
              ['Mix (composition)', formatPoints(decomposition.mix), formatPercent(decomposition.mixShare)],
              ['Within-group rate', formatPoints(decomposition.rate), formatPercent(decomposition.rateShare)],
              ['Interaction', formatPoints(decomposition.interaction), formatPercent(decomposition.interactionShare)],
              ['Total', formatPoints(decomposition.total), '100.0%'],
            ]}
          />
          <div
            className="flex h-4 overflow-hidden rounded-full border border-line"
            role="img"
            aria-label={`Mix ${formatPercent(decomposition.mixShare)}, within-group rate ${formatPercent(
              decomposition.rateShare,
            )}, interaction ${formatPercent(decomposition.interactionShare)}`}
          >
            {segments.map((segment) => (
              <span
                key={segment.label}
                className={segment.tone}
                style={{ width: totalMagnitude === 0 ? '0%' : `${(Math.abs(segment.value) / totalMagnitude) * 100}%` }}
              />
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Segments are shown by magnitude; the interaction term is a cross effect, not a separate cause.
          </p>
        </div>
      )
    }

    case 'e-by-source-device': {
      const devices = ['desktop', 'mobile', 'tablet'] as const
      const sources = ['organic', 'paid_search', 'social', 'email'] as const
      const head = ['Source', ...devices.map((device) => groupKeyLabel(device))]
      const rows = sources.map((source) => {
        const cells: ReactNode[] = [groupKeyLabel(source)]
        for (const device of devices) {
          const cell = view.matrix.find((item) => item.source === source && item.device === device)
          cells.push(
            cell
              ? `${formatRate(cell.baselineRate)} → ${formatRate(cell.comparisonRate)} (${formatPoints(cell.rateChange)})`
              : '—',
          )
        }
        return cells
      })
      return (
        <div className="space-y-3">
          <Table caption="Conversion by device within each traffic source" head={head} rows={rows} />
          <p className="text-xs leading-relaxed text-muted">
            Holding the source constant, mobile conversion falls within every source while desktop and tablet are
            broadly flat. That residual drop is not explained by the mix shift.
          </p>
        </div>
      )
    }

    case 'e-landing-standardized': {
      const standard = view.landingStandardized
      return (
        <div className="space-y-4">
          <DefinitionList
            rows={[
              ['Landing-page mix explains', formatPercent(standard.explainedFraction)],
              ['Standardised comparison rate', formatRate(standard.standardizedRate)],
              ['Remaining change', formatPoints(standard.standardizedChange)],
            ]}
          />
          <Table
            caption="Conversion by landing page"
            head={['Landing page', 'Share (base → comp.)', 'Conversion (base)', 'Conversion (comp.)', 'Change']}
            rows={view.landingPages.map((group) => [
              groupKeyLabel(group.key),
              `${formatPercent(group.baselineShare, 1)} → ${formatPercent(group.comparisonShare, 1)}`,
              formatRate(group.baseline.rate),
              formatRate(group.comparison.rate),
              formatPoints(group.rateChange),
            ])}
          />
          <p className="text-xs leading-relaxed text-muted">
            Landing page accounts for only {formatPercent(standard.explainedFraction)} of the change, so it is not the
            main driver of the decline.
          </p>
        </div>
      )
    }

    case 'e-noise': {
      const noise = view.noise
      const minimum = noise.dailyRates.length === 0 ? 0 : Math.min(...noise.dailyRates)
      const maximum = noise.dailyRates.length === 0 ? 0 : Math.max(...noise.dailyRates)
      return (
        <div className="space-y-4">
          <DefinitionList
            rows={[
              ['Baseline daily mean', formatRate(noise.mean)],
              ['Baseline daily standard deviation', formatRate(noise.stdDev)],
              ['Observed change', formatPoints(noise.observedChange)],
              ['Z-score of the change', formatSigned(noise.zScore, 2)],
              ['Baseline daily range', `${formatRate(minimum)} to ${formatRate(maximum)}`],
            ]}
          />
          <p className="text-sm leading-relaxed text-muted">
            {noise.exceedsNoise
              ? 'The change is larger than ordinary day-to-day variation, so it needs a structural explanation.'
              : 'The change sits within ordinary day-to-day variation, so it may need no explanation yet.'}
          </p>
        </div>
      )
    }

    case 'e-completeness': {
      const check = view.completeness
      return (
        <DefinitionList
          rows={[
            ['Expected days', formatNumber(check.expectedDays)],
            ['Days present', formatNumber(check.presentDays)],
            ['Missing days', check.missingDays.length === 0 ? 'None' : check.missingDays.join(', ')],
            ['Rows in dataset', formatNumber(check.rowCount)],
            ['Funnel-order violations', formatNumber(view.funnelOrderIssues)],
          ]}
        />
      )
    }

    default:
      return <p className="text-sm text-muted">No evidence available.</p>
  }
}
