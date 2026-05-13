// src/pages/Production/Production.jsx
// ---------------------------------------------------------------
// Production Recording Page
//
// LEARNING CONCEPTS:
// 1. Data Entry — recording daily output of finished goods
// 2. Stock Linking — production automatically increases finished goods stock
// 3. Grid Visuals — showing production trends over time
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { 
  Hammer, 
  Plus, 
  Calendar, 
  BarChart, 
  Activity,
  History
} from 'lucide-react'
import { inventoryService } from '@/services/api'
import { formatNumber } from '@/utils/format.util'
import { formatDate, toInputDate } from '@/utils/date.util'
import useAppStore from '@/store/appStore'
import useAuthStore from '@/store/authStore'
import Modal from '@/components/shared/Modal'
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Production() {
  const [productions, setProductions] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { notify } = useAppStore()
  const { user } = useAuthStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodResult, matResult] = await Promise.all([
        inventoryService.getProduction(),
        inventoryService.getMaterials()
      ])
      
      if (prodResult.success) setProductions(prodResult.productions)
      if (matResult.success) setMaterials(matResult.materials.filter(m => m.category === 'finished'))
    } catch (error) {
      notify.error('Failed to load production data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      materialId: parseInt(formData.get('materialId')),
      quantity: parseFloat(formData.get('quantity')),
      date: new Date(formData.get('date')),
      machineId: formData.get('machineId'),
      note: formData.get('note'),
      addedBy: user.id
    }

    try {
      const result = await inventoryService.addProduction(data)
      if (result.success) {
        notify.success('Production recorded successfully')
        setIsModalOpen(false)
        fetchData()
      }
    } catch (error) {
      notify.error('Failed to record production')
    }
  }

  // Format chart data
  const chartData = productions.slice(0, 10).reverse().map(p => ({
    date: formatDate(p.date),
    quantity: p.quantity,
    material: p.material.name
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Crusher Production</h1>
          <p className="page-subtitle">Log daily output from your crusher machines.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Production
        </button>
      </div>

      {/* Production Trend Chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Production Output</h2>
          <div className="badge badge-info">Last 10 Entries</div>
        </div>
        <div style={{ height: '240px', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} barSize={40} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Production Log */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Material Produced</th>
              <th>Quantity</th>
              <th>Machine ID</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {productions.map(p => (
              <tr key={p.id}>
                <td>{formatDate(p.date)}</td>
                <td style={{ fontWeight: 600 }}>{p.material.name}</td>
                <td style={{ fontWeight: 700, color: '#059669' }}>
                  +{formatNumber(p.quantity)} {p.material.unit}
                </td>
                <td>{p.machineId || '-'}</td>
                <td style={{ color: '#78716c', fontSize: '0.8125rem' }}>{p.note || '-'}</td>
              </tr>
            ))}
            {productions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                  No production records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Production Modal --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Production Output">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Production Date</label>
            <input type="date" name="date" className="form-input" defaultValue={toInputDate(new Date())} required />
          </div>
          
          <div className="form-group">
            <label className="form-label">Material Produced</label>
            <select name="materialId" className="form-select" required>
              <option value="">Select Material...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="number" step="0.01" name="quantity" className="form-input" placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Machine ID / Unit</label>
              <input name="machineId" className="form-input" placeholder="e.g. Unit-1" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea name="note" className="form-textarea" rows="2" placeholder="Optional notes..."></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Production</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
