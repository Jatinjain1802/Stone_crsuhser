// src/components/layout/Sidebar.jsx
// ---------------------------------------------------------------
// Sidebar Navigation Component
//
// LEARNING CONCEPTS:
// 1. Navigation — using NavLink from react-router-dom
// 2. Active State — NavLink automatically adds an "active" class
// 3. Icons — using lucide-react for professional visuals
// 4. Role-based Navigation — showing links based on user role
// ---------------------------------------------------------------

import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  FileText, 
  Users, 
  ReceiptIndianRupee, 
  BarChart3, 
  Settings,
  Hammer,
  Wallet
} from 'lucide-react'

import useAuthStore from '@/store/authStore'

// Define our menu items. Each item has a label, path, icon, and optional roles allowed.
const MENU_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
  { label: 'Production', path: '/production', icon: <Hammer size={20} /> },
  { label: 'Vehicles', path: '/vehicles', icon: <Truck size={20} /> },
  { label: 'Billing', path: '/billing', icon: <FileText size={20} /> },
  { label: 'Payments', path: '/payments', icon: <Wallet size={20} /> },
  { label: 'Customers', path: '/customers', icon: <Users size={20} /> },

  { label: 'Expenses', path: '/expenses', icon: <ReceiptIndianRupee size={20} /> },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, roles: ['admin', 'manager', 'accountant'] },
  { label: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['admin'] },
]

export default function Sidebar() {
  const { user } = useAuthStore()

  // Filter menu items based on user role
  const filteredItems = MENU_ITEMS.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user?.role)
  })

  return (
    <aside className="sidebar">
      {/* App Logo / Brand Section */}
      <div style={{ 
        padding: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'var(--color-primary-500)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <Hammer size={20} />
        </div>
        <span style={{ 
          fontSize: '1.125rem', 
          fontWeight: '700', 
          color: 'white',
          letterSpacing: '-0.02em'
        }}>
          Stone<span style={{ color: 'var(--color-primary-500)' }}>ERP</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            // NavLink's "className" can take a function that receives isActive
            className={({ isActive }) => `
              nav-link ${isActive ? 'active' : ''}
            `}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
            })}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer / User Info could go here */}
      <div style={{ marginTop: 'auto', padding: '24px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>
        v1.0.0 Alpha
      </div>
    </aside>
  )
}
