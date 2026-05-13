// src/components/shared/Toast.jsx
// ---------------------------------------------------------------
// Toast Notification Component
//
// LEARNING: This component demonstrates:
// 1. useAppStore — reading from Zustand store
// 2. Conditional rendering with ternary operators
// 3. Array.map() to render a list of items
// 4. Lucide React icons
// ---------------------------------------------------------------

import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import useAppStore from '@/store/appStore'

// Icon map — each notification type gets its own icon
const ICONS = {
  success: <CheckCircle size={18} />,
  error:   <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info size={18} />,
}

// Color map for each type
const COLORS = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', icon: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', icon: '#3b82f6' },
}

export default function Toast() {
  // Subscribe to notifications from the global store
  // This component re-renders whenever notifications array changes
  const { notifications, removeNotification } = useAppStore()

  if (notifications.length === 0) return null

  return (
    // Fixed position container — toasts appear in bottom-right corner
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 9999,
    }}>
      {/* Render each notification */}
      {notifications.map((notif) => {
        const colors = COLORS[notif.type] || COLORS.info
        return (
          <div
            key={notif.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              minWidth: '280px',
              maxWidth: '380px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              animation: 'slideUp 0.2s ease',
            }}
          >
            {/* Icon */}
            <span style={{ color: colors.icon, flexShrink: 0 }}>
              {ICONS[notif.type]}
            </span>
            
            {/* Message */}
            <span style={{ flex: 1, fontSize: '0.875rem', color: colors.text, fontWeight: 500 }}>
              {notif.message}
            </span>
            
            {/* Close button */}
            <button
              onClick={() => removeNotification(notif.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.text,
                opacity: 0.6,
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
