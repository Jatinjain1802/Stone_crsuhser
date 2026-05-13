// src/pages/Expenses/Expenses.jsx
// ---------------------------------------------------------------
// Expense Management Page
//
// LEARNING CONCEPTS:
// 1. Data Categorization — grouping costs for better analysis
// 2. Date Filtering — looking at expenses for a specific period
// 3. Summarization — using the groupBy summary from the IPC handler
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { 
  ReceiptIndianRupee, 
  Plus, 
  Search, 
  Calendar, 
  Tag, 
  Trash2,
  PieChart as PieIcon,
  Filter
} from 'lucide-react'
import { expenseService } from '@/services/api'
import { formatCurrency, getStatusLabel } from '@/utils/format.util'
import { formatDate, toInputDate } from '@/utils/date.util'
import useAppStore from '@/store/appStore'
import useAuthStore from '@/store/authStore'
import Modal from '@/components/shared/Modal'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'

const CATEGORY_COLORS = {
  diesel: '#f97316',      // Orange
  labour: '#0ea5e9',      // Blue
  maintenance: '#8b5cf6', // Purple
  electricity: '#eab308', // Yellow
  other: '#64748b'        // Slate
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [category, setCategory] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { notify } = useAppStore()
  const { user } = useAuthStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [listResult, summaryResult] = await Promise.all([
        expenseService.getAll({ fromDate, toDate, category }),
        expenseService.getSummary({ fromDate, toDate })
      ])
      
      if (listResult.success) setExpenses(listResult.expenses)
      if (summaryResult.success) setSummary(summaryResult.summary)
    } catch (error) {
      notify.error('Failed to load expense data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fromDate, toDate, category])

  const handleCreate = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      date: new Date(formData.get('date')),
      description: formData.get('description'),
      vendor: formData.get('vendor'),
      addedBy: user.id
    }

    try {
      const result = await expenseService.create(data)
      if (result.success) {
        notify.success('Expense recorded')
        setIsModalOpen(false)
        fetchData()
      }
    } catch (error) {
      notify.error('Failed to record expense')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return
    try {
      const result = await expenseService.delete(id)
      if (result.success) {
        notify.success('Expense deleted')
        fetchData()
      }
    } catch (error) {
      notify.error('Delete failed')
    }
  }

  // Format data for PieChart
  const chartData = summary.map(item => ({
    name: getStatusLabel(item.category),
    value: item._sum.amount,
    color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
  }))

  const totalExpense = summary.reduce((sum, item) => sum + item._sum.amount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expense Management</h1>
          <p className="page-subtitle">Track operation costs, maintenance, and utility bills.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Record Expense
        </button>
      </div>

      {/* Top Row: Summary Chart & Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', minHeight: '280px' }}>
          <div style={{ flex: 1, height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, padding: '0 24px' }}>
            <div style={{ fontSize: '0.875rem', color: '#78716c' }}>Total Period Expense</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary-600)' }}>
              {formatCurrency(totalExpense)}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {summary.map(item => (
                <div key={item.category} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: CATEGORY_COLORS[item.category] }}></div>
                    <span>{getStatusLabel(item.category)}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(item._sum.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><Filter size={18} style={{ marginRight: 8 }} /> Filter Results</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="diesel">Diesel</option>
                <option value="labour">Labour / Wages</option>
                <option value="maintenance">Maintenance</option>
                <option value="electricity">Electricity</option>
                <option value="other">Other Expenses</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { setFromDate(''); setToDate(''); setCategory('') }}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Vendor / Paid To</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(ex => (
              <tr key={ex.id}>
                <td>{formatDate(ex.date)}</td>
                <td>
                  <span className="badge" style={{ 
                    background: `${CATEGORY_COLORS[ex.category]}15`, 
                    color: CATEGORY_COLORS[ex.category] 
                  }}>
                    {getStatusLabel(ex.category)}
                  </span>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{ex.description || '-'}</td>
                <td>{ex.vendor || '-'}</td>
                <td style={{ fontWeight: 700 }}>{formatCurrency(ex.amount)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(ex.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                  No expense records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Record Expense Modal --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Expense">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" name="date" className="form-input" defaultValue={toInputDate(new Date())} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" required>
                <option value="diesel">Diesel</option>
                <option value="labour">Labour / Wages</option>
                <option value="maintenance">Maintenance</option>
                <option value="electricity">Electricity</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input type="number" step="0.01" name="amount" className="form-input" placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Vendor / Paid To</label>
              <input name="vendor" className="form-input" placeholder="e.g. Reliance Petrol" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Note</label>
            <textarea name="description" className="form-textarea" rows="2" placeholder="What was this expense for?"></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Expense</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
