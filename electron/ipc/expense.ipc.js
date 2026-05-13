// electron/ipc/expense.ipc.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function registerExpenseHandlers(ipcMain) {

  ipcMain.handle('expense:get-all', async (event, filters = {}) => {
    try {
      const { category, fromDate, toDate, page = 1, limit = 50 } = filters
      const where = {}
      if (category) where.category = category
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          orderBy: { date: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.expense.count({ where })
      ])

      return { success: true, expenses, total }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('expense:create', async (event, data) => {
    try {
      const expense = await prisma.expense.create({ data })
      return { success: true, expense }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('expense:update', async (event, { id, ...data }) => {
    try {
      const expense = await prisma.expense.update({ where: { id }, data })
      return { success: true, expense }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('expense:delete', async (event, { id }) => {
    try {
      await prisma.expense.delete({ where: { id } })
      return { success: true }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Get expense summary by category for a date range
  ipcMain.handle('expense:get-summary', async (event, { fromDate, toDate }) => {
    try {
      const where = {}
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      // Group by category and sum amounts
      const summary = await prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      })

      return { success: true, summary }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
}

module.exports = { registerExpenseHandlers }
