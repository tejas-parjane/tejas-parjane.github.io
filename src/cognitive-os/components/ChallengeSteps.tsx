import { canEnterStep } from '@/cognitive-os/engine'
import type { ChallengeAction, ChallengeDefinition, ChallengeState } from '@/cognitive-os/types'

export function ChallengeSteps({
  definition,
  state,
  onGo,
}: {
  definition: ChallengeDefinition
  state: ChallengeState
  onGo: (action: ChallengeAction) => void
}) {
  return (
    <nav aria-label="Challenge steps">
      <ol className="flex flex-wrap gap-2">
        {definition.steps.map((step, index) => {
          const reachable = canEnterStep(state, step.id, definition)
          const current = state.step === step.id
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                disabled={!reachable}
                onClick={() => onGo({ type: 'GO_TO_STEP', step: step.id })}
                className={
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
                  (current
                    ? 'border-ink bg-surface-2 font-medium'
                    : 'border-line bg-surface hover:border-line-strong')
                }
              >
                <span className="font-mono text-[0.625rem] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
