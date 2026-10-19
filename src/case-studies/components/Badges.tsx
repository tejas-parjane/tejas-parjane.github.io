import type { ReactNode } from 'react'
import {
  metricRoleLabels,
  provenanceLabels,
  verificationLabels,
  type DataProvenance,
  type MetricRole,
  type VerificationLevel,
} from '@/case-studies/types'
import { cn } from '@/lib/cn'

type Tone = 'accent' | 'neutral' | 'warn' | 'info' | 'muted'

const toneStyles: Record<Tone, string> = {
  accent: 'border-lime/60 bg-lime/15 text-ink',
  neutral: 'border-line bg-surface-2 text-ink',
  warn: 'border-amber-500/50 bg-amber-500/10 text-ink',
  info: 'border-sky-500/40 bg-sky-500/10 text-ink',
  muted: 'border-line bg-surface text-muted',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-[0.1em]',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function ProvenanceBadge({ provenance }: { provenance: DataProvenance }) {
  const tone: Tone =
    provenance === 'real-world' ? 'accent' : provenance === 'simulated' ? 'info' : 'warn'
  return <Badge tone={tone}>{provenanceLabels[provenance]}</Badge>
}

export function MetricRoleBadge({ role }: { role: MetricRole }) {
  return <Badge tone="muted">{metricRoleLabels[role]}</Badge>
}

export function VerificationBadge({ level }: { level: VerificationLevel }) {
  const tone: Tone =
    level === 'verified-from-source' ? 'accent' : level === 'owner-reported' ? 'warn' : 'muted'
  return <Badge tone={tone}>{verificationLabels[level]}</Badge>
}
