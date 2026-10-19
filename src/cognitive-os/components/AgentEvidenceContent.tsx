import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import type { AgentAutopsyView } from '@/cognitive-os/challenges/agentAutopsyView'
import { formatNumber } from '@/cognitive-os/format'

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
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

function BufferChips({ ids, emptyLabel }: { ids: string[]; emptyLabel: string }) {
  if (ids.length === 0) return <span className="text-muted">{emptyLabel}</span>
  return (
    <span className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <span key={id} className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs">
          {id}
        </span>
      ))}
    </span>
  )
}

export function AgentEvidenceContent({ id, view }: { id: string; view: AgentAutopsyView }) {
  const { analysis } = view

  switch (id) {
    case 'ev-04': {
      const { docs, staleRankedFirst, authoritativeRank, outdatedRank } = analysis.retrieval
      return (
        <div className="space-y-3">
          <Table
            caption="Ranked retrieval results joined to the document catalogue"
            head={['Rank', 'Document', 'Family · version', 'Score', 'Status', 'Statement']}
            rows={docs.map((doc) => [
              `#${doc.rank}`,
              doc.docId,
              `${doc.family} · v${doc.version}`,
              formatNumber(doc.score, 2),
              doc.supersededOn === null ? 'Current' : `Superseded ${doc.supersededOn}`,
              doc.statement,
            ])}
          />
          <p className="text-xs leading-relaxed text-muted">
            {staleRankedFirst
              ? `The superseded document ranked first (#${outdatedRank}) and the current document second (#${authoritativeRank}). Retrieval returned both, so relevance ranking alone did not remove the correct source.`
              : 'The current document ranked above the superseded one.'}
          </p>
        </div>
      )
    }

    case 'ev-06': {
      const { current, superseded } = analysis.versions
      const currentDays = current?.docId ? analysis.answer.authoritativeDays : null
      return (
        <div className="space-y-3">
          <DefinitionList
            rows={[
              ['Current document', current?.docId ?? '—'],
              ['Current since', current?.effective ?? '—'],
              ['Current window', currentDays === null ? '—' : `${currentDays} days`],
              [
                'Superseded',
                superseded.length === 0
                  ? '—'
                  : superseded.map((item) => `${item.docId} (${item.supersededOn})`).join(', '),
              ],
            ]}
          />
          <p className="text-xs leading-relaxed text-muted">
            The version check establishes which document is authoritative. It runs after retrieval and before
            compaction, so the correct version is known to the pipeline.
          </p>
        </div>
      )
    }

    case 'ev-07': {
      const { before } = analysis.context
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-muted">Buffer contents assembled before compaction:</p>
          <BufferChips ids={before} emptyLabel="Buffer was empty." />
          <p className="text-xs leading-relaxed text-muted">
            The authoritative chunk is present here, so the correct evidence existed in the pipeline before the
            compaction step.
          </p>
        </div>
      )
    }

    case 'ev-08': {
      const { before, after, dropped, note } = analysis.context
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface px-3 py-2">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted">Before</p>
              <div className="mt-2">
                <BufferChips ids={before} emptyLabel="—" />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface px-3 py-2">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted">After</p>
              <div className="mt-2">
                <BufferChips ids={after} emptyLabel="—" />
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Dropped:{' '}
            {dropped.length === 0 ? (
              'nothing'
            ) : (
              <span className="font-mono">{dropped.join(', ')}</span>
            )}
            . {note}
          </p>
        </div>
      )
    }

    case 'ev-09': {
      const { checks, gap, allPassed } = analysis.policy
      return (
        <div className="space-y-3">
          <ul className="space-y-2">
            {checks.map((check) => (
              <li
                key={check.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-sm"
              >
                <span>{check.label}</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted">
                  {check.passed ? (
                    <Check aria-hidden="true" className="size-3.5 text-lime" />
                  ) : (
                    <X aria-hidden="true" className="size-3.5" />
                  )}
                  {check.passed ? 'pass' : 'fail'}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-muted">
            Every recorded check passed. {gap} {allPassed ? 'The failure is not a policy failure.' : ''}
          </p>
        </div>
      )
    }

    case 'ev-10': {
      const { contextDocIds, conflictPresent } = analysis.synthesis
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-muted">Documents placed in the synthesis context:</p>
          <BufferChips ids={contextDocIds} emptyLabel="No documents." />
          <p className="text-xs leading-relaxed text-muted">
            {conflictPresent
              ? 'Two or more versions reached synthesis, so it could have weighed conflicting evidence.'
              : 'Only one document reached synthesis. The synthesizer never saw the conflicting evidence, so it could not ignore evidence it did not receive.'}
          </p>
        </div>
      )
    }

    case 'ev-11': {
      const { answerDays, authoritativeDays, supported, citations, claims } = analysis.answer
      return (
        <div className="space-y-3">
          <DefinitionList
            rows={[
              ['Answer states', answerDays === null ? '—' : `${answerDays} days`],
              ['Authoritative value', authoritativeDays === null ? '—' : `${authoritativeDays} days`],
              ['Supported by trace', supported ? 'Yes' : 'No'],
              ['Citations', citations.length === 0 ? 'None' : citations.join(', ')],
            ]}
          />
          <Table
            caption="Answer claims against the authoritative document"
            head={['Claim', 'Answer', 'Authoritative', 'Supported']}
            rows={claims.map((claim) => [
              claim.claim,
              `${claim.valueDays} days`,
              claim.authoritativeDays === null ? '—' : `${claim.authoritativeDays} days`,
              claim.supported ? 'Yes' : 'No',
            ])}
          />
        </div>
      )
    }

    case 'x-context-diff': {
      const { before, after, dropped, droppedAuthoritative } = analysis.context
      return (
        <div className="space-y-3">
          <DefinitionList
            rows={[
              ['Documents before', before.length === 0 ? '—' : before.join(', ')],
              ['Documents after', after.length === 0 ? '—' : after.join(', ')],
              ['Dropped', dropped.length === 0 ? 'Nothing' : dropped.join(', ')],
              ['Authoritative dropped', droppedAuthoritative ? 'Yes' : 'No'],
            ]}
          />
          <p className="text-sm leading-relaxed text-muted">
            {droppedAuthoritative
              ? 'The diff shows the authoritative document was present before compaction and absent after it, while the answer depends on that exact document. This is the point at which the outcome became unrecoverable.'
              : 'The authoritative document was not lost, so compaction did not remove the evidence the answer needed.'}
          </p>
        </div>
      )
    }

    case 'x-answer-support': {
      const { answerDays, authoritativeDays, contradictsTrace, citesOutdatedSource } = analysis.answer
      return (
        <div className="space-y-3">
          <DefinitionList
            rows={[
              ['Answer value', answerDays === null ? '—' : `${answerDays} days`],
              ['Authoritative value', authoritativeDays === null ? '—' : `${authoritativeDays} days`],
              ['Contradicts the trace', contradictsTrace ? 'Yes' : 'No'],
              ['Cites a superseded source', citesOutdatedSource ? 'Yes' : 'No'],
            ]}
          />
          <p className="text-sm leading-relaxed text-muted">
            {contradictsTrace
              ? 'The returned answer contradicts the authoritative document present in the trace, so the response is unsupported. This confirms the symptom; it does not show why the evidence went missing.'
              : 'The answer is consistent with the authoritative document in the trace.'}
          </p>
        </div>
      )
    }

    case 'x-tool-audit': {
      const { steps, missingSteps } = analysis.tools
      return (
        <div className="space-y-3">
          <Table
            caption="Required steps and whether they ran"
            head={['Required step', 'Executed']}
            rows={steps.map((step) => [step.step, step.executed ? 'Yes' : 'No'])}
          />
          <p className="text-xs leading-relaxed text-muted">
            {missingSteps.length === 0
              ? 'Every step the plan required ran in order, so the failure is not a missing or wrong tool call.'
              : `Steps not executed: ${missingSteps.join(', ')}.`}
          </p>
        </div>
      )
    }

    default:
      return <p className="text-sm text-muted">No evidence available.</p>
  }
}
