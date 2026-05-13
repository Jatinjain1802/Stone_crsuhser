// src/components/layout/MainLayout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Toast from '../shared/Toast'

export default function MainLayout() {
  return (
    <div className="app-shell">
      {/* Permanent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-area">
        <Topbar />
        
        <main className="page-content">
          {/* Outlet renders the matched child route component */}
          <Outlet />
        </main>
      </div>

      {/* Global Components */}
      <Toast />
    </div>
  )
}
