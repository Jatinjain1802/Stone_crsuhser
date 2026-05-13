# 🪨 Stone Crusher Plant ERP — Complete Workpath
**Version:** 1.0 | **Date:** May 2026 | **Prepared by:** Heerova Solution

---

## Project Overview

| Field | Details |
|---|---|
| Project Type | Offline Desktop ERP Software |
| Platform | Windows (Electron.js) |
| Delivery Format | `.exe` Installer |
| Database | SQLite (Local) |
| Primary Users | Plant Owner, Admin, Gate Manager, Accountant |
| Internet Dependency | **None** — 100% Offline |
| Estimated Timeline | **12–14 Weeks** (3 Phases) |

---

## Tech Stack (Final)

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Shell | Electron.js | Web app → Desktop `.exe` |
| Frontend | React.js + Vite | UI rendering |
| Styling | Tailwind CSS | Component styling |
| UI Components | ShadCN UI | Pre-built accessible components |
| Backend Logic | Node.js (Electron Main Process) | Business logic, file ops |
| Database | SQLite | Local offline storage |
| ORM | Prisma ORM | DB schema + queries |
| PDF Generation | jsPDF + autoTable | Invoice & report PDFs |
| Excel Export | SheetJS (xlsx) | Report exports |
| Packaging | Electron Builder | Windows installer |
| State Management | Zustand | Global app state |
| Form Handling | React Hook Form + Zod | Validated forms |

---

## Folder Structure

```
stone-crusher-erp/
│
├── electron/                        # Electron main process
│   ├── main.js                      # App entry point
│   ├── preload.js                   # Bridge: renderer ↔ main
│   └── ipc/                         # IPC handlers (one per module)
│       ├── auth.ipc.js
│       ├── inventory.ipc.js
│       ├── billing.ipc.js
│       ├── vehicle.ipc.js
│       ├── expense.ipc.js
│       └── reports.ipc.js
│
├── src/                             # React frontend
│   ├── main.jsx                     # React entry
│   ├── App.jsx                      # Router + layout
│   │
│   ├── pages/                       # One folder per module
│   │   ├── Dashboard/
│   │   ├── Auth/
│   │   ├── Inventory/
│   │   ├── Vehicles/
│   │   ├── Billing/
│   │   ├── Customers/
│   │   ├── Expenses/
│   │   ├── Reports/
│   │   └── Settings/
│   │
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # ShadCN components
│   │   ├── layout/                  # Sidebar, Navbar, Shell
│   │   ├── charts/                  # Recharts wrappers
│   │   └── shared/                  # Buttons, Modals, Tables
│   │
│   ├── store/                       # Zustand state stores
│   │   ├── authStore.js
│   │   └── appStore.js
│   │
│   ├── services/                    # IPC bridge calls
│   │   ├── inventory.service.js
│   │   ├── billing.service.js
│   │   └── ...
│   │
│   └── utils/                       # Helpers
│       ├── pdf.util.js
│       ├── excel.util.js
│       ├── date.util.js
│       └── format.util.js
│
├── prisma/
│   └── schema.prisma                # Full DB schema
│
├── database/
│   └── stone_crusher.db             # SQLite DB file (auto-created)
│
├── assets/                          # Logo, icons, fonts
│
├── dist/                            # Build output
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── electron-builder.config.js
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../database/stone_crusher.db"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  mobile    String?
  password  String   // bcrypt hashed
  role      String   // "admin" | "manager" | "accountant" | "gate"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model Material {
  id          Int           @id @default(autoincrement())
  name        String        // "Raw Stone", "Dust", "10mm Gitti", etc.
  category    String        // "raw" | "finished"
  unit        String        // "ton" | "CFT" | "unit"
  minStock    Float         @default(0)
  stockItems  StockEntry[]
  invoiceItems InvoiceItem[]
}

model StockEntry {
  id         Int      @id @default(autoincrement())
  materialId Int
  material   Material @relation(fields: [materialId], references: [id])
  type       String   // "in" | "out"
  quantity   Float
  date       DateTime @default(now())
  source     String?  // supplier / vehicle no
  note       String?
  createdBy  Int
}

model Customer {
  id          Int       @id @default(autoincrement())
  name        String
  mobile      String
  address     String?
  gstin       String?
  creditLimit Float     @default(0)
  type        String    // "regular" | "contractor" | "onetime"
  invoices    Invoice[]
  createdAt   DateTime  @default(now())
}

model Invoice {
  id          Int           @id @default(autoincrement())
  invoiceNo   String        @unique  // SCM/2025-26/0001
  customerId  Int
  customer    Customer      @relation(fields: [customerId], references: [id])
  date        DateTime      @default(now())
  items       InvoiceItem[]
  gstPercent  Float
  totalAmount Float
  paidAmount  Float         @default(0)
  status      String        // "paid" | "partial" | "unpaid"
  paymentMode String?       // "cash" | "upi" | "bank" | "credit"
  dueDate     DateTime?
  notes       String?
}

model InvoiceItem {
  id         Int      @id @default(autoincrement())
  invoiceId  Int
  invoice    Invoice  @relation(fields: [invoiceId], references: [id])
  materialId Int
  material   Material @relation(fields: [materialId], references: [id])
  quantity   Float
  rate       Float
  amount     Float
}

model Vehicle {
  id           Int      @id @default(autoincrement())
  vehicleNo    String
  driverName   String?
  materialType String
  entryWeight  Float?
  exitWeight   Float?
  netWeight    Float?
  entryTime    DateTime @default(now())
  exitTime     DateTime?
  type         String   // "in" | "out"
  challanNo    String?
  dieselLitre  Float?
  note         String?
}

model Expense {
  id         Int      @id @default(autoincrement())
  category   String   // "diesel" | "labour" | "maintenance" | "electricity" | "other"
  amount     Float
  date       DateTime @default(now())
  description String?
  addedBy    Int
}

model Production {
  id          Int      @id @default(autoincrement())
  date        DateTime @default(now())
  materialId  Int
  quantity    Float
  machineId   String?
  note        String?
}
```

