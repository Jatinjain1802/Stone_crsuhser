// src/pages/Billing/Billing.jsx
// ---------------------------------------------------------------
// Billing & Invoice Management Page
//
// LEARNING CONCEPTS:
// 1. Complex State — managing a list of items in an invoice
// 2. Calculations — calculating GST and totals in real-time
// 3. Foreign Keys — linking invoices to customers and materials
// 4. PDF Generation — using jsPDF to create printable documents
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  FileText, 
  Printer, 
  Download, 
  Trash2, 
  UserPlus,
  ArrowRight,
  Eye,
  AlertTriangle,
  Loader2
} from 'lucide-react'

import { billingService, customerService, inventoryService } from '@/services/api'
import { formatCurrency, formatNumber, getStatusBadge, getStatusLabel } from '@/utils/format.util'
import { formatDate } from '@/utils/date.util'
import useAppStore from '@/store/appStore'
import useAuthStore from '@/store/authStore'
import Modal from '@/components/shared/Modal'
import { generateInvoicePDF } from '@/utils/pdf.util'


export default function Billing() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  
  // New Invoice states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const location = useLocation()

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [customers, setCustomers] = useState([])
  const [materials, setMaterials] = useState([])
  
  // Invoice form state
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [invoiceItems, setInvoiceItems] = useState([{ materialId: '', quantity: 1, rate: 0, amount: 0 }])
  const [gstPercent, setGstPercent] = useState(18)
  const [status, setStatus] = useState('unpaid')
  const [paymentMode, setPaymentMode] = useState('credit')
  
  // View & UI states
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)


  
  const { notify } = useAppStore()
  const { user } = useAuthStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invResult, custResult, matResult] = await Promise.all([
        billingService.getInvoices(),
        customerService.getAll(),
        inventoryService.getMaterials()
      ])
      
      if (invResult.success) setInvoices(invResult.invoices)
      if (custResult.success) setCustomers(custResult.customers)
      if (matResult.success) setMaterials(matResult.materials)
    } catch (error) {
      notify.error('Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Check if we arrived here with an invoice to view (from Dashboard)
    if (location.state?.viewInvoice) {
      setSelectedInvoice(location.state.viewInvoice)
      setIsViewModalOpen(true)
      // Clear the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])


  // --- Calculations ---

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0)
  const gstAmount = (subtotal * gstPercent) / 100
  const totalAmount = subtotal + gstAmount

  // Update an item in the list
  const updateItem = (index, field, value) => {
    const newItems = [...invoiceItems]
    const item = { ...newItems[index] }
    
    item[field] = value
    
    // If material changed, set default rate
    if (field === 'materialId') {
      const material = materials.find(m => m.id === parseInt(value))
      if (material) item.rate = material.ratePerUnit
    }
    
    // Recalculate amount
    item.amount = item.quantity * item.rate
    newItems[index] = item
    setInvoiceItems(newItems)
  }

  const addItem = () => setInvoiceItems([...invoiceItems, { materialId: '', quantity: 1, rate: 0, amount: 0 }])
  const removeItem = (index) => setInvoiceItems(invoiceItems.filter((_, i) => i !== index))

  const handleDownloadPDF = async (inv) => {
    setDownloadingId(inv.id)
    try {
      await generateInvoicePDF(inv)
      notify.success('Invoice downloaded')
    } catch (error) {
      notify.error('PDF generation failed')
    } finally {
      setDownloadingId(null)
    }
  }

  // Check credit limit for selected customer
  const getCustomerOutstanding = (custId) => {
    return invoices
      .filter(inv => inv.customerId === parseInt(custId) && inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0)
  }

  const selectedCustObj = customers.find(c => c.id === parseInt(selectedCustomer))
  const currentOutstanding = selectedCustomer ? getCustomerOutstanding(selectedCustomer) : 0
  const isOverLimit = selectedCustObj && (currentOutstanding + totalAmount > selectedCustObj.creditLimit)


  // --- Actions ---

  const handleCreateInvoice = async (e) => {
    e.preventDefault()
    
    if (!selectedCustomer) return notify.error('Please select a customer')
    if (invoiceItems.some(item => !item.materialId || item.quantity <= 0)) {
      return notify.error('Please check all invoice items')
    }

    const data = {
      customerId: parseInt(selectedCustomer),
      items: invoiceItems.map(item => ({
        materialId: parseInt(item.materialId),
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount)
      })),
      gstPercent: parseFloat(gstPercent),
      status,
      paymentMode: status === 'paid' ? paymentMode : 'credit',
      createdBy: user.id
    }


    try {
      const result = await billingService.createInvoice(data)
      if (result.success) {
        notify.success('Invoice generated successfully')
        setIsInvoiceModalOpen(false)
        resetForm()
        fetchData()
      } else {
        notify.error(result.message)
      }
    } catch (error) {
      notify.error('Invoice creation failed')
    }
  }

  const resetForm = () => {
    setSelectedCustomer('')
    setInvoiceItems([{ materialId: '', quantity: 1, rate: 0, amount: 0 }])
    setGstPercent(18)
    setStatus('unpaid')
    setPaymentMode('credit')
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Invoices</h1>
          <p className="page-subtitle">Generate GST invoices and track customer payments.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsInvoiceModalOpen(true)}
        >
          <Plus size={18} /> New Invoice
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px' 
      }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div>
            <div className="stat-label">Total Outstanding</div>
            <div className="stat-value" style={{ fontSize: '1.25rem', color: '#ef4444' }}>
              {formatCurrency(invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0))}
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div>
            <div className="stat-label">Total Billed (Month)</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>
              {formatCurrency(invoices.reduce((s, i) => s + i.totalAmount, 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className="font-mono" style={{ fontWeight: 600 }}>{inv.invoiceNo}</td>
                <td>{inv.customer.name}</td>
                <td>{formatDate(inv.date)}</td>
                <td>{inv.items.length} items</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                <td>
                  <span className={`badge ${getStatusBadge(inv.status)}`}>
                    {getStatusLabel(inv.status)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      title="View Details"
                      onClick={() => setViewingInvoice(inv)}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      title="Download PDF"
                      disabled={downloadingId === inv.id}
                      onClick={() => handleDownloadPDF(inv)}
                    >
                      {downloadingId === inv.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Print"><Printer size={16} /></button>
                  </div>
                </td>


              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                  {loading ? 'Loading invoices...' : 'No invoices found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- New Invoice Modal --- */}
      <Modal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Generate New Invoice"
        size="lg"
      >
        <form onSubmit={handleCreateInvoice}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Customer</label>
              <select 
                className="form-select" 
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                required
              >
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>)}
              </select>

              {selectedCustObj && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#78716c' }}>Current Outstanding: <b>{formatCurrency(currentOutstanding)}</b></span>
                  <span style={{ color: isOverLimit ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    Limit: {formatCurrency(selectedCustObj.creditLimit)}
                  </span>
                </div>
              )}
              {isOverLimit && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  background: '#fef2f2', 
                  border: '1px solid #fee2e2',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={14} />
                  <span>Warning: This invoice will exceed customer's credit limit!</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">GST Percentage (%)</label>
              <select 
                className="form-select" 
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
              >
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select 
                className="form-select" 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="unpaid">Unpaid (Credit)</option>
                <option value="paid">Full Paid</option>
              </select>
            </div>
            {status === 'paid' && (
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select 
                  className="form-select" 
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            )}
          </div>

          <div className="divider"></div>
          
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>Invoice Items</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invoiceItems.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '12px', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Material</label>
                  <select 
                    className="form-select" 
                    value={item.materialId}
                    onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                    required
                  >
                    <option value="">Select Material...</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Rate (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Amount</label>
                  <div className="form-input" style={{ background: '#f5f5f4', border: 'none', fontWeight: 600 }}>
                    {formatNumber(item.amount)}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => removeItem(index)}
                  disabled={invoiceItems.length === 1}
                  style={{ color: '#ef4444', padding: '8px' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={addItem}
            style={{ marginTop: '16px' }}
          >
            <Plus size={16} /> Add Another Item
          </button>

          <div className="divider"></div>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#78716c' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#78716c' }}>GST ({gstPercent}%):</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(gstAmount)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '1rem', 
                paddingTop: '8px',
                borderTop: '1px solid #e7e5e4',
                color: 'var(--color-primary-600)'
              }}>
                <span style={{ fontWeight: 700 }}>Total Amount:</span>
                <span style={{ fontWeight: 800 }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              Generate Invoice <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </button>
          </div>
        </form>
      </Modal>

      {/* --- View Invoice Details Modal --- */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title={`Invoice Details: ${viewingInvoice?.invoiceNo}`}
        size="md"
      >
        {viewingInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="stat-label">Customer</label>
                <div style={{ fontWeight: 600 }}>{viewingInvoice.customer.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#78716c' }}>{viewingInvoice.customer.mobile}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label className="stat-label">Date</label>
                <div style={{ fontWeight: 600 }}>{formatDate(viewingInvoice.date)}</div>
                <span className={`badge ${getStatusBadge(viewingInvoice.status)}`}>
                  {getStatusLabel(viewingInvoice.status)}
                </span>
              </div>
            </div>

            <div className="divider" style={{ margin: '8px 0' }}></div>

            <table className="data-table" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th>Material</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {viewingInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.material.name}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(item.rate)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ alignSelf: 'flex-end', width: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#78716c' }}>Subtotal:</span>
                <span>{formatCurrency(viewingInvoice.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#78716c' }}>GST:</span>
                <span>{formatCurrency(viewingInvoice.gstAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                <span>Total:</span>
                <span>{formatCurrency(viewingInvoice.totalAmount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setViewingInvoice(null)}>Close</button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleDownloadPDF(viewingInvoice)}
                disabled={downloadingId === viewingInvoice.id}
              >
                {downloadingId === viewingInvoice.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                <span style={{ marginLeft: 8 }}>Download PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>

  )
}
