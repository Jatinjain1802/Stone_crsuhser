// electron/ipc/inventory.ipc.js
// ---------------------------------------------------------------
// IPC Handlers for Inventory/Stock Management module.
//
// CRUD = Create, Read, Update, Delete — the four basic operations
// on any database table.
//
// Prisma methods used here:
//   prisma.material.findMany()    → Get list of records
//   prisma.material.findUnique()  → Get one record by ID
//   prisma.material.create()      → Insert new record
//   prisma.material.update()      → Edit existing record
//   prisma.material.delete()      → Remove record
//   prisma.$transaction([...])    → Run multiple queries atomically
//                                   (all succeed or all fail together)
// ---------------------------------------------------------------

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function registerInventoryHandlers(ipcMain) {

  // ----------------------------------------------------------
  // MATERIALS — Stock item types
  // ----------------------------------------------------------

  // Get all materials
  ipcMain.handle('inventory:get-materials', async () => {
    try {
      const materials = await prisma.material.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })
      return { success: true, materials }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Create new material
  ipcMain.handle('inventory:create-material', async (event, data) => {
    try {
      const material = await prisma.material.create({ data })
      return { success: true, material }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Update material
  ipcMain.handle('inventory:update-material', async (event, { id, ...data }) => {
    try {
      const material = await prisma.material.update({ where: { id }, data })
      return { success: true, material }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Delete material (soft delete — mark as inactive)
  ipcMain.handle('inventory:delete-material', async (event, { id }) => {
    try {
      await prisma.material.update({
        where: { id },
        data: { isActive: false }
      })
      return { success: true }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // ----------------------------------------------------------
  // STOCK ENTRIES — Track every stock movement
  // ----------------------------------------------------------

  // Get stock entries with filters
  ipcMain.handle('inventory:get-stock-entries', async (event, filters = {}) => {
    try {
      const { materialId, type, fromDate, toDate, page = 1, limit = 50 } = filters
      
      // Build dynamic where clause based on provided filters
      const where = {}
      if (materialId) where.materialId = materialId
      if (type) where.type = type
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate) // gte = greater than or equal
        if (toDate) where.date.lte = new Date(toDate)    // lte = less than or equal
      }

      // Run both queries in parallel using Promise.all for performance
      const [entries, total] = await Promise.all([
        prisma.stockEntry.findMany({
          where,
          include: { material: true }, // Join with material table
          orderBy: { date: 'desc' },
          skip: (page - 1) * limit,   // Pagination: skip previous pages
          take: limit,                  // Pagination: take current page
        }),
        prisma.stockEntry.count({ where }) // Total count for pagination
      ])

      return { success: true, entries, total, page, limit }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Add stock entry (in or out) and update material's current stock
  // We use $transaction to ensure both operations succeed or both fail
  ipcMain.handle('inventory:add-stock-entry', async (event, data) => {
    try {
      // $transaction ensures atomicity — if one query fails, both are rolled back
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the stock entry record
        const entry = await tx.stockEntry.create({ data })

        // 2. Update material's current stock count
        // If type is "in", increase stock; if "out", decrease stock
        const stockChange = data.type === 'in' ? data.quantity : -data.quantity
        
        await tx.material.update({
          where: { id: data.materialId },
          data: { currentStock: { increment: stockChange } }
        })

        return entry
      })

      return { success: true, entry: result }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // ----------------------------------------------------------
  // PRODUCTION — Daily production records
  // ----------------------------------------------------------

  ipcMain.handle('inventory:add-production', async (event, data) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const production = await tx.production.create({
          data,
          include: { material: true }
        })
        
        // Production increases the finished goods stock
        await tx.material.update({
          where: { id: data.materialId },
          data: { currentStock: { increment: data.quantity } }
        })

        return production
      })

      return { success: true, production: result }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('inventory:get-production', async (event, filters = {}) => {
    try {
      const { fromDate, toDate, materialId } = filters
      const where = {}
      if (materialId) where.materialId = materialId
      if (fromDate || toDate) {
        where.date = {}
        if (fromDate) where.date.gte = new Date(fromDate)
        if (toDate) where.date.lte = new Date(toDate)
      }

      const productions = await prisma.production.findMany({
        where,
        include: { material: true },
        orderBy: { date: 'desc' }
      })
      return { success: true, productions }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Get low stock alerts — materials below their minimum stock level
  ipcMain.handle('inventory:get-low-stock', async () => {
    try {
      // Prisma raw query for comparing two fields of the same model
      const materials = await prisma.$queryRaw`
        SELECT * FROM Material 
        WHERE isActive = 1 AND currentStock <= minStock AND minStock > 0
      `
      return { success: true, materials }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
}

module.exports = { registerInventoryHandlers }
