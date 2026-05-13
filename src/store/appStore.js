// src/store/appStore.js
// ---------------------------------------------------------------
// Zustand Store for Application-wide State
// (UI state, notifications, sidebar, etc.)
// ---------------------------------------------------------------

import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  // ---- UI State ----
  sidebarOpen: true,       // Sidebar expanded/collapsed
  
  // ---- Notifications (toast messages) ----
  // Notifications are temporary messages shown to the user
  // e.g., "Invoice created successfully!" or "Failed to save."
  notifications: [],
  
  // ---- Actions ----
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // addNotification: Show a toast message
  // type: 'success' | 'error' | 'warning' | 'info'
  addNotification: (message, type = 'info') => {
    const id = Date.now() // Use timestamp as unique ID
    
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }))
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      get().removeNotification(id)
    }, 4000)
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  
  // Convenience methods for different notification types
  notify: {
    success: (msg) => useAppStore.getState().addNotification(msg, 'success'),
    error:   (msg) => useAppStore.getState().addNotification(msg, 'error'),
    warning: (msg) => useAppStore.getState().addNotification(msg, 'warning'),
    info:    (msg) => useAppStore.getState().addNotification(msg, 'info'),
  },
}))

export default useAppStore
