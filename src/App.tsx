import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/app/theme'
import { AppShell } from '@/components/layout/AppShell'
import { AboutPage } from '@/pages/AboutPage'
import { ChallengePlaceholderPage } from '@/pages/ChallengePlaceholderPage'
import { CognitiveOsPage } from '@/pages/CognitiveOsPage'
import { EngineeringPage } from '@/pages/EngineeringPage'
import { ExperiencePage } from '@/pages/ExperiencePage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { ProjectsPage } from '@/pages/ProjectsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:slug" element={<ProjectDetailPage />} />
      <Route path="/cognitive-os" element={<CognitiveOsPage />} />
      <Route
        path="/cognitive-os/business-diagnosis"
        element={
          <ChallengePlaceholderPage
            title="Business Diagnosis"
            description="Investigate a decline in conversion rate and determine which explanation the available evidence supports."
            objective="Compare competing explanations for an approximately 18% decline in conversion rate using synthetic funnel, traffic-source, device, landing-page, and campaign data."
            duration="10–15 minutes"
            interaction="Select hypotheses, inspect evidence, filter dimensions, run predefined comparisons, and submit a provisional conclusion."
            source="Synthetic dataset bundled with the site. It is a scenario assumption, not a claim about a real business."
            willInclude={[
              'Evidence panels for sessions, funnel progression, traffic mix, device mix, landing-page performance, and conversions.',
              'Supporting and contradicting evidence for each hypothesis.',
              'Dimension filters and a predefined comparison period.',
              'Visible metric definitions and reproducible calculations.',
              'A provisional conclusion compared with a reference analysis that states uncertainty.',
              'A decision record covering evidence, limitations, and next information required.',
            ]}
          />
        }
      />
      <Route
        path="/cognitive-os/agent-autopsy"
        element={
          <ChallengePlaceholderPage
            title="Agent Autopsy"
            description="Inspect a failing AI agent workflow, identify the violated constraint, and verify a repair against deterministic tests."
            objective="Work through a predefined agent trace containing tool calls, validation checks, a failure event, and recovery behaviour. Select a failure, choose a repair, and rerun local assertions."
            duration="10–15 minutes"
            interaction="Trace inspection, failure selection, repair selection, and deterministic test reruns."
            source="Predefined trace fixture. No visitor-supplied code is executed."
            willInclude={[
              'A complete trace: request, actions, tool calls, results, policy checks, and failure events.',
              'At least three failure types: invalid tool output, missing evidence, and permission or policy violation.',
              'Visible assertions and the constraint each one tests.',
              'Distinct repair choices with verifiable outcomes.',
              'A rerun that passes only when the underlying assertions pass.',
              'A comparison between the original and repaired results.',
            ]}
          />
        }
      />
      <Route
        path="/cognitive-os/hypothesis-arena"
        element={
          <ChallengePlaceholderPage
            title="Hypothesis Arena"
            description="Compare explanations for a change in a metric, inspect the evidence, and choose an appropriate experiment."
            objective="Examine a predefined dataset, compare summary statistics across groups or periods, and review what the evidence can and cannot establish about causality."
            duration="10–15 minutes"
            interaction="Explore data, select variables, compare groups or periods, and review supported statistical results."
            source="Synthetic dataset bundled with the site."
            willInclude={[
              'Summary statistics derived from the supplied dataset.',
              'Competing hypotheses with supporting and counterexample evidence.',
              'Group and period comparisons with documented calculations.',
              'Null and alternative hypotheses, sample sizes, effect sizes, and p-values where applicable.',
              'Explicit assumptions, limitations, and a warning against causal claims from observational data.',
              'A decision record with the chosen experiment and next information required.',
            ]}
          />
        }
      />
      <Route path="/engineering" element={<EngineeringPage />} />
      <Route path="/experience" element={<ExperiencePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  )
}
