import type { CaseStudyMetricGroup } from '@/case-studies/types'
import { MetricRoleBadge, ProvenanceBadge } from '@/case-studies/components/Badges'

export function MetricTable({ groups }: { groups: CaseStudyMetricGroup[] }) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.name}>
          <h3 className="text-lg font-semibold tracking-tight">{group.name}</h3>
          {group.note ? <p className="mt-1.5 text-sm text-muted">{group.note}</p> : null}

          <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                {group.name} — metric, value, definition, data type, and evaluation role
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface-2 text-xs uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Metric
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Value
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Definition
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Data
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.metrics.map((metric) => (
                  <tr key={`${group.name}-${metric.label}`} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 align-top font-medium">
                      <span className="block">{metric.label}</span>
                      {metric.scope ? (
                        <span className="mt-1 block font-mono text-[0.625rem] font-normal uppercase tracking-[0.08em] text-muted">
                          {metric.scope}
                        </span>
                      ) : null}
                    </th>
                    <td className="px-4 py-3 align-top font-mono text-base">{metric.value}</td>
                    <td className="px-4 py-3 align-top">
                      <span className="block text-muted">{metric.definition}</span>
                      {metric.caveat ? (
                        <span className="mt-1.5 block text-xs text-muted">{metric.caveat}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ProvenanceBadge provenance={metric.provenance} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <MetricRoleBadge role={metric.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
