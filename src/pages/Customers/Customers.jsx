// src/pages/Customers/Customers.jsx
// ---------------------------------------------------------------
// Customer Management & Ledger Page
//
// LEARNING CONCEPTS:
// 1. Ledger Logic — calculating running balance (Billed - Paid)
// 2. Data Nesting — showing customer invoices inside their profile
// 3. Searchable List — finding customers by name or mobile
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  ChevronRight, 
  Receipt, 
  Wallet,
  ArrowUpRight,
  Filter
} from 'lucide-react'
import { customerService } from '@/services/api'
import { formatCurrency, getStatusBadge } from '@/utils/format.util'
import { formatDate } from '@/utils/date.util'
import useAppStore from '@/store/appStore'
import Modal from '@/components/shared/Modal'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selected customer for details/ledger
  const [selectedId, setSelectedId] = useState(null)
  const [customerDetail, setCustomerDetail] = useState(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { notify } = useAppStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await customerService.getAll({ search: searchTerm })
      if (result.success) setCustomers(result.customers)
    } catch (error) {
      notify.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchTerm])

  const fetchDetail = async (id) => {
    try {
      const result = await customerService.getById(id)
      if (result.success) setCustomerDetail(result.customer)
    } catch (error) {
      notify.error('Failed to load customer details')
    }
  }

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
  }, [selectedId])

  const handleCreate = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      name: formData.get('name'),
      mobile: formData.get('mobile'),
      address: formData.get('address'),
      gstin: formData.get('gstin'),
      type: formData.get('type'),
      creditLimit: parseFloat(formData.get('creditLimit') || 0)
    }

    try {
      const result = await customerService.create(data)
      if (result.success) {
        notify.success('Customer added successfully')
        setIsModalOpen(false)
        fetchData()
      }
    } catch (error) {
      notify.error('Failed to add customer')
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', height: 'calc(100vh - 112px)' }}>
      {/* Left Side: Customer List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Customers</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#a8a29e' }} />
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            className="form-input"
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="card" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
          {customers.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedId(c.id)}
              style={{
                padding: '16px',
                borderBottom: '1px solid #f5f5f4',
                cursor: 'pointer',
                background: selectedId === c.id ? '#fff7ed' : 'transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#1c1917' }}>{c.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {c.mobile}
                </div>
              </div>
              <ChevronRight size={18} style={{ color: selectedId === c.id ? 'var(--color-primary-500)' : '#d6d3d1' }} />
            </div>
          ))}
          {customers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#a8a29e' }}>
              No customers found
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Customer Details & Ledger */}
      <div className="card" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {customerDetail ? (
          <>
            {/* Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1c1917' }}>{customerDetail.name}</h2>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#78716c' }}>
                    <Phone size={14} /> {customerDetail.mobile}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#78716c' }}>
                    <MapPin size={14} /> {customerDetail.address || 'No address'}
                  </div>
                </div>
              </div>
              <div className={`badge ${customerDetail.type === 'contractor' ? 'badge-info' : 'badge-neutral'}`}>
                {customerDetail.type.toUpperCase()}
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Total Outstanding</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b', marginTop: '4px' }}>
                  {formatCurrency(customerDetail.invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0))}
                </div>
              </div>
              <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Total Billed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
                  {formatCurrency(customerDetail.invoices.reduce((s, i) => s + i.totalAmount, 0))}
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} /> Recent Ledger Entries
            </h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice No</th>
                  <th>Billed</th>
                  <th>Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {customerDetail.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>{formatDate(inv.date)}</td>
                    <td className="font-mono">{inv.invoiceNo}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(inv.paidAmount)}</td>
                    <td style={{ fontWeight: 700, color: '#dc2626' }}>
                      {formatCurrency(inv.totalAmount - inv.paidAmount)}
                    </td>
                  </tr>
                ))}
                {customerDetail.invoices.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                      No transaction history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a8a29e' }}>
            <Users size={64} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Select a customer from the list to view details and ledger.</p>
          </div>
        )}
      </div>

      {/* --- Add Customer Modal --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Customer">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Full Name / Company Name</label>
            <input name="name" className="form-input" placeholder="e.g. ABC Construction" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input name="mobile" className="form-input" placeholder="10-digit number" required maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Type</label>
              <select name="type" className="form-select">
                <option value="regular">Regular Buyer</option>
                <option value="contractor">Contractor</option>
                <option value="onetime">One-time / Walk-in</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">GSTIN (Optional)</label>
            <input name="gstin" className="form-input" placeholder="GST Number" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea name="address" className="form-textarea" rows="2" placeholder="Full billing address..."></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Credit Limit (₹)</label>
            <input type="number" name="creditLimit" className="form-input" defaultValue={0} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Customer</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
