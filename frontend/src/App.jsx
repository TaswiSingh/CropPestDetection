import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Monitor from './pages/Monitor'
import History from './pages/History'
import Analytics from './pages/Analytics'
import RiskMap from './pages/RiskMap'
import Settings from './pages/Settings'
import Placeholder from './pages/Placeholder'
import { useLanguage } from './hooks/useLanguage'

function AppContent() {
  const { t, language, setLanguage } = useLanguage()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const titles = { '/history': t('scanHistory'), '/analytics': t('analytics'), '/map': t('riskMap'), '/settings': t('settings') }
  return <AppShell t={t} language={language} setLanguage={setLanguage} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen}>
    <Routes location={location}>
      <Route path="/monitor" element={<Monitor t={t} language={language} />} />
        <Route path="/history" element={<History t={t} language={language} />} />
        <Route path="/analytics" element={<Analytics t={t} language={language} />} />
        <Route path="/map" element={<RiskMap t={t} language={language} />} />
        <Route path="/settings" element={<Settings t={t} language={language} setLanguage={setLanguage} />} />
      {Object.entries(titles).filter(([path]) => path !== '/history' && path !== '/analytics' && path !== '/map').map(([path, title]) => <Route key={path} path={path} element={<Placeholder t={t} title={title} />} />)}
      <Route path="*" element={<Navigate to="/monitor" replace />} />
    </Routes>
  </AppShell>
}

export default function App() {
  return <AppContent />
}