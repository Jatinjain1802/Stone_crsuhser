// electron/ipc/auth.ipc.js
// ---------------------------------------------------------------
// IPC Handlers for Authentication module.
//
// KEY CONCEPT — ipcMain.handle(channel, handler):
// This registers a "listener" in the main process.
// When React calls: window.api.invoke('auth:login', data)
// Electron fires the matching handler: ipcMain.handle('auth:login', ...)
//
// The handler:
// 1. Receives the data from React
// 2. Runs database operations via Prisma
// 3. Returns the result back to React (like a function return)
//
// We use bcryptjs to hash passwords — NEVER store plain text passwords.
// bcrypt is a one-way hashing function. You can verify a password
// against a hash, but cannot reverse the hash to get the password.
// ---------------------------------------------------------------

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// PrismaClient is our database interface
// It reads the schema.prisma and generates typed methods like:
//   prisma.user.findUnique(), prisma.user.create(), etc.
const prisma = new PrismaClient()

function registerAuthHandlers(ipcMain) {
  
  // ----------------------------------------------------------
  // auth:login
  // Validates email + password and returns the user object
  // ----------------------------------------------------------
  ipcMain.handle('auth:login', async (event, { email, password }) => {
    try {
      // Find user by email in database
      // findUnique() returns one record or null
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })

      // If no user found with this email
      if (!user) {
        return { success: false, message: 'Invalid email or password' }
      }

      // If user account is deactivated
      if (!user.isActive) {
        return { success: false, message: 'Account is deactivated. Contact admin.' }
      }

      // bcrypt.compare(plainPassword, hashedPassword)
      // Returns true if they match, false otherwise
      const isPasswordValid = await bcrypt.compare(password, user.password)
      
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid email or password' }
      }

      // Success! Return user data (exclude password for security)
      const { password: _, ...userWithoutPassword } = user
      return { success: true, user: userWithoutPassword }
      
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Login failed. Please try again.' }
    }
  })

  // ----------------------------------------------------------
  // auth:get-users — Get all users (admin only)
  // ----------------------------------------------------------
  ipcMain.handle('auth:get-users', async () => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true, name: true, email: true, mobile: true,
          role: true, isActive: true, createdAt: true
          // password is excluded for security
        },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, users }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // ----------------------------------------------------------
  // auth:create-user — Add a new user
  // ----------------------------------------------------------
  ipcMain.handle('auth:create-user', async (event, userData) => {
    try {
      // Hash the password before storing
      // saltRounds = 10 means bcrypt performs 2^10 = 1024 iterations
      // Higher = more secure but slower
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email.toLowerCase().trim(),
          mobile: userData.mobile || null,
          password: hashedPassword,
          role: userData.role || 'manager',
        }
      })
      
      const { password: _, ...userWithoutPassword } = user
      return { success: true, user: userWithoutPassword }
    } catch (error) {
      // Handle duplicate email (Prisma unique constraint error)
      if (error.code === 'P2002') {
        return { success: false, message: 'Email already exists' }
      }
      return { success: false, message: error.message }
    }
  })

  // ----------------------------------------------------------
  // auth:update-user — Edit user details
  // ----------------------------------------------------------
  ipcMain.handle('auth:update-user', async (event, { id, ...data }) => {
    try {
      // If password is being updated, hash it first
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10)
      }
      
      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, mobile: true, role: true, isActive: true }
      })
      
      return { success: true, user }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // ----------------------------------------------------------
  // auth:setup — Seeds the first admin user (runs on first launch)
  // ----------------------------------------------------------
  ipcMain.handle('auth:setup', async () => {
    try {
      const adminExists = await prisma.user.findFirst({
        where: { role: 'admin' }
      })
      
      if (adminExists) {
        return { success: true, alreadySetup: true }
      }
      
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const admin = await prisma.user.create({
        data: {
          name: 'Administrator',
          email: 'admin@stonecrusher.local',
          password: hashedPassword,
          role: 'admin',
        }
      })
      
      return { success: true, alreadySetup: false, defaultEmail: admin.email }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
}

module.exports = { registerAuthHandlers }
