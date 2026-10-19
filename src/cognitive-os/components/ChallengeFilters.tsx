import { Filter } from 'lucide-react'
import { ALL_FILTER_VALUE } from '@/cognitive-os/engine'
import type { ChallengeAction, ChallengeDefinition, ChallengeState } from '@/cognitive-os/types'

export function ChallengeFilters({
  definition,
  state,
  onChange,
  labelForValue,
  note,
}: {
  definition: ChallengeDefinition
  state: ChallengeState
  onChange: (action: ChallengeAction) => void
  labelForValue?: (dimensionId: string, value: string) => string
  note?: string
}) {
  if (definition.filters.length === 0) return null

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="section-label flex items-center gap-2">
        <Filter aria-hidden="true" className="size-3.5" />
        {note ?? 'Filters (affect the evidence you see, not the score)'}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {definition.filters.map((dimension) => (
          <label key={dimension.id} className="block text-sm">
            <span className="font-medium">{dimension.label}</span>
            <select
              value={state.filters[dimension.id] ?? ALL_FILTER_VALUE}
              onChange={(event) =>
                onChange({ type: 'SET_FILTER', dimension: dimension.id, value: event.target.value })
              }
              className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
            >
              <option value={ALL_FILTER_VALUE}>All</option>
              {dimension.values.map((value) => (
                <option key={value} value={value}>
                  {labelForValue ? labelForValue(dimension.id, value) : value}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  )
}
