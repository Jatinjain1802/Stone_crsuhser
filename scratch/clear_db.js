// e:\GIT_PROJECT\Stone_crusher\scratch\clear_db.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning database...')
  
  // Order matters because of foreign key constraints!
  // Delete children first, then parents.
  await prisma.payment.deleteMany({})
  await prisma.invoiceItem.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.stockEntry.deleteMany({})
  await prisma.vehicle.deleteMany({})
  await prisma.expense.deleteMany({})
  await prisma.production.deleteMany({})
  await prisma.material.deleteMany({})
  await prisma.customer.deleteMany({})
  // Keep users so you can still login
  
  console.log('Database cleaned successfully! ✅')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
