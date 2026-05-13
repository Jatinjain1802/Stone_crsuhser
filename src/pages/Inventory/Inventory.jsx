// src/pages/Inventory/Inventory.jsx
// ---------------------------------------------------------------
// Inventory Management Page
//
// LEARNING CONCEPTS:
// 1. Modal Forms — adding/editing data in a pop-up
// 2. Search & Filter — filtering a list based on user input
// 3. Tabbed Interface — switching between Materials and Stock Logs
// 4. Form Validation — simple validation for quantity and rates
// ---------------------------------------------------------------

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  History,
  Boxes
} from 'lucide-react'
import { inventoryService } from '@/services/api'
import { formatNumber, getStatusBadge } from '@/utils/format.util'
import { formatDate, timeAgo } from '@/utils/date.util'
import useAppStore from '@/store/appStore'
import useAuthStore from '@/store/authStore'
import Modal from '@/components/shared/Modal'

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('materials') // 'materials' or 'logs'
  const [materials, setMaterials] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  
  const { notify } = useAppStore()
  const { user } = useAuthStore()

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [matResult, logResult] = await Promise.all([
        inventoryService.getMaterials(),
        inventoryService.getStockEntries()
      ])
      
      if (matResult.success) setMaterials(matResult.materials)
      if (logResult.success) setLogs(logResult.entries)
    } catch (error) {
      notify.error('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered materials based on search
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [materials, searchTerm])

  // --- Material Actions ---
  
  const handleSaveMaterial = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      unit: formData.get('unit'),
      ratePerUnit: parseFloat(formData.get('ratePerUnit')),
      minStock: parseFloat(formData.get('minStock')),
    }

    try {
      let result
      if (editingMaterial) {
        result = await inventoryService.updateMaterial(editingMaterial.id, data)
      } else {
        result = await inventoryService.createMaterial(data)
      }

      if (result.success) {
        notify.success(`Material ${editingMaterial ? 'updated' : 'added'} successfully`)
        setIsMaterialModalOpen(false)
        fetchData()
      } else {
        notify.error(result.message)
      }
    } catch (error) {
      notify.error('Something went wrong')
    }
  }

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return
    
    try {
      const result = await inventoryService.deleteMaterial(id)
      if (result.success) {
        notify.success('Material deleted')
        fetchData()
      }
    } catch (error) {
      notify.error('Delete failed')
    }
  }

  // --- Stock Entry Actions ---

  const handleStockEntry = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      materialId: parseInt(formData.get('materialId')),
      type: formData.get('type'),
      quantity: parseFloat(formData.get('quantity')),
      source: formData.get('source'),
      note: formData.get('note'),
      createdBy: user.id
    }

    try {
      const result = await inventoryService.addStockEntry(data)
      if (result.success) {
        notify.success('Stock updated successfully')
        setIsStockModalOpen(false)
        fetchData()
      } else {
        notify.error(result.message)
      }
    } catch (error) {
      notify.error('Stock update failed')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track raw stones, crushed products and current stock levels.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setIsStockModalOpen(true)}
          >
            <History size={18} /> Update Stock
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingMaterial(null)
              setIsMaterialModalOpen(true)
            }}
          >
            <Plus size={18} /> Add Material
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e7e5e4', 
        gap: '32px' 
      }}>
        <button 
          onClick={() => setActiveTab('materials')}
          style={{
            padding: '12px 4px',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'materials' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'materials' ? 'var(--color-primary-500)' : '#78716c',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={18} /> Materials List
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '12px 4px',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'logs' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'logs' ? 'var(--color-primary-500)' : '#78716c',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} /> Stock Movement Logs
          </div>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#a8a29e' }} />
          <input 
            type="text" 
            placeholder="Search materials..." 
            className="form-input"
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary btn-sm">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Main Content Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'materials' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Unit</th>
                <th>Min. Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(mat => {
                const isLow = mat.currentStock <= mat.minStock && mat.minStock > 0
                return (
                  <tr key={mat.id}>
                    <td style={{ fontWeight: 600 }}>{mat.name}</td>
                    <td><span className="badge badge-neutral">{mat.category}</span></td>
                    <td style={{ fontWeight: 700, color: isLow ? '#dc2626' : 'inherit' }}>
                      {formatNumber(mat.currentStock)}
                    </td>
                    <td>{mat.unit}</td>
                    <td>{mat.minStock} {mat.unit}</td>
                    <td>
                      {isLow ? (
                        <span className="badge badge-danger">
                          <AlertTriangle size={12} style={{ marginRight: 4 }} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-success">Healthy</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            setEditingMaterial(mat)
                            setIsMaterialModalOpen(true)
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeleteMaterial(mat.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                    {loading ? 'Loading materials...' : 'No materials found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Material</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Source/Vehicle</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{formatDate(log.date)} <span style={{ fontSize: '0.75rem', color: '#78716c' }}>{timeAgo(log.date)}</span></td>
                  <td style={{ fontWeight: 500 }}>{log.material.name}</td>
                  <td>
                    <span className={`badge ${log.type === 'in' ? 'badge-info' : 'badge-warning'}`}>
                      {log.type === 'in' ? <ArrowDownLeft size={12} style={{ marginRight: 4 }} /> : <ArrowUpRight size={12} style={{ marginRight: 4 }} />}
                      {log.type === 'in' ? 'Incoming' : 'Outgoing'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {log.type === 'in' ? '+' : '-'}{formatNumber(log.quantity)}
                  </td>
                  <td>{log.source || '-'}</td>
                  <td style={{ fontSize: '0.8125rem', color: '#78716c' }}>{log.note || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                    {loading ? 'Loading logs...' : 'No movement logs found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- Modals --- */}

      {/* Add/Edit Material Modal */}
      <Modal 
        isOpen={isMaterialModalOpen} 
        onClose={() => setIsMaterialModalOpen(false)}
        title={editingMaterial ? 'Edit Material' : 'Add New Material'}
      >
        <form onSubmit={handleSaveMaterial}>
          <div className="form-group">
            <label className="form-label">Material Name</label>
            <input 
              name="name" 
              className="form-input" 
              defaultValue={editingMaterial?.name} 
              placeholder="e.g. 10mm Gitti, Raw Stone" 
              required 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" defaultValue={editingMaterial?.category || 'finished'}>
                <option value="raw">Raw Material</option>
                <option value="finished">Finished Goods</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select name="unit" className="form-select" defaultValue={editingMaterial?.unit || 'ton'}>
                <option value="ton">Ton (Weight)</option>
                <option value="CFT">CFT (Volume)</option>
                <option value="unit">Unit (Count)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Default Rate (₹)</label>
              <input 
                type="number" 
                name="ratePerUnit" 
                className="form-input" 
                defaultValue={editingMaterial?.ratePerUnit || 0} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Min. Stock Alert</label>
              <input 
                type="number" 
                name="minStock" 
                className="form-input" 
                defaultValue={editingMaterial?.minStock || 0} 
                required 
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsMaterialModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Material</button>
          </div>
        </form>
      </Modal>

      {/* Stock Update Modal */}
      <Modal 
        isOpen={isStockModalOpen} 
        onClose={() => setIsStockModalOpen(false)}
        title="Stock Movement Entry"
      >
        <form onSubmit={handleStockEntry}>
          <div className="form-group">
            <label className="form-label">Select Material</label>
            <select name="materialId" className="form-select" required>
              <option value="">Choose a material...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name} (Current: {m.currentStock} {m.unit})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Movement Type</label>
              <select name="type" className="form-select" required>
                <option value="in">Stock In (Purchased/Raw)</option>
                <option value="out">Stock Out (Sold/Used)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="number" step="0.01" name="quantity" className="form-input" placeholder="0.00" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Source / Vehicle No.</label>
            <input name="source" className="form-input" placeholder="e.g. Supplier Name or Truck No." />
          </div>
          <div className="form-group">
            <label className="form-label">Note / Description</label>
            <textarea name="note" className="form-textarea" rows="2" placeholder="Optional notes..."></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStockModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Entry</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
