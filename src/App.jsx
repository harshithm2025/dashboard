import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar.jsx'
import { useNavigation } from '@/hooks/useNavigation'
import BrandSelector from '@/components/BrandSelector.jsx'
import { BrandProvider } from '@/context/BrandContext.jsx'
import { getBrand } from '@/services/brandService'
import DashboardManager from '@/components/DashboardManager.jsx'
import ExecutiveSummary from '@/pages/ExecutiveSummary.jsx'
import SMIntelligence from '@/pages/SMIntelligence.jsx'
import TMIntelligence from '@/pages/TMIntelligence.jsx'
import UnifiedInsights from '@/pages/UnifiedInsights.jsx'
import Recommendations from '@/pages/Recommendations.jsx'
import Auth from '@/pages/Auth.jsx'
import { getSession } from '@/lib/auth'

function PageRouter({ activePage, activeSection }) {
  switch (activePage) {
    case 'exec':    return <ExecutiveSummary />
    case 'sm':      return <SMIntelligence activeSection={activeSection} />
    case 'tm':      return <TMIntelligence activeSection={activeSection} />
    case 'unified': return <UnifiedInsights activeSection={activeSection} />
    case 'recs':    return <Recommendations activeSection={activeSection} />
    default:        return <ExecutiveSummary />
  }
}

function DashboardPage({ isPublic = false }) {
  const { brandId } = useParams()
  const navigate    = useNavigate()
  const [brand, setBrand] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getBrand(brandId, isPublic).then(b => {
      if (!b) setNotFound(true)
      else setBrand(b)
    }).catch(() => setNotFound(true))
  }, [brandId, isPublic])

  if (notFound) {
    if (isPublic) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-slate-500">This dashboard is private or does not exist.</p>
            <p className="text-sm mt-4 text-indigo-500">The owner must explicitly enable "Share Dashboard" in the settings.</p>
          </div>
        </div>
      )
    }
    return <Navigate to="/" replace />
  }
  if (!brand)   return null  // loading

  return (
    <BrandProvider brand={brand}>
      <DashboardInner brand={brand} setBrand={setBrand} onExit={() => navigate('/')} isPublic={isPublic} />
    </BrandProvider>
  )
}

function DashboardInner({ brand, setBrand, onExit, isPublic }) {
  const { config } = brand
  const { activePage, activeSection, navigate } = useNavigation('exec')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        config={config}
        activePage={activePage}
        activeSection={activeSection}
        onNavigate={navigate}
        isPublic={isPublic}
      />
      <main className="ml-[240px] flex-1 min-w-0">
        <PageRouter activePage={activePage} activeSection={activeSection} />
      </main>

      {!window.__CLIENT_MODE__ && !isPublic && (
        <DashboardManager
          brand={brand}
          onUpdate={(changes) => setBrand(prev => ({ ...prev, ...changes }))}
          onDelete={onExit}
        />
      )}
    </div>
  )
}

import { TopLoadingBar } from '@/components/shared/TopLoadingBar.jsx'

export const UserContext = React.createContext(null)

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
  }, [])

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
         <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
         <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Platform...</p>
       </div>
     </div>
  )
  if (!session) return <Auth />
  return <UserContext.Provider value={session}>{children}</UserContext.Provider>
}

export default function App() {
  if (window.__CLIENT_MODE__ && window.__BRAND_DATA__) {
    const brand = window.__BRAND_DATA__
    return (
      <BrandProvider brand={brand}>
        <DashboardInner brand={brand} setBrand={() => {}} onExit={() => {}} isPublic={true} />
      </BrandProvider>
    )
  }

  return (
    <BrowserRouter>
      <TopLoadingBar />
      <Routes>
        <Route path="/public/dashboard/:brandId" element={<DashboardPage isPublic={true} />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <BrandSelector />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/:brandId" element={
          <ProtectedRoute>
            <DashboardPage isPublic={false} />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
