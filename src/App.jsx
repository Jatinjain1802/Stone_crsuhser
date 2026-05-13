// src/App.jsx
// ---------------------------------------------------------------
// Main App Component — Router Configuration
//
// LEARNING CONCEPTS:
// 1. Routing — using HashRouter and Routes from react-router-dom
// 2. Protected Routes — wrapping routes to ensure user is logged in
// 3. Layouts — using nested routes to wrap pages in Sidebar/Topbar
// ---------------------------------------------------------------

import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Inventory from './pages/Inventory/Inventory'
import Billing from './pages/Billing/Billing'
import Vehicles from './pages/Vehicles/Vehicles'
import Customers from './pages/Customers/Customers'
import Expenses from './pages/Expenses/Expenses'
import Production from './pages/Production/Production'
import Reports from './pages/Reports/Reports'
import Settings from './pages/Settings/Settings'
import useAuthStore from './store/authStore'

/**
 * ProtectedRoute Component
 * Checks if a user is logged in. If yes, renders the children.
 * If no, redirects them to the login page.
 */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

export default function App() {
  return (
    // HashRouter is used for Electron because it's filesystem-based.
    // Standard BrowserRouter (clean URLs like /dashboard) breaks when
    // loading index.html from a file:// protocol.
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Private / Protected Routes (Wrapped in MainLayout) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="production" element={<Production />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="billing" element={<Billing />} />
          <Route path="customers" element={<Customers />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all: redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
