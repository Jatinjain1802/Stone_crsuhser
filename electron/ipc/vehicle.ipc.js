// electron/ipc/vehicle.ipc.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function registerVehicleHandlers(ipcMain) {

  ipcMain.handle('vehicle:get-all', async (event, filters = {}) => {
    try {
      const { type, fromDate, toDate, vehicleNo, page = 1, limit = 50 } = filters
      const where = {}
      if (type) where.type = type
      if (vehicleNo) where.vehicleNo = { contains: vehicleNo }
      if (fromDate || toDate) {
        where.entryTime = {}
        if (fromDate) where.entryTime.gte = new Date(fromDate)
        if (toDate) where.entryTime.lte = new Date(toDate)
      }

      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          orderBy: { entryTime: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.vehicle.count({ where })
      ])

      return { success: true, vehicles, total }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('vehicle:create-entry', async (event, data) => {
    try {
      const vehicle = await prisma.vehicle.create({ data })
      return { success: true, vehicle }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('vehicle:update-exit', async (event, { id, exitWeight, exitTime, note }) => {
    try {
      const vehicle = await prisma.vehicle.findUnique({ where: { id } })
      const netWeight = vehicle.entryWeight
        ? Math.abs(vehicle.entryWeight - exitWeight)
        : exitWeight

      const updated = await prisma.vehicle.update({
        where: { id },
        data: {
          exitWeight,
          exitTime: exitTime ? new Date(exitTime) : new Date(),
          netWeight,
          note
        }
      })
      return { success: true, vehicle: updated }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('vehicle:get-active', async () => {
    try {
      // Vehicles that have entered but not exited yet
      const vehicles = await prisma.vehicle.findMany({
        where: { exitTime: null },
        orderBy: { entryTime: 'asc' }
      })
      return { success: true, vehicles }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
}

module.exports = { registerVehicleHandlers }
