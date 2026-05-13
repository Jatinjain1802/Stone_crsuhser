// electron/preload.js
// ---------------------------------------------------------------
// This is the BRIDGE between the Main Process and Renderer (React).
//
// WHY IS THIS NEEDED?
// React runs in a browser-like sandbox and cannot directly call
// Node.js APIs (file system, database, etc.). This is a security
// feature of Electron.
//
// preload.js runs BEFORE React loads, in a special context that
// has access to BOTH Node.js and the browser window.
//
// It uses contextBridge.exposeInMainWorld() to safely expose
// specific functions to React as `window.api.*`
//
// FLOW:
//   React calls: window.api.invoke('auth:login', data)
//       ↓
//   preload.js: ipcRenderer.invoke('auth:login', data)
//       ↓
//   main.js: ipcMain.handle('auth:login', handler)
//       ↓
//   Handler runs DB query via Prisma
//       ↓
//   Result comes back to React
// ---------------------------------------------------------------

const { contextBridge, ipcRenderer } = require('electron')

// ---------------------------------------------------------------
// contextBridge.exposeInMainWorld(name, api)
// Exposes the API as: window.api in React
// ---------------------------------------------------------------
contextBridge.exposeInMainWorld('api', {
  
  // ----------------------------------------------------------
  // Generic invoke method — sends a message to main process
  // channel = event name (e.g., 'auth:login')
  // data = payload to send
  // Returns a Promise with the result
  // ----------------------------------------------------------
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  
  // ----------------------------------------------------------
  // Listen for events from main process (for notifications etc.)
  // ----------------------------------------------------------
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, data) => callback(data))
  },
  
  // Remove event listener to prevent memory leaks
  off: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
