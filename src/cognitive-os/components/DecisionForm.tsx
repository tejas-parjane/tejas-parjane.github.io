import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import type { ChallengeAction, ChallengeDefinition, ChallengeState } from '@/cognitive-os/types'

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="surface-card p-5">
      <legend className="section-label px-1">{legend}</legend>
      <div className="mt-2 space-y-2">{children}</div>
    </fieldset>
  )
}

function RadioRow({
  name,
  id,
  label,
  description,
  tradeoffs,
  checked,
  onChange,
}: {
  name: string
  id: string
  label: string
  description?: string
  tradeoffs?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm">
      <input type="radio" name={name} value={id} checked={checked} onChange={onChange} className="mt-1" />
      <span>
        <span className="font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>
        ) : null}
        {tradeoffs ? (
          <span className="mt-1.5 block text-xs leading-relaxed text-muted">
            <span className="font-mono uppercase tracking-[0.08em]">Trade-off: </span>
            {tradeoffs}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export function DecisionForm({
  definition,
  state,
  onChange,
  canSubmitNow,
  primaryLegend = 'Primary conclusion',
  secondaryLegend = 'Secondary component (optional)',
  secondaryNoneDescription = 'The primary explanation accounts for the change on its own.',
  actionLegend = 'Next action',
  submitLabel = 'Submit conclusion',
}: {
  definition: ChallengeDefinition
  state: ChallengeState
  onChange: (action: ChallengeAction) => void
  canSubmitNow: boolean
  primaryLegend?: string
  secondaryLegend?: string
  secondaryNoneDescription?: string
  actionLegend?: string
  submitLabel?: string
}) {
  const targetGroups = definition.decisionTargets ?? []

  const missing: string[] = []
  for (const group of targetGroups) {
    if (group.required && !state.targetSelections[group.id]) missing.push(group.label.toLowerCase())
  }
  const minExperiments = definition.minExperiments ?? 0
  if (state.experimentsRun.length < minExperiments) {
    missing.push(`at least ${minExperiments} experiment${minExperiments === 1 ? '' : 's'}`)
  }
  if (!state.primaryHypothesis) missing.push('a primary hypothesis')
  if (!state.confidence) missing.push('a confidence level')
  if (!state.nextAction) missing.push('a next action')

  return (
    <div className="space-y-6">
      {targetGroups.map((group) => (
        <Fieldset key={group.id} legend={group.label}>
          <p className="px-1 text-xs leading-relaxed text-muted">{group.description}</p>
          {group.options.map((option) => (
            <RadioRow
              key={option.id}
              name={group.id}
              id={`${group.id}-${option.id}`}
              label={option.label}
              description={option.description}
              checked={state.targetSelections[group.id] === option.id}
              onChange={() => onChange({ type: 'SET_TARGET_SELECTION', group: group.id, id: option.id })}
            />
          ))}
        </Fieldset>
      ))}

      <Fieldset legend={primaryLegend}>
        {definition.hypotheses.map((hypothesis) => (
          <RadioRow
            key={hypothesis.id}
            name="primary-hypothesis"
            id={hypothesis.id}
            label={hypothesis.label}
            description={hypothesis.statement}
            checked={state.primaryHypothesis === hypothesis.id}
            onChange={() => onChange({ type: 'SET_PRIMARY_HYPOTHESIS', id: hypothesis.id })}
          />
        ))}
      </Fieldset>

      <Fieldset legend={secondaryLegend}>
        <RadioRow
          name="secondary-hypothesis"
          id="none"
          label="None"
          description={secondaryNoneDescription}
          checked={state.secondaryHypothesis === null}
          onChange={() => onChange({ type: 'SET_SECONDARY_HYPOTHESIS', id: null })}
        />
        {definition.hypotheses.map((hypothesis) => (
          <RadioRow
            key={hypothesis.id}
            name="secondary-hypothesis"
            id={`secondary-${hypothesis.id}`}
            label={hypothesis.label}
            checked={state.secondaryHypothesis === hypothesis.id}
            onChange={() => onChange({ type: 'SET_SECONDARY_HYPOTHESIS', id: hypothesis.id })}
          />
        ))}
      </Fieldset>

      <Fieldset legend="Confidence">
        {definition.confidenceOptions.map((option) => (
          <RadioRow
            key={option.id}
            name="confidence"
            id={`confidence-${option.id}`}
            label={option.label}
            description={option.description}
            checked={state.confidence === option.id}
            onChange={() => onChange({ type: 'SET_CONFIDENCE', id: option.id })}
          />
        ))}
      </Fieldset>

      <fieldset className="surface-card p-5">
        <legend className="section-label px-1">Caveats to acknowledge</legend>
        <div className="mt-2 space-y-2">
          {definition.caveats.map((caveat) => (
            <label
              key={caveat.id}
              className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={state.acknowledgedCaveats.includes(caveat.id)}
                onChange={() => onChange({ type: 'TOGGLE_CAVEAT', id: caveat.id })}
                className="mt-1"
              />
              <span>
                {caveat.label}
                {caveat.required ? (
                  <span className="ml-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                    required
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Fieldset legend={actionLegend}>
        {definition.nextActionOptions.map((option) => (
          <RadioRow
            key={option.id}
            name="next-action"
            id={`action-${option.id}`}
            label={option.label}
            description={option.description}
            tradeoffs={option.tradeoffs}
            checked={state.nextAction === option.id}
            onChange={() => onChange({ type: 'SET_NEXT_ACTION', id: option.id })}
          />
        ))}
      </Fieldset>

      <div className="surface-card p-5">
        <label htmlFor="decision-notes" className="section-label block px-1">
          Reasoning notes (optional)
        </label>
        <textarea
          id="decision-notes"
          value={state.notes}
          onChange={(event) => onChange({ type: 'SET_NOTES', value: event.target.value })}
          rows={4}
          className="mt-3 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm"
          placeholder="State the evidence that carried the most weight and what you would still want to know."
        />
      </div>

      <div className="sticky bottom-4 rounded-2xl border border-line bg-surface/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {canSubmitNow
              ? 'Ready to submit. Your answer will be scored against the reference reading.'
              : `Choose ${missing.join(', ')} to submit.`}
          </p>
          <button
            type="button"
            disabled={!canSubmitNow}
            onClick={() => onChange({ type: 'SUBMIT' })}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-medium text-lime-ink transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
