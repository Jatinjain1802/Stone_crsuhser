// src/pages/Reports/Reports.jsx
// ---------------------------------------------------------------
// Reports & Analytics Page
//
// LEARNING CONCEPTS:
// 1. Multi-report Logic — handling different data structures in one page
// 2. Exporting Data — preparing data for PDF/Excel (placeholders)
// 3. Summarization — showing grand totals for financial reports
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  FileDown, 
  Search, 
  Filter, 
  Download,
  Calendar,
  IndianRupee,
  Package,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react'
import { reportsService } from '@/services/api'
import { formatCurrency, getStatusBadge } from '@/utils/format.util'
import { formatDate } from '@/utils/date.util'
import useAppStore from '@/store/appStore'

export default function Reports() {
  const [reportType, setReportType] = useState('sales') // 'sales', 'expenses', 'inventory', 'pl'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  
  const { notify } = useAppStore()

  const fetchReport = async () => {
    setLoading(true)
    try {
      let result
      const params = { fromDate, toDate }
      
      switch(reportType) {
        case 'sales': result = await reportsService.sales(params); break;
        case 'expenses': result = await reportsService.expenses(params); break;
        case 'inventory': result = await reportsService.inventory(params); break;
        case 'pl': result = await reportsService.profitLoss(params); break;
        default: break;
      }
      
      if (result.success) setData(result)
    } catch (error) {
      notify.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [reportType, fromDate, toDate])

  const handleExport = (format) => {
    notify.info(`Exporting ${reportType} report to ${format}...`)
    // Implementation for PDF/Excel export would go here
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Analyze business performance with detailed data exports.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('excel')}>
            <FileSpreadsheet size={18} /> Excel
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('pdf')}>
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Report Type</label>
          <select 
            className="form-select" 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="sales">Sales Report</option>
            <option value="expenses">Expense Report</option>
            <option value="inventory">Inventory Summary</option>
            <option value="pl">Profit & Loss Statement</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">From Date</label>
          <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">To Date</label>
          <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={fetchReport}>
            <Filter size={16} /> Apply Filters
          </button>
        </div>
      </div>

      {/* Report Summary Cards */}
      {reportType === 'pl' && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div className="stat-card">
            <div style={{ flex: 1 }}>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{formatCurrency(data.revenue)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div style={{ flex: 1 }}>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>{formatCurrency(data.totalExpenses)}</div>
            </div>
          </div>
          <div className="stat-card" style={{ background: data.profit >= 0 ? '#ecfdf5' : '#fef2f2' }}>
            <div style={{ flex: 1 }}>
              <div className="stat-label">Net Profit / Loss</div>
              <div className="stat-value" style={{ color: data.profit >= 0 ? '#059669' : '#dc2626' }}>
                {formatCurrency(data.profit)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div className="animate-pulse" style={{ color: 'var(--color-primary-500)' }}>Generating Report...</div>
          </div>
        ) : (
          <table className="data-table">
            {reportType === 'sales' && (
              <>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.invoices?.map(inv => (
                    <tr key={inv.id}>
                      <td>{formatDate(inv.date)}</td>
                      <td className="font-mono">{inv.invoiceNo}</td>
                      <td>{inv.customer.name}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                      <td style={{ color: '#059669' }}>{formatCurrency(inv.paidAmount)}</td>
                      <td><span className={`badge ${getStatusBadge(inv.status)}`}>{inv.status.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {reportType === 'expenses' && (
              <>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.expenses?.map(ex => (
                    <tr key={ex.id}>
                      <td>{formatDate(ex.date)}</td>
                      <td><span className="badge badge-neutral">{ex.category.toUpperCase()}</span></td>
                      <td>{ex.description || '-'}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(ex.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
            {reportType === 'inventory' && (
              <>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Stock</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.materials?.map(mat => (
                    <tr key={mat.id}>
                      <td style={{ fontWeight: 600 }}>{mat.name}</td>
                      <td>{mat.category}</td>
                      <td style={{ fontWeight: 700 }}>{mat.currentStock}</td>
                      <td>{mat.minStock}</td>
                      <td>{mat.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        )}
      </div>
    </div>
  )
}
