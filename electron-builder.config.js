// electron-builder.config.js
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: "com.stonecrusher.erp",
  productName: "Stone Crusher ERP",
  copyright: "Copyright © 2026 Heerova Solution",
  
  // Kaunsi files bundle mein jayengi
  files: [
    "dist/**/*",          // React ka built code
    "electron/**/*",      // Electron main and preload
    "prisma/**/*",        // Database schema
    "node_modules/**/*",  // All dependencies
    "package.json"
  ],

  // ASAR Settings: Unpack Prisma engine to allow it to run
  asar: true,
  asarUnpack: [
    "node_modules/.prisma/client",
    "node_modules/@prisma/client"
  ],

  // Windows specific settings
  win: {
    target: [
      {
        target: "nsis",   // Installer banayega (.exe)
        arch: ["x64"]     // 64-bit windows ke liye
      }
    ],
    // icon: "assets/logo.png" // App ka icon (ensure this exists and is .ico for Windows)
  },

  // Installer (NSIS) settings
  nsis: {
    oneClick: false,              // User ko "Next" buttons dikhayega
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,  // Desktop par icon banayega
    // installerIcon: "assets/logo.png",
    // uninstallerIcon: "assets/logo.png"
  },

  // Build output folder
  directories: {
    output: "release"
  },

  // Prisma engine inclusion (Important for DB to work in .exe)
  extraResources: [
    {
      from: "node_modules/.prisma/client",
      to: "node_modules/.prisma/client"
    },
    {
      from: "database/stone_crusher.db",
      to: "database/stone_crusher.db"
    }
  ]
};
