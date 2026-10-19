import type { ProjectCaseStudy } from '@/case-studies/types'

export function ArchitectureFlow({
  steps,
}: {
  steps: ProjectCaseStudy['architecture']
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {steps.map((step, index) => (
        <li key={step.step} className="flex gap-4 rounded-xl border border-line bg-surface p-4">
          <span className="font-mono text-[0.625rem] text-muted">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <p className="text-sm font-semibold">{step.step}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
