// electron/main.js
// ---------------------------------------------------------------
// This is the MAIN PROCESS of Electron — it runs in Node.js.
// Think of it as the "backend" of your desktop app.
//
// What it does:
// 1. Creates the application window (BrowserWindow)
// 2. Loads the React app into that window
// 3. Listens for IPC messages from React (renderer process)
// 4. Manages app lifecycle (ready, window-all-closed, activate)
//
// KEY CONCEPT: Electron has TWO processes:
//   - Main Process (this file) → Can access Node.js, files, DB
//   - Renderer Process (React) → Runs in browser sandbox, NO Node.js
//   They communicate via IPC (Inter-Process Communication)
// ---------------------------------------------------------------

const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const isDev = process.env.NODE_ENV === 'development'

// ---------------------------------------------------------------
// PRODUCTION DATABASE SETUP
// ---------------------------------------------------------------
const userDataPath = app.getPath('userData')
const projectRoot = path.join(__dirname, '..')

const dbPath = isDev 
  ? path.resolve(projectRoot, 'database', 'stone_crusher.db')
  : path.resolve(userDataPath, 'stone_crusher.db')

// Create database folder if it doesn't exist
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Set DATABASE_URL for Prisma BEFORE importing any IPC handlers
process.env.DATABASE_URL = `file:${dbPath}`
console.log('[Main] Database Path:', dbPath)

// Import all IPC handlers (these handle DB operations)
const { registerAuthHandlers } = require('./ipc/auth.ipc')
const { registerInventoryHandlers } = require('./ipc/inventory.ipc')
const { registerBillingHandlers } = require('./ipc/billing.ipc')
const { registerVehicleHandlers } = require('./ipc/vehicle.ipc')
const { registerExpenseHandlers } = require('./ipc/expense.ipc')
const { registerReportsHandlers } = require('./ipc/reports.ipc')
const { registerDashboardHandlers } = require('./ipc/dashboard.ipc')
const { registerCustomerHandlers } = require('./ipc/customer.ipc')

// Reference to the main window, kept globally to prevent garbage collection
let mainWindow

// ---------------------------------------------------------------
// createWindow() — Creates and configures the desktop window
// BrowserWindow is Electron's way to create an OS window
// ---------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'Stone Crusher Plant ERP',
    
    // Window appearance
    backgroundColor: '#f8f9fa',
    
    // Show window only after content loads (no white flash)
    show: false,
    
    // webPreferences configures the browser sandbox
    webPreferences: {
      // preload.js runs before the renderer, in a privileged context
      // It's the BRIDGE between Main and Renderer processes
      preload: path.join(__dirname, 'preload.js'),
      
      // Security settings
      contextIsolation: true,    // Keeps preload isolated from renderer
      nodeIntegration: false,    // React cannot access Node.js directly
      sandbox: false,            // Required for preload to work
    },
  })

  // Load the React app
  if (isDev) {
    // In development: load from Vite dev server (hot reload)
    mainWindow.loadURL('http://localhost:5173')
    // Open developer tools for debugging
    mainWindow.webContents.openDevTools()
  } else {
    // In production: load from built dist/ folder
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Show window once content is ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.maximize() // Start maximized like a desktop ERP
  })

  // Clean up when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------------------
// App Lifecycle Events
// ---------------------------------------------------------------

// 'ready' fires when Electron has finished initializing
// This is where you create windows and register IPC handlers
app.whenReady().then(() => {
  createWindow()
  
  // Register all IPC handlers — these receive messages from React
  registerAuthHandlers(ipcMain)
  registerInventoryHandlers(ipcMain)
  registerBillingHandlers(ipcMain)
  registerVehicleHandlers(ipcMain)
  registerExpenseHandlers(ipcMain)
  registerReportsHandlers(ipcMain)
  registerDashboardHandlers(ipcMain)
  registerCustomerHandlers(ipcMain)

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 'window-all-closed' fires when all windows are closed
// On Windows/Linux: quit the app. On macOS: keep app in dock.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
