// electron/ipc/billing.ipc.js
// ---------------------------------------------------------------
// IPC Handlers for Billing / Invoice management module.
//
// KEY CONCEPT — Invoice Number Generation:
// We auto-generate invoice numbers in format: SCM/2025-26/0001
// - "SCM" = Stone Crusher Management
// - "2025-26" = Financial year (April to March in India)
// - "0001" = Zero-padded sequential number, resets each April
//
// Financial Year in India:
//   April 1, 2025 → March 31, 2026 = FY "2025-26"
// ---------------------------------------------------------------

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ---------------------------------------------------------------
// Helper: Generate invoice number in SCM/YYYY-YY/NNNN format
// ---------------------------------------------------------------
async function generateInvoiceNo() {
  const now = new Date()
  const year = now.getMonth() >= 3 // April = month 3 (0-indexed)
    ? now.getFullYear()
    : now.getFullYear() - 1
  
  const fyString = `${year}-${String(year + 1).slice(2)}` // "2025-26"
  
  // Find the last invoice in the current financial year
  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: `SCM/${fyString}/` } },
    orderBy: { createdAt: 'desc' }
  })

  let nextNumber = 1
  if (lastInvoice) {
    // Extract the number part: "SCM/2025-26/0042" → 42
    const parts = lastInvoice.invoiceNo.split('/')
    nextNumber = parseInt(parts[2]) + 1
  }

  // Pad with zeros to 4 digits: 42 → "0042"
  return `SCM/${fyString}/${String(nextNumber).padStart(4, '0')}`
}

function registerBillingHandlers(ipcMain) {

  // ----------------------------------------------------------
  // Get all invoices with optional filters
  // ----------------------------------------------------------
  ipcMain.handle('billing:get-invoices', async (event, filters = {}) => {
    try {
      const { customerId, status, fromDate, toDate, page = 1, limit = 50 } = filters
      
      const where = {}
      if (customerId) where.customerId = customerId
      if (status) where.status = status
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            customer: true,      // Join customer table
            items: {
              include: { material: true } // Join material for each item
            },
            payments: true
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.invoice.count({ where })
      ])

      return { success: true, invoices, total }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // ----------------------------------------------------------
  // Get single invoice by ID
  // ----------------------------------------------------------
  ipcMain.handle('billing:get-invoice', async (event, { id }) => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          items: { include: { material: true } },
          payments: true
        }
      })
      return { success: true, invoice }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // ----------------------------------------------------------
  // Create new invoice
  // Uses $transaction to:
  // 1. Auto-generate invoice number
  // 2. Create invoice + all line items
  // 3. Update stock for each material sold
  // ----------------------------------------------------------
  ipcMain.handle('billing:create-invoice', async (event, invoiceData) => {
    try {
      const { items, createdBy, ...invoiceFields } = invoiceData
      
      const result = await prisma.$transaction(async (tx) => {
        // Generate unique invoice number
        const invoiceNo = await generateInvoiceNo()
        
        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
        const gstAmount = (subtotal * invoiceFields.gstPercent) / 100
        const totalAmount = subtotal + gstAmount
        
        // If status is 'paid', set paidAmount to totalAmount
        const paidAmount = invoiceFields.status === 'paid' ? totalAmount : 0
        
        // Create the invoice
        const invoice = await tx.invoice.create({
          data: {
            invoiceNo,
            ...invoiceFields,
            subtotal,
            gstAmount,
            totalAmount,
            paidAmount,
            createdBy,
            // Create all line items in the same transaction using `create` inside `create`
            items: {
              create: items.map(item => ({
                materialId: item.materialId,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount,
              }))
            }
          },
          include: {
            customer: true,
            items: { include: { material: true } }
          }
        })

        // Decrease stock for each material sold
        for (const item of items) {
          await tx.material.update({
            where: { id: item.materialId },
            data: { currentStock: { decrement: item.quantity } }
          })
          
          // Also create a stock entry record
          await tx.stockEntry.create({
            data: {
              materialId: item.materialId,
              type: 'out',
              quantity: item.quantity,
              source: `Invoice ${invoiceNo}`,
              createdBy,
            }
          })
        }

        return invoice
      })

      return { success: true, invoice: result }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // ----------------------------------------------------------
  // Record a payment against an invoice
  // ----------------------------------------------------------
  ipcMain.handle('billing:add-payment', async (event, paymentData) => {
    try {
      const { invoiceId, amount, ...rest } = paymentData

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create payment record
        const payment = await tx.payment.create({
          data: { invoiceId, amount, ...rest }
        })

        // 2. Update invoice's paid amount and status
        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } })
        const newPaidAmount = invoice.paidAmount + amount
        
        // Determine new status
        let newStatus = 'partial'
        if (newPaidAmount >= invoice.totalAmount) newStatus = 'paid'
        if (newPaidAmount === 0) newStatus = 'unpaid'

        await tx.invoice.update({
          where: { id: invoiceId },
          data: { paidAmount: newPaidAmount, status: newStatus }
        })

        return payment
      })

      return { success: true, payment: result }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Get outstanding (unpaid/partial) invoices summary
  ipcMain.handle('billing:get-outstanding', async () => {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { status: { in: ['unpaid', 'partial'] } },
        include: { customer: true },
        orderBy: { date: 'asc' }
      })
      
      const totalOutstanding = invoices.reduce(
        (sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0
      )
      
      return { success: true, invoices, totalOutstanding }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Get all unpaid/partial invoices for a specific customer
  ipcMain.handle('billing:get-customer-unpaid', async (event, customerId) => {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { 
          customerId: parseInt(customerId),
          status: { in: ['unpaid', 'partial'] }
        },
        include: { customer: true },
        orderBy: { date: 'asc' }
      })
      return { success: true, invoices }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Get Payment Collection Stats (Total Outstanding & Today's Collections)
  ipcMain.handle('billing:get-payment-stats', async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [invoices, todayPayments] = await Promise.all([
        prisma.invoice.findMany({
          where: { status: { in: ['unpaid', 'partial'] } }
        }),
        prisma.payment.findMany({
          where: { createdAt: { gte: today } }
        })
      ])

      const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0)
      const collectionsToday = todayPayments.reduce((sum, p) => sum + p.amount, 0)
      const customerCount = new Set(invoices.map(inv => inv.customerId)).size

      return { 
        success: true, 
        totalOutstanding, 
        collectionsToday, 
        activeCustomers: customerCount,
        paymentCount: todayPayments.length
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Get Recent Payments
  ipcMain.handle('billing:get-payments', async (event, limit = 50) => {
    try {
      const payments = await prisma.payment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            include: { customer: true }
          }
        }
      })
      return { success: true, payments }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
}



module.exports = { registerBillingHandlers }
