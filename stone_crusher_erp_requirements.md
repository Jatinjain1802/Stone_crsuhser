# Stone Crusher Plant ERP Software
## Offline Desktop Application Architecture

---

# Project Goal

Develop a fully offline desktop-based ERP software for a Stone Crusher Plant similar to Tally-type software.

The software should:
- Run locally on Windows PC/Laptop
- Work without internet
- Store data locally
- Be installable using `.exe`
- Have no hosting/server dependency
- Provide fast and secure plant management operations

---

# Recommended Tech Stack

| Layer | Technology |
|---|---|
| Desktop Framework | Electron.js |
| Frontend | React.js |
| Styling | Tailwind CSS |
| UI Components | ShadCN UI |
| Backend Logic | Node.js |
| Database | SQLite |
| ORM | Prisma ORM |
| Packaging | Electron Builder |
| PDF Generation | jsPDF / PDFKit |
| Excel Export | SheetJS |

---

# Why This Stack

## Electron.js
Used to convert the React application into a desktop installable software.

### Benefits
- Generates Windows `.exe`
- Offline support
- Cross-platform support
- Native desktop feel

---

## React.js
Used for building the user interface.

### Benefits
- Modern UI
- Fast rendering
- Component-based architecture
- Easy scalability

---

## SQLite Database
Local lightweight database stored inside the user's system.

### Benefits
- No database installation required
- Single `.db` file
- Very fast
- Offline storage
- Easy backup & restore

---

## Prisma ORM
Used for database management and queries.

### Benefits
- Simplifies database operations
- Clean schema management
- Better scalability

---

# Software Architecture

```text
Electron Desktop App
│
├── React Frontend
│
├── Node.js Backend Logic
│
├── SQLite Local Database
│
└── Local File Storage
```

---

# Core Features

## Authentication
- Secure Login
- User Roles
- Password Protection

---

## Dashboard
- Daily Production
- Sales Summary
- Pending Payments
- Inventory Status
- Expense Summary

---

## Inventory Management
- Stock Entry
- Material Tracking
- Low Stock Alerts
- Warehouse Management

---

## Truck Management
- Vehicle Entry/Exit
- Driver Details
- Material Tracking
- Challan Generation

---

## Billing System
- GST Invoice
- PDF Export
- Print Invoice
- Payment Tracking

---

## Expense Management
- Diesel Expenses
- Labour Cost
- Maintenance Cost
- Electricity Expenses

---

## Reports
- Sales Reports
- Inventory Reports
- Production Reports
- Profit/Loss Reports

---

# Offline Functionality

The software should work completely offline.

## Requirements
- No internet dependency
- No cloud hosting
- Local data storage
- Fast local processing

---

# Backup & Restore System

## Features
- Manual Backup
- Auto Backup
- Restore Backup

## Backup Format
- ZIP Backup
- Database Backup

---

# Installation Requirements

## Deliverables
- Setup.exe Installer
- Desktop Shortcut
- Automatic Database Creation

---

# Security Requirements

## Security Features
- Encrypted Passwords
- Role-Based Access
- Local Data Protection
- Activity Logs

---

# Future Scalability

The architecture should support future upgrades such as:
- Cloud Sync
- Multi-Branch Management
- Mobile App
- GPS Tracking
- Weighbridge Integration

---

# Recommended Folder Structure

```text
project-root/
│
├── electron/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   └── utils/
│
├── prisma/
├── database/
├── assets/
└── dist/
```

---

# Packaging & Distribution

## Packaging Tool
Electron Builder

## Output
- Windows Installer (.exe)
- Portable Version

---

# Recommended Development Flow

## Phase 1
- Authentication
- Dashboard
- Inventory
- Billing

## Phase 2
- Truck Management
- Reports
- Expense Tracking

## Phase 3
- Backup System
- Analytics
- Advanced Features

---

# Final Recommendation

Build the application using:

- Electron.js
- React.js
- Node.js
- SQLite
- Prisma ORM

This stack is best suited for:
- Offline ERP systems
- Industrial software
- Tally-like desktop applications
- Fast local operations
- Future scalability
