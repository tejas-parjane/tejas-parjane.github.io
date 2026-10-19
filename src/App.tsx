import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/app/theme'
import { AppShell } from '@/components/layout/AppShell'
import { AboutPage } from '@/pages/AboutPage'
import { AgentAutopsyPage } from '@/pages/AgentAutopsyPage'
import { BusinessDiagnosisPage } from '@/pages/BusinessDiagnosisPage'
import { CognitiveOsPage } from '@/pages/CognitiveOsPage'
import { EngineeringPage } from '@/pages/EngineeringPage'
import { ExperiencePage } from '@/pages/ExperiencePage'
import { HomePage } from '@/pages/HomePage'
import { HypothesisArenaPage } from '@/pages/HypothesisArenaPage'
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
      <Route path="/cognitive-os/business-diagnosis" element={<BusinessDiagnosisPage />} />
      <Route path="/cognitive-os/agent-autopsy" element={<AgentAutopsyPage />} />
      <Route path="/cognitive-os/hypothesis-arena" element={<HypothesisArenaPage />} />
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
