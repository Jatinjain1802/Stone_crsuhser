// src/pages/Vehicles/Vehicles.jsx
// ---------------------------------------------------------------
// Vehicle Entry/Exit (Gate Management) Page
//
// LEARNING CONCEPTS:
// 1. Weight Calculations — entry vs exit weight for net load
// 2. Conditional Styling — highlight trucks still inside the plant
// 3. Status Transitions — updating an existing record (entry -> exit)
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { 
  Truck, 
  Plus, 
  Search, 
  ArrowRightLeft, 
  Clock, 
  Scale, 
  LogOut,
  Navigation,
  FileText
} from 'lucide-react'
import { vehicleService } from '@/services/api'
import { formatWeight, getStatusBadge } from '@/utils/format.util'
import { formatDate, formatTime, timeAgo } from '@/utils/date.util'
import useAppStore from '@/store/appStore'
import useAuthStore from '@/store/authStore'
import Modal from '@/components/shared/Modal'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'inside'
  
  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [movementType, setMovementType] = useState('out') // 'out' (Outgoing) or 'in' (Incoming)

  
  const { notify } = useAppStore()
  const { user } = useAuthStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await vehicleService.getAll()
      if (result.success) setVehicles(result.vehicles)
    } catch (error) {
      notify.error('Failed to load vehicle data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const insideVehicles = vehicles.filter(v => !v.exitTime)

  // --- Actions ---

  const handleEntry = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      vehicleNo: formData.get('vehicleNo').toUpperCase(),
      driverName: formData.get('driverName'),
      materialType: formData.get('materialType'),
      entryWeight: parseFloat(formData.get('entryWeight')),
      type: movementType, // Use the state instead of radio value for better reliability
      challanNo: formData.get('challanNo'),
      createdBy: user.id
    }


    try {
      const result = await vehicleService.createEntry(data)
      if (result.success) {
        notify.success(`Entry recorded for ${data.vehicleNo}`)
        setIsEntryModalOpen(false)
        fetchData()
      }
    } catch (error) {
      notify.error('Entry failed')
    }
  }

  const handleExit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      id: selectedVehicle.id,
      exitWeight: parseFloat(formData.get('exitWeight')),
      exitTime: new Date().toISOString(),
      note: formData.get('note')
    }

    try {
      const result = await vehicleService.updateExit(data)
      if (result.success) {
        notify.success(`Exit recorded for ${selectedVehicle.vehicleNo}`)
        setIsExitModalOpen(false)
        fetchData()
      }
    } catch (error) {
      notify.error('Exit update failed')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Management</h1>
          <p className="page-subtitle">Track truck entries, exits and load weights at the gate.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsEntryModalOpen(true)}
        >
          <Plus size={18} /> New Entry
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e7e5e4' }}>
        <button 
          onClick={() => setActiveTab('all')}
          className={`btn-ghost`}
          style={{ 
            padding: '12px 4px', 
            borderBottom: activeTab === 'all' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'all' ? 'var(--color-primary-500)' : '#78716c',
            borderRadius: 0
          }}
        >
          Recent Activity
        </button>
        <button 
          onClick={() => setActiveTab('inside')}
          className={`btn-ghost`}
          style={{ 
            padding: '12px 4px', 
            borderBottom: activeTab === 'inside' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'inside' ? 'var(--color-primary-500)' : '#78716c',
            borderRadius: 0
          }}
        >
          Currently Inside ({insideVehicles.length})
        </button>
      </div>

      {/* Vehicle Grid / List */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle No</th>
              <th>Material</th>
              <th>Entry Time</th>
              <th>Entry Wt.</th>
              <th>Exit Wt.</th>
              <th>Net Load</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'all' ? vehicles : insideVehicles).map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{v.vehicleNo}</td>
                <td>{v.materialType}</td>
                <td>
                  <div style={{ fontSize: '0.875rem' }}>{formatTime(v.entryTime)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#78716c' }}>{formatDate(v.entryTime)}</div>
                </td>
                <td>{formatWeight(v.entryWeight)}</td>
                <td>{v.exitWeight ? formatWeight(v.exitWeight) : '--'}</td>
                <td style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>
                  {v.netWeight ? formatWeight(v.netWeight) : '--'}
                </td>
                <td>
                  {v.exitTime ? (
                    <span className="badge badge-neutral">Completed</span>
                  ) : (
                    <span className="badge badge-success animate-pulse">Inside</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {!v.exitTime && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedVehicle(v)
                        setIsExitModalOpen(true)
                      }}
                    >
                      <LogOut size={14} /> Record Exit
                    </button>
                  )}
                  {v.exitTime && (
                    <button className="btn btn-ghost btn-sm">
                      <FileText size={14} /> Challan
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(activeTab === 'all' ? vehicles : insideVehicles).length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                  No vehicles found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Entry Modal --- */}
      <Modal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} title="New Vehicle Entry">
        <form onSubmit={handleEntry}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Vehicle Number</label>
              <div style={{ position: 'relative' }}>
                <Navigation size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#a8a29e' }} />
                <input name="vehicleNo" className="form-input" placeholder="e.g. RJ14GA1234" style={{ paddingLeft: '40px' }} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Driver Name</label>
              <input name="driverName" className="form-input" placeholder="Optional" />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Movement Type</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div 
                onClick={() => setMovementType('out')}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: movementType === 'out' ? '2px solid var(--color-primary-500)' : '1px solid #e7e5e4', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  background: movementType === 'out' ? 'var(--color-primary-50)' : 'transparent',
                  color: movementType === 'out' ? 'var(--color-primary-700)' : '#78716c',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowRightLeft size={18} style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Outgoing Load</div>
              </div>
              <div 
                onClick={() => setMovementType('in')}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: movementType === 'in' ? '2px solid var(--color-primary-500)' : '1px solid #e7e5e4', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  background: movementType === 'in' ? 'var(--color-primary-50)' : 'transparent',
                  color: movementType === 'in' ? 'var(--color-primary-700)' : '#78716c',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Scale size={18} style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Incoming Raw</div>
              </div>
            </div>
          </div>


          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Material Description</label>
              <input name="materialType" className="form-input" placeholder="e.g. 20mm Gitti" required />
            </div>
            <div className="form-group">
              <label className="form-label">Entry Weight (Tons)</label>
              <div style={{ position: 'relative' }}>
                <Scale size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#a8a29e' }} />
                <input type="number" step="0.01" name="entryWeight" className="form-input" placeholder="0.00" style={{ paddingLeft: '40px' }} required />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Challan / Bill No.</label>
            <input name="challanNo" className="form-input" placeholder="Optional" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEntryModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Entry</button>
          </div>
        </form>
      </Modal>

      {/* --- Exit Modal --- */}
      <Modal isOpen={isExitModalOpen} onClose={() => setIsExitModalOpen(false)} title={`Record Exit: ${selectedVehicle?.vehicleNo}`}>
        <form onSubmit={handleExit}>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#78716c' }}>Material</div>
                <div style={{ fontWeight: 600 }}>{selectedVehicle?.materialType}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#78716c' }}>Entry Weight</div>
                <div style={{ fontWeight: 600 }}>{formatWeight(selectedVehicle?.entryWeight)}</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Exit Weight (Tons)</label>
            <div style={{ position: 'relative' }}>
              <Scale size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#a8a29e' }} />
              <input type="number" step="0.01" name="exitWeight" className="form-input" placeholder="0.00" style={{ paddingLeft: '40px' }} required autoFocus />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '8px' }}>
              The system will automatically calculate the net load weight.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Note / Remark</label>
            <textarea name="note" className="form-textarea" rows="2" placeholder="Any observation..."></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsExitModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Complete & Exit</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
