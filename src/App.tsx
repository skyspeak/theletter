import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PlanProvider } from './data/PlanContext'
import { Layout } from './components/Layout'
import { LetterHomePage } from './pages/LetterHomePage'
import { PlanConnectPage } from './pages/PlanConnectPage'
import { PlanBuildingPage } from './pages/PlanBuildingPage'
import { PlanAnalysisPage } from './pages/PlanAnalysisPage'
import { PlanRoadmapPage } from './pages/PlanRoadmapPage'
import { PlanWaitlistPage } from './pages/PlanWaitlistPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <PlanProvider>
      <BrowserRouter basename={basename}>
        <Layout>
          <Routes>
            <Route path="/" element={<LetterHomePage />} />
            <Route path="/plan" element={<PlanConnectPage />} />
            <Route path="/plan/building" element={<PlanBuildingPage />} />
            <Route path="/plan/analysis" element={<PlanAnalysisPage />} />
            <Route path="/plan/roadmap" element={<PlanRoadmapPage />} />
            <Route path="/plan/waitlist" element={<PlanWaitlistPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </PlanProvider>
  )
}
