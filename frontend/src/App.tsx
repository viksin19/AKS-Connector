import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'

import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pods from './pages/Pods'
import Deployments from './pages/Deployments'
import { ClusterProvider } from './contexts/ClusterContext'
import { WebSocketProvider } from './contexts/WebSocketContext'

function App() {
  return (
    <ClusterProvider>
      <WebSocketProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pods" element={<Pods />} />
            <Route path="/deployments" element={<Deployments />} />
          </Routes>
        </Layout>
      </WebSocketProvider>
    </ClusterProvider>
  )
}

export default App