// electron/ipc/dashboard.ipc.js
// ---------------------------------------------------------------
// Dashboard handlers — aggregate queries for summary stats
// These use Promise.all() to run multiple queries in PARALLEL
// for better performance (instead of one at a time)
// ---------------------------------------------------------------

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function registerDashboardHandlers(ipcMain) {
  
  ipcMain.handle('dashboard:get-stats', async () => {
    try {
      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0))
      const todayEnd = new Date(today.setHours(23, 59, 59, 999))

      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      // Run all queries in parallel using Promise.all
      // This is much faster than running them sequentially one by one
      const [
        todaySales,
        monthSales,
        pendingPayments,
        lowStockCount,
        todayExpense,
        todayVehicles,
        recentInvoices,
        materialSummary,
      ] = await Promise.all([
        // Today's total sales
        prisma.invoice.aggregate({
          where: { date: { gte: todayStart, lte: todayEnd } },
          _sum: { totalAmount: true },
          _count: { id: true }
        }),
        
        // This month's total sales
        prisma.invoice.aggregate({
          where: { date: { gte: thisMonthStart } },
          _sum: { totalAmount: true }
        }),
        
        // Outstanding payments total
        prisma.invoice.aggregate({
          where: { status: { in: ['unpaid', 'partial'] } },
          _sum: { totalAmount: true }
        }),
        
        // Low stock count
        prisma.$queryRaw`SELECT COUNT(*) as count FROM Material WHERE isActive = 1 AND currentStock <= minStock AND minStock > 0`,
        
        // Today's total expenses
        prisma.expense.aggregate({
          where: { date: { gte: todayStart, lte: todayEnd } },
          _sum: { amount: true }
        }),
        
        // Today's vehicle count
        prisma.vehicle.count({
          where: { entryTime: { gte: todayStart, lte: todayEnd } }
        }),
        
        // Last 5 invoices
        prisma.invoice.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { customer: true }
        }),
        
        // Stock summary by material
        prisma.material.findMany({
          where: { isActive: true },
          select: { id: true, name: true, currentStock: true, minStock: true, unit: true }
        }),
      ])

      return {
        success: true,
        stats: {
          todaySales: todaySales._sum.totalAmount || 0,
          todayInvoiceCount: todaySales._count.id || 0,
          monthSales: monthSales._sum.totalAmount || 0,
          pendingPayments: pendingPayments._sum.totalAmount || 0,
          lowStockCount: Number(lowStockCount[0]?.count || 0),
          todayExpense: todayExpense._sum.amount || 0,
          todayVehicles,
          recentInvoices,
          materialSummary,
        }
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Get sales trend for last 30 days (for line chart)
  ipcMain.handle('dashboard:get-sales-trend', async () => {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const invoices = await prisma.invoice.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        select: { date: true, totalAmount: true }
      })

      // Group by date string
      const byDate = {}
      invoices.forEach(inv => {
        const dateStr = inv.date.toISOString().split('T')[0]
        byDate[dateStr] = (byDate[dateStr] || 0) + inv.totalAmount
      })

      // Convert to array sorted by date
      const trend = Object.entries(byDate)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return { success: true, trend }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
}

module.exports = { registerDashboardHandlers }
