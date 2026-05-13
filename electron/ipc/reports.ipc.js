// electron/ipc/reports.ipc.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function registerReportsHandlers(ipcMain) {

  // Sales Report
  ipcMain.handle('reports:sales', async (event, { fromDate, toDate, customerId }) => {
    try {
      const where = {}
      if (customerId) where.customerId = customerId
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: { customer: true, items: { include: { material: true } } },
        orderBy: { date: 'desc' }
      })

      const summary = {
        total: invoices.reduce((s, i) => s + i.totalAmount, 0),
        paid: invoices.reduce((s, i) => s + i.paidAmount, 0),
        outstanding: invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0),
        count: invoices.length
      }

      return { success: true, invoices, summary }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Expense Report
  ipcMain.handle('reports:expenses', async (event, { fromDate, toDate }) => {
    try {
      const where = {}
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      const [expenses, summary] = await Promise.all([
        prisma.expense.findMany({ where, orderBy: { date: 'desc' } }),
        prisma.expense.groupBy({
          by: ['category'],
          where,
          _sum: { amount: true },
        })
      ])

      const total = expenses.reduce((s, e) => s + e.amount, 0)
      return { success: true, expenses, summary, total }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Inventory / Stock Report
  ipcMain.handle('reports:inventory', async (event, { fromDate, toDate }) => {
    try {
      const materials = await prisma.material.findMany({
        where: { isActive: true },
        include: {
          stockEntries: {
            where: fromDate || toDate ? {
              date: {
                ...(fromDate && { gte: new Date(fromDate) }),
                ...(toDate && { lte: new Date(toDate) }),
              }
            } : {}
          }
        }
      })

      return { success: true, materials }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // P&L Report
  ipcMain.handle('reports:profit-loss', async (event, { fromDate, toDate }) => {
    try {
      const dateFilter = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate)

      const [salesData, expenseData] = await Promise.all([
        prisma.invoice.aggregate({
          where: { date: dateFilter },
          _sum: { totalAmount: true, paidAmount: true }
        }),
        prisma.expense.aggregate({
          where: { date: dateFilter },
          _sum: { amount: true }
        })
      ])

      const revenue = salesData._sum.totalAmount || 0
      const totalExpenses = expenseData._sum.amount || 0
      const profit = revenue - totalExpenses

      return { success: true, revenue, totalExpenses, profit }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
}

module.exports = { registerReportsHandlers }
