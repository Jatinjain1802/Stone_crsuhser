// src/store/authStore.js
// ---------------------------------------------------------------
// Zustand Store for Authentication State
//
// WHY ZUSTAND?
// In React, we need to share state between components (e.g., the
// logged-in user needs to be known by Sidebar, Topbar, every page).
// Without a state manager, we'd need to "prop-drill" — pass user
// down through every component as props. That's messy.
//
// Zustand creates a global store — any component can read from
// or write to it without prop drilling.
//
// HOW ZUSTAND WORKS:
//   const useAuthStore = create((set) => ({
//     state1: initialValue,
//     action1: (newValue) => set({ state1: newValue }),
//   }))
//
// In any component:
//   const { user, setUser } = useAuthStore()
//
// set() triggers React to re-render components that use that state.
// ---------------------------------------------------------------

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 'persist' middleware saves store to localStorage so the user stays
// logged in even after closing and reopening the app
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ---- State ----
      user: null,       // The logged-in user object (or null if not logged in)
      isLoading: false, // Track loading state during login
      
      // ---- Actions ----
      
      // setUser: Called when login succeeds, saves user to store
      setUser: (user) => set({ user }),
      
      // logout: Clears the user from store (back to login screen)
      logout: () => set({ user: null }),
      
      // setLoading: Shows/hides loading state during async operations
      setLoading: (isLoading) => set({ isLoading }),
      
      // Helper getter: check if user has a specific role
      // Usage: const isAdmin = useAuthStore(state => state.hasRole('admin'))
      hasRole: (role) => {
        const user = get().user
        if (!user) return false
        if (user.role === 'admin') return true // admin has all permissions
        return user.role === role
      },
    }),
    {
      name: 'auth-storage',      // Key in localStorage
      partialize: (state) => ({ user: state.user }), // Only persist user, not loading state
    }
  )
)

export default useAuthStore
