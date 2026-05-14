// src/pages/Payments/Payments.jsx
// ---------------------------------------------------------------
// Payment Collection Module
// Handles collecting payments from customers (Direct or Bill-wise)
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { 
  IndianRupee, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  ArrowRight,
  Download,
  CheckCircle2,
  ListFilter,
  DollarSign,
  Loader2
} from 'lucide-react'

import { billingService, customerService } from '@/services/api'
import { formatCurrency, formatNumber, getStatusBadge, getStatusLabel } from '@/utils/format.util'
import { formatDate } from '@/utils/date.util'
import useAppStore from '@/store/appStore'
import useAuthStore from '@/store/authStore'
import Modal from '@/components/shared/Modal'
import { generatePaymentReceiptPDF } from '@/utils/pdf.util'


export default function Payments() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stats, setStats] = useState({ totalOutstanding: 0, collectionsToday: 0, activeCustomers: 0, paymentCount: 0 })
  const [recentPayments, setRecentPayments] = useState([])


  
  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [unpaidInvoices, setUnpaidInvoices] = useState([])
  const [paymentMode, setPaymentMode] = useState('cash') // cash, upi, bank, cheque
  const [paymentType, setPaymentType] = useState('direct') // direct, bill-wise
  const [amount, setAmount] = useState(0)
  const [remarks, setRemarks] = useState('')
  const [selectedInvoices, setSelectedInvoices] = useState([]) // For bill-wise
  const [submitting, setSubmitting] = useState(false)


  const { notify } = useAppStore()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchCustomers()
    fetchStats()
    fetchRecentPayments()
  }, [])

  const fetchRecentPayments = async () => {
    try {
      const result = await billingService.getPayments()
      if (result.success) setRecentPayments(result.payments)
    } catch (error) {}
  }


  const fetchStats = async () => {
    try {
      const result = await billingService.getPaymentStats()
      if (result.success) setStats(result)
    } catch (error) {}
  }


  const fetchCustomers = async () => {
    try {
      const result = await customerService.getAll()
      if (result.success) setCustomers(result.customers)
    } catch (error) {
      notify.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  // Fetch unpaid invoices when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      fetchUnpaidInvoices(selectedCustomer)
    } else {
      setUnpaidInvoices([])
    }
  }, [selectedCustomer])

  const fetchUnpaidInvoices = async (custId) => {
    try {
      const result = await billingService.getCustomerUnpaid(custId)
      if (result.success) setUnpaidInvoices(result.invoices)
    } catch (error) {
      notify.error('Error fetching invoices')
    }
  }

  const handleCollectPayment = async (e) => {
    e.preventDefault()
    if (!selectedCustomer || amount <= 0) return notify.error('Invalid payment data')
    
    setSubmitting(true)
    try {
      if (paymentType === 'direct') {
        if (unpaidInvoices.length === 0) {
          notify.error('No unpaid invoices found for this customer')
          setSubmitting(false)
          return
        }

        // --- SMART LUMP SUM LOGIC ---
        // Apply amount across all unpaid invoices sequentially (FIFO)
        let remainingAmount = parseFloat(amount)
        for (const inv of unpaidInvoices) {
          if (remainingAmount <= 0) break
          
          const balance = inv.totalAmount - inv.paidAmount
          const payNow = Math.min(remainingAmount, balance)

          await billingService.addPayment({
            invoiceId: inv.id,
            amount: payNow,
            paymentMode,
            reference: remarks,
            date: new Date().toISOString()
          })
          remainingAmount -= payNow
        }
        
        notify.success('Lump-sum payment recorded across bills')
        generateReceiptAndClose()
      } else {

        // 2. Bill-wise Payment Logic
        if (selectedInvoices.length === 0) {
          notify.error('Please select at least one bill')
          setSubmitting(false)
          return
        }

        // We apply the total amount across selected invoices
        let remainingAmount = parseFloat(amount)
        for (const invId of selectedInvoices) {
          if (remainingAmount <= 0) break
          
          const inv = unpaidInvoices.find(i => i.id === invId)
          const balance = inv.totalAmount - inv.paidAmount
          const payNow = Math.min(remainingAmount, balance)

          await billingService.addPayment({
            invoiceId: invId,
            amount: payNow,
            paymentMode,
            reference: remarks,
            date: new Date().toISOString()
          })
          remainingAmount -= payNow
        }

        notify.success('Bill-wise payment recorded')
        generateReceiptAndClose()
      }
    } catch (error) {
      notify.error('Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  const generateReceiptAndClose = () => {
    const selectedCust = customers.find(c => c.id === parseInt(selectedCustomer))
    generatePaymentReceiptPDF({
      amount: parseFloat(amount),
      customerName: selectedCust?.name || 'Customer',
      paymentMode,
      reference: remarks
    })
    setIsModalOpen(false)
    resetForm()
    fetchUnpaidInvoices(selectedCustomer) // Refresh current
    fetchStats() // Refresh totals
    fetchRecentPayments() // Refresh history
  }


  const toggleInvoiceSelection = (id) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }


  const resetForm = () => {
    setSelectedCustomer('')
    setAmount(0)
    setRemarks('')
    setPaymentType('direct')
  }

  const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Collection</h1>
          <p className="page-subtitle">Record and manage payments received from customers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Record Payment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div className="stat-label">Total Market Outstanding</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{formatCurrency(stats.totalOutstanding)}</div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '8px' }}>Across {stats.activeCustomers} active customers</div>
        </div>
        <div className="card">
          <div className="stat-label">Collections Today</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{formatCurrency(stats.collectionsToday)}</div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '8px' }}>From {stats.paymentCount} payments</div>
        </div>
      </div>


      {/* Recent Payments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '20px' }}>
          <h2 className="card-title">Recent Payment Collections</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Invoice No</th>
              <th>Mode</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentPayments.map(p => (
              <tr key={p.id}>
                <td>{formatDate(p.createdAt)}</td>
                <td style={{ fontWeight: 600 }}>{p.invoice?.customer?.name || 'Unknown'}</td>
                <td className="font-mono">{p.invoice?.invoiceNo}</td>
                <td><span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{p.paymentMode}</span></td>
                <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(p.amount)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => generatePaymentReceiptPDF({
                      amount: p.amount,
                      customerName: p.invoice?.customer?.name,
                      paymentMode: p.paymentMode,
                      reference: p.reference
                    })}
                  >
                    <Download size={16} style={{ marginRight: 4 }} /> Receipt
                  </button>
                </td>
              </tr>
            ))}
            {recentPayments.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                  No payment records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* --- Record Payment Modal --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Record Customer Payment"
        size="lg"
      >
        <form onSubmit={handleCollectPayment}>
          <div className="form-group">
            <label className="form-label">Select Customer</label>
            <select 
              className="form-select" 
              value={selectedCustomer} 
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
            >
              <option value="">Choose Customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedCustomer && (
            <div style={{ 
              background: '#fef2f2', 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #fee2e2'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Total Outstanding</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>{formatCurrency(totalOutstanding)}</div>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 600 }}>
                {unpaidInvoices.length} Unpaid Bills
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Payment Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  className={`btn ${paymentType === 'direct' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => setPaymentType('direct')}
                >Direct Payment</button>
                <button 
                  type="button"
                  className={`btn ${paymentType === 'bill-wise' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => setPaymentType('bill-wise')}
                >By Order/Bill</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Amount Received (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                required 
              />
            </div>
          </div>

          {paymentType === 'bill-wise' && unpaidInvoices.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Select Bills to Pay</label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e7e5e4', borderRadius: '8px' }}>
                <table className="data-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Date</th>
                      <th>Balance</th>
                      <th>Paying</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidInvoices.map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.invoiceNo}</td>
                        <td>{formatDate(inv.date)}</td>
                        <td>{formatCurrency(inv.totalAmount - inv.paidAmount)}</td>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedInvoices.includes(inv.id)}
                            onChange={() => toggleInvoiceSelection(inv.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI / Online</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks / Ref No.</label>
              <input className="form-input" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. UPI Ref or Cheque No." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
              <span style={{ marginLeft: 8 }}>{submitting ? 'Processing...' : 'Confirm Payment'}</span>
            </button>
          </div>

        </form>
      </Modal>
    </div>
  )
}
