// src/pages/Auth/Login.jsx
// ---------------------------------------------------------------
// Login Page Component
//
// LEARNING CONCEPTS:
// 1. Form Handling — using local state for input values
// 2. Async/Await — handling the asynchronous login request
// 3. Navigation — redirecting the user after login
// 4. Persistence — storing user info in global state (Zustand)
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hammer, Lock, Mail, Loader2 } from 'lucide-react'
import { authService } from '@/services/api'
import useAuthStore from '@/store/authStore'
import useAppStore from '@/store/appStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const navigate = useNavigate()
  const { setUser, user } = useAuthStore()
  const { notify } = useAppStore()

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      notify.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await authService.login(email, password)
      
      if (result.success) {
        setUser(result.user)
        notify.success(`Welcome back, ${result.user.name}`)
        navigate('/')
      } else {
        notify.error(result.message || 'Login failed')
      }
    } catch (error) {
      notify.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.4s ease'
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--color-primary-50)',
            color: 'var(--color-primary-500)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Hammer size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1c1917' }}>
            Stone<span style={{ color: 'var(--color-primary-500)' }}>ERP</span>
          </h1>
          <p style={{ color: '#78716c', fontSize: '0.875rem', marginTop: '4px' }}>
            Sign in to manage your plant
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#a8a29e' }} />
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#a8a29e' }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '12px', justifyContent: 'center' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-pulse" size={20} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ 
          marginTop: '32px', 
          textAlign: 'center', 
          fontSize: '0.75rem', 
          color: '#a8a29e',
          borderTop: '1px solid #f5f5f4',
          paddingTop: '20px'
        }}>
          Offline Desktop Version 1.0.0
          <br />
          Heerova Solution © 2026
        </div>
      </div>
    </div>
  )
}
