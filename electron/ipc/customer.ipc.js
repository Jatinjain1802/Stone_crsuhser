// electron/ipc/customer.ipc.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function registerCustomerHandlers(ipcMain) {

  ipcMain.handle('customer:get-all', async (event, filters = {}) => {
    try {
      const { type, search } = filters
      const where = { isActive: true }
      if (type) where.type = type
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { mobile: { contains: search } },
        ]
      }

      const customers = await prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' }
      })
      return { success: true, customers }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('customer:get-by-id', async (event, { id }) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { items: { include: { material: true } } }
          }
        }
      })
      return { success: true, customer }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('customer:create', async (event, data) => {
    try {
      const customer = await prisma.customer.create({ data })
      return { success: true, customer }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('customer:update', async (event, { id, ...data }) => {
    try {
      const customer = await prisma.customer.update({ where: { id }, data })
      return { success: true, customer }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('customer:get-ledger', async (event, { customerId, fromDate, toDate }) => {
    try {
      const where = { customerId }
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: { items: { include: { material: true } }, payments: true },
        orderBy: { date: 'asc' }
      })

      const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0)
      const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0)
      const outstanding = totalBilled - totalPaid

      return { success: true, invoices, totalBilled, totalPaid, outstanding }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
}

module.exports = { registerCustomerHandlers }
