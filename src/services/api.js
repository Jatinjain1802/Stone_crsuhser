// src/services/api.js
// ---------------------------------------------------------------
// Central API service — wraps all window.api.invoke() calls.
//
// WHY A SERVICE LAYER?
// Instead of calling window.api.invoke('billing:create-invoice', data)
// everywhere in our React components, we wrap these calls in service
// functions. Benefits:
// 1. Single place to change IPC channel names
// 2. Can add error handling / logging in one place
// 3. Makes components cleaner and more readable
// 4. Easy to mock for testing
//
// In components, we just write:
//   import { authService } from '@/services/api'
//   const result = await authService.login(email, password)
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// Helper: Calls window.api.invoke safely
// In browser (dev without Electron), returns mock error
// ---------------------------------------------------------------
const invoke = (channel, data) => {
  if (!window.api) {
    // Running in browser without Electron — return a mock response
    console.warn(`[DEV] IPC not available. Channel: ${channel}`, data)
    return Promise.resolve({ success: false, message: 'IPC not available in browser' })
  }
  return window.api.invoke(channel, data)
}

// ---------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------
export const authService = {
  login:       (email, password)  => invoke('auth:login', { email, password }),
  setup:       ()                 => invoke('auth:setup'),
  getUsers:    ()                 => invoke('auth:get-users'),
  createUser:  (data)             => invoke('auth:create-user', data),
  updateUser:  (id, data)         => invoke('auth:update-user', { id, ...data }),
}

// ---------------------------------------------------------------
// Inventory Service
// ---------------------------------------------------------------
export const inventoryService = {
  getMaterials:    ()       => invoke('inventory:get-materials'),
  createMaterial:  (data)   => invoke('inventory:create-material', data),
  updateMaterial:  (id, d)  => invoke('inventory:update-material', { id, ...d }),
  deleteMaterial:  (id)     => invoke('inventory:delete-material', { id }),
  getStockEntries: (filters)=> invoke('inventory:get-stock-entries', filters),
  addStockEntry:   (data)   => invoke('inventory:add-stock-entry', data),
  addProduction:   (data)   => invoke('inventory:add-production', data),
  getProduction:   (filters)=> invoke('inventory:get-production', filters),
  getLowStock:     ()       => invoke('inventory:get-low-stock'),
}

// ---------------------------------------------------------------
// Customer Service
// ---------------------------------------------------------------
export const customerService = {
  getAll:    (filters) => invoke('customer:get-all', filters),
  getById:   (id)      => invoke('customer:get-by-id', { id }),
  create:    (data)    => invoke('customer:create', data),
  update:    (id, d)   => invoke('customer:update', { id, ...d }),
  getLedger: (params)  => invoke('customer:get-ledger', params),
}

// ---------------------------------------------------------------
// Billing Service
// ---------------------------------------------------------------
export const billingService = {
  getInvoices:    (filters) => invoke('billing:get-invoices', filters),
  getInvoice:     (id)      => invoke('billing:get-invoice', { id }),
  createInvoice:  (data)    => invoke('billing:create-invoice', data),
  addPayment:     (data)    => invoke('billing:add-payment', data),
  getOutstanding: ()        => invoke('billing:get-outstanding'),
}

// ---------------------------------------------------------------
// Vehicle Service
// ---------------------------------------------------------------
export const vehicleService = {
  getAll:       (filters) => invoke('vehicle:get-all', filters),
  createEntry:  (data)    => invoke('vehicle:create-entry', data),
  updateExit:   (data)    => invoke('vehicle:update-exit', data),
  getActive:    ()        => invoke('vehicle:get-active'),
}

// ---------------------------------------------------------------
// Expense Service
// ---------------------------------------------------------------
export const expenseService = {
  getAll:      (filters) => invoke('expense:get-all', filters),
  create:      (data)    => invoke('expense:create', data),
  update:      (id, d)   => invoke('expense:update', { id, ...d }),
  delete:      (id)      => invoke('expense:delete', { id }),
  getSummary:  (params)  => invoke('expense:get-summary', params),
}

// ---------------------------------------------------------------
// Dashboard Service
// ---------------------------------------------------------------
export const dashboardService = {
  getStats:      () => invoke('dashboard:get-stats'),
  getSalesTrend: () => invoke('dashboard:get-sales-trend'),
}

// ---------------------------------------------------------------
// Reports Service
// ---------------------------------------------------------------
export const reportsService = {
  sales:       (params) => invoke('reports:sales', params),
  expenses:    (params) => invoke('reports:expenses', params),
  inventory:   (params) => invoke('reports:inventory', params),
  profitLoss:  (params) => invoke('reports:profit-loss', params),
}
