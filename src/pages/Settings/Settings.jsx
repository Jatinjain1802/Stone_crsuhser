// src/pages/Settings/Settings.jsx
// ---------------------------------------------------------------
// Settings & User Management Page
//
// LEARNING CONCEPTS:
// 1. User CRUD — managing accounts and roles
// 2. Form Logic — updating existing records
// 3. System Config — managing business details
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  UserPlus, 
  Shield, 
  Database, 
  Key,
  User,
  Check,
  X
} from 'lucide-react'
import { authService } from '@/services/api'
import { getStatusLabel } from '@/utils/format.util'
import useAppStore from '@/store/appStore'
import useAuthStore from '@/store/authStore'
import Modal from '@/components/shared/Modal'

export default function Settings() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { notify } = useAppStore()
  const { user: currentUser } = useAuthStore()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const result = await authService.getUsers()
      if (result.success) setUsers(result.users)
    } catch (error) {
      notify.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      mobile: formData.get('mobile')
    }

    try {
      const result = await authService.createUser(data)
      if (result.success) {
        notify.success('User account created')
        setIsModalOpen(false)
        fetchUsers()
      } else {
        notify.error(result.message)
      }
    } catch (error) {
      notify.error('Failed to create user')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Manage user accounts, roles and system configurations.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Sidebar Settings Categories */}
        <div className="card" style={{ padding: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ 
              padding: '12px 16px', 
              background: '#fff7ed', 
              color: 'var(--color-primary-500)', 
              borderRadius: '8px', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Shield size={18} /> User Management
            </div>
            <div style={{ 
              padding: '12px 16px', 
              color: '#78716c', 
              borderRadius: '8px', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'not-allowed',
              opacity: 0.6
            }}>
              <Database size={18} /> Backup & Restore
            </div>
            <div style={{ 
              padding: '12px 16px', 
              color: '#78716c', 
              borderRadius: '8px', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'not-allowed',
              opacity: 0.6
            }}>
              <SettingsIcon size={18} /> Business Info
            </div>
          </div>
        </div>

        {/* User Management Content */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '20px' }}>
            <h2 className="card-title">Active User Accounts</h2>
            {currentUser?.role === 'admin' && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                <UserPlus size={16} /> Add User
              </button>
            )}
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#78716c' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{getStatusLabel(u.role)}</span>
                  </td>
                  <td>{u.mobile || '-'}</td>
                  <td>
                    {u.isActive ? (
                      <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
                        <Check size={14} /> Active
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
                        <X size={14} /> Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" disabled={u.id === currentUser.id}>
                      <Key size={14} /> Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Add User Modal --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Account">
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input name="name" className="form-input" placeholder="e.g. John Doe" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address (Login ID)</label>
            <input type="email" name="email" className="form-input" placeholder="john@stonecrusher.local" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input" placeholder="Min. 6 chars" required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" className="form-select">
                <option value="manager">Manager</option>
                <option value="accountant">Accountant</option>
                <option value="gate">Gate Keeper</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input name="mobile" className="form-input" placeholder="Optional" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Account</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
