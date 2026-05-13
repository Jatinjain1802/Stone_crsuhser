// src/components/layout/Topbar.jsx
// ---------------------------------------------------------------
// Top Header Component
//
// LEARNING CONCEPTS:
// 1. App State — reading user info from Zustand store
// 2. Event Handling — implementing logout functionality
// 3. Conditional Rendering — showing notifications or search
// ---------------------------------------------------------------

import React from 'react'
import { Bell, LogOut, Search, User } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useAppStore from '@/store/appStore'
import { getStatusLabel } from '@/utils/format.util'

export default function Topbar() {
  const { user, logout } = useAuthStore()
  const { notify } = useAppStore()

  const handleLogout = () => {
    logout()
    notify.info('Logged out successfully')
  }

  return (
    <header className="topbar">
      {/* Search Bar Placeholder */}
      <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#a8a29e' 
          }} 
        />
        <input 
          type="text" 
          placeholder="Search for invoices, trucks, or customers..." 
          className="form-input"
          style={{ paddingLeft: '40px', background: '#f8f9fa', border: 'none' }}
        />
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notifications */}
        <button style={{ 
          background: 'none', 
          border: 'none', 
          color: '#78716c', 
          cursor: 'pointer',
          position: 'relative' 
        }}>
          <Bell size={20} />
          <span style={{ 
            position: 'absolute', 
            top: '-2px', 
            right: '-2px', 
            width: '8px', 
            height: '8px', 
            background: 'var(--color-danger)', 
            borderRadius: '50%',
            border: '2px solid white' 
          }}></span>
        </button>

        {/* Vertical Divider */}
        <div style={{ width: '1px', height: '24px', background: '#e7e5e4' }}></div>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1c1917' }}>
              {user?.name || 'Guest User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#78716c' }}>
              {getStatusLabel(user?.role)}
            </div>
          </div>
          
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            background: 'var(--color-primary-100)', 
            color: 'var(--color-primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={20} />
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          title="Logout"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