---

## Key Technical Decisions

### Why Electron IPC (not REST API)?
- Renderer (React) cannot directly access Node.js/Prisma
- IPC handlers in `electron/ipc/` handle all DB operations
- `preload.js` exposes safe `window.api.*` methods to React
- Keeps security boundary clean

### Why Zustand over Redux?
- Lightweight, minimal boilerplate
- Sufficient for desktop app state
- Easy to integrate with IPC responses

### Why Prisma over raw SQLite?
- Type-safe queries
- Migration management
- Easy schema changes in future

### Invoice Number Format
```
SCM / {financial-year} / {zero-padded-number}
Example: SCM/2025-26/0001
Auto-increments per year, resets at April 1
```

---

## Development Checklist (Quick Reference)

- [ ] Project boilerplate setup
- [ ] Electron + React + Prisma connected
- [ ] Login / Roles working
- [ ] Inventory CRUD complete
- [ ] Billing + PDF invoice working

- [ ] Vehicle entry/exit + challan
- [ ] Expense tracking
- [ ] Customer ledger + outstanding
- [ ] All 8 reports with export

- [ ] Dashboard with charts
- [ ] Backup/restore working
- [ ] Notification center
- [ ] Settings + audit log
- [ ] `.exe` installer generated

- [ ] UAT done
- [ ] Bugs fixed
- [ ] Training completed
- [ ] User manual delivered
- [ ] Final installer handed over

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Prisma with Electron native module issues | High | Use `prisma generate` with electron target, test early |
| SQLite file corruption | Medium | Auto-backup daily, backup before every migration |
| Windows version compatibility | Medium | Test on Windows 10 + Windows 11 |
| Large data performance (1000s of invoices) | Low | Add DB indexes on date, customer_id fields |
| Client scope creep | High | Lock Phase 1 requirements before Phase 2 start |

---

## Estimated Budget Breakdown (For Reference)

| Phase | Scope | Est. Cost |
|---|---|---|
| Phase 1 (Core) | Auth + Dashboard + Inventory + Billing | ₹25,000–35,000 |
| Phase 2 (Operations) | Vehicles + Expenses + Reports | ₹20,000–25,000 |
| Phase 3 (Advanced) | Analytics + Backup + Notifications + Build | ₹15,000–20,000 |
| **Total** | **Complete ERP** | **₹60,000–80,000** |

*Annual maintenance: ₹8,000–12,000/year (optional)*

---

*Document prepared by Heerova Solution | heerova.in | May 2026*
*For client queries: contact@heerova.in*
