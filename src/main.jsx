// src/main.jsx
// ---------------------------------------------------------------
// This is the React entry point — the very first React file that runs.
//
// What it does:
// 1. Imports React and ReactDOM
// 2. Imports our global CSS
// 3. Mounts the root <App /> component into the <div id="root"> in index.html
//
// React.StrictMode: A development helper that highlights potential problems.
// It renders components twice in development to detect side effects.
// In production builds, it has no effect.
// ---------------------------------------------------------------

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { authService } from './services/api'

// Perform initial system setup (e.g., create default admin)
authService.setup().then(result => {
  if (result.success && !result.alreadySetup) {
    console.log('System initialized with default admin: admin@stonecrusher.local / admin123')
  }
})

// ReactDOM.createRoot() creates the React "root" — the starting point
// document.getElementById('root') finds our <div id="root"> in index.html
// .render(<App />) renders the App component inside that div
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
