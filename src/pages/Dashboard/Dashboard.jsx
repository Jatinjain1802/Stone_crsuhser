// src/pages/Dashboard/Dashboard.jsx
// ---------------------------------------------------------------
// Dashboard Page Component
//
// LEARNING CONCEPTS:
// 1. Data Fetching — using useEffect to call API service on mount
// 2. Charts — implementing Recharts for data visualization
// 3. Conditional Rendering — showing loading states
// 4. Grid Layout — using CSS grid/flex for a responsive dashboard
// ---------------------------------------------------------------

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  Users, 
  Package, 
  ReceiptIndianRupee, 
  Truck, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  AlertCircle
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { dashboardService } from '@/services/api'
import { formatCurrency, formatNumber, getStatusBadge, getStatusLabel } from '@/utils/format.util'
import { formatDate, timeAgo } from '@/utils/date.util'
import useAppStore from '@/store/appStore'
import Modal from '@/components/shared/Modal'
import { Eye, Download, Printer } from 'lucide-react'
import { generateInvoicePDF } from '@/utils/pdf.util'


export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const navigate = useNavigate()

  const { notify } = useAppStore()


  // Fetch dashboard data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResult, trendResult] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getSalesTrend()
        ])

        if (statsResult.success) setStats(statsResult.stats)
        if (trendResult.success) setTrend(trendResult.trend)
      } catch (error) {
        notify.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [notify])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="page-header">
          <div className="skeleton" style={{ width: '200px', height: '32px' }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px' }}></div>)}
        </div>
        <div className="skeleton" style={{ height: '400px', borderRadius: '12px' }}></div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Summary</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm">
            <Clock size={16} /> Last 24 Hours
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px' 
      }}>
        {/* Today's Sales */}
        <div className="stat-card" onClick={() => navigate('/billing')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <TrendingUp size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-label">Today's Sales</div>
            <div className="stat-value">{formatCurrency(stats?.todaySales)}</div>
            <div className="stat-change" style={{ color: '#059669' }}>
              <ArrowUpRight size={14} /> {stats?.todayInvoiceCount} invoices today
            </div>
          </div>
        </div>


        {/* Month Sales */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <ReceiptIndianRupee size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-label">This Month</div>
            <div className="stat-value">{formatCurrency(stats?.monthSales)}</div>
            <div className="stat-change" style={{ color: '#2563eb' }}>
              Summary of all bills this month
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="stat-card" onClick={() => navigate('/payments')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Users size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-label">Outstanding</div>
            <div className="stat-value">{formatCurrency(stats?.pendingPayments)}</div>
            <div className="stat-change" style={{ color: '#d97706' }}>
              Payments yet to be collected
            </div>
          </div>
        </div>


        {/* Low Stock Alerts */}
        <div className="stat-card" onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ 
            background: stats?.lowStockCount > 0 ? '#fef2f2' : '#f5f5f4', 
            color: stats?.lowStockCount > 0 ? '#dc2626' : '#78716c' 
          }}>
            <Package size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-label">Low Stock</div>
            <div className="stat-value">{stats?.lowStockCount}</div>
            <div className="stat-change" style={{ color: stats?.lowStockCount > 0 ? '#dc2626' : '#78716c' }}>
              {stats?.lowStockCount > 0 ? (
                <><AlertCircle size={14} /> Critical stock levels</>
              ) : (
                'All stock levels healthy'
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">30-Day Sales Trend</h2>
            <div className="badge badge-info">Revenue Analytics</div>
          </div>
          <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => formatDate(val).split(' ')[0]} // Short date
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={(val) => `₹${val/1000}k`}
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Stock Summary</h2>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ padding: 4 }}
              onClick={() => navigate('/inventory')}
            >
              <ArrowUpRight size={18} />
            </button>

          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {stats?.materialSummary?.map(mat => {
              const isLow = mat.currentStock <= mat.minStock && mat.minStock > 0
              const percentage = Math.min(100, (mat.currentStock / (mat.minStock * 2 || 100)) * 100)
              
              return (
                <div key={mat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#44403c' }}>{mat.name}</span>
                    <span style={{ 
                      fontSize: '0.8125rem', 
                      fontWeight: 600, 
                      color: isLow ? '#dc2626' : '#1c1917' 
                    }}>
                      {formatNumber(mat.currentStock)} {mat.unit}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f5f5f4', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percentage}%`, 
                      background: isLow ? '#ef4444' : '#22c55e',
                      transition: 'width 1s ease-out'
                    }}></div>
                  </div>
                </div>
              )
            })}
            {(!stats?.materialSummary || stats.materialSummary.length === 0) && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#a8a29e', fontSize: '0.875rem' }}>
                No material data found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row — Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Invoices</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/billing')}>View All Invoices</button>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentInvoices?.map(inv => (
                <tr key={inv.id}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{inv.invoiceNo}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{inv.customer.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#78716c' }}>{inv.customer.mobile}</div>
                  </td>
                  <td>{formatDate(inv.date)}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(inv.status)}`}>
                      {getStatusLabel(inv.status)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSelectedInvoice(inv)
                        setIsViewModalOpen(true)
                      }}
                    >
                      <Eye size={16} style={{ marginRight: 4 }} /> Details
                    </button>
                  </td>


                </tr>
              ))}
              {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#a8a29e' }}>
                    No recent invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Invoice Details Modal --- */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedInvoice(null)
        }} 
        title={`Invoice Details: ${selectedInvoice?.invoiceNo}`}
        size="lg"
      >
        {selectedInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e7e5e4', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Details</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1c1917' }}>{selectedInvoice.customer.name}</div>
                <div style={{ fontSize: '0.875rem', color: '#44403c' }}>{selectedInvoice.customer.mobile}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#78716c', textTransform: 'uppercase' }}>Invoice Date</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatDate(selectedInvoice.date)}</div>
                <div style={{ marginTop: '8px' }}>
                  <span className={`badge ${getStatusBadge(selectedInvoice.status)}`}>
                    {getStatusLabel(selectedInvoice.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="data-table">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th>Material</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice?.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{item.material?.name}</td>
                      <td style={{ textAlign: 'right' }}>{item.quantity} {item.material?.unit}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(item.rate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#78716c' }}>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#78716c' }}>GST ({selectedInvoice.gstPercent}%):</span>
                  <span>{formatCurrency(selectedInvoice.gstAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary-600)', borderTop: '1px solid #e7e5e4', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Total:</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e7e5e4', paddingTop: '20px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={async () => {
                  setDownloadingId(selectedInvoice.id)
                  await generateInvoicePDF(selectedInvoice)
                  setDownloadingId(null)
                }}
                disabled={downloadingId === selectedInvoice.id}
              >
                {downloadingId === selectedInvoice.id ? 'Generating...' : <><Download size={18} /> Download PDF</>}
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={18} /> Print Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

