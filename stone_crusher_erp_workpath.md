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

## Phase 1 — Core Foundation (Weeks 1–4)

> **Goal:** Working app with login, dashboard, inventory, and billing

### Week 1 — Project Setup

| Task | Details | Est. Time |
|---|---|---|
| Electron + React + Vite boilerplate | Init project, configure main/renderer process | 1 day |
| Tailwind + ShadCN setup | Configure design system | 0.5 day |
| Prisma + SQLite setup | DB connection, schema write, migration | 1 day |
| IPC bridge setup | `preload.js` contextBridge for renderer↔main | 0.5 day |
| Routing (React Router) | Page routes + protected routes | 0.5 day |
| App layout shell | Sidebar + topbar + content area | 1 day |

**Week 1 Deliverable:** App opens, sidebar navigation works, DB is connected.

---

### Week 2 — Authentication Module

| Task | Details |
|---|---|
| Login page UI | Email/mobile + password form |
| Password hashing | `bcryptjs` for secure password storage |
| Session management | Electron store for persistent login token |
| Auto-logout | Inactivity timer (configurable minutes) |
| Role-based route guards | Admin vs Manager vs Gate access |
| User management page | Admin can add/edit/deactivate users |
| Password reset flow | OTP via email (optional offline: admin reset) |

**Roles to implement:**

| Role | Module Access |
|---|---|
| Admin | All modules + settings + user management |
| Manager | Dashboard, Inventory, Billing, Reports |
| Accountant | Billing, Customers, Expenses, Reports |
| Gate Manager | Vehicle entry/exit only |

**Week 2 Deliverable:** Login works, roles restrict pages correctly.

---

### Week 3 — Inventory Management

| Task | Details |
|---|---|
| Material master setup | Add/edit materials (name, unit, min stock) |
| Stock In entry form | Quantity, date, source, material selection |
| Stock Out entry form | Links to vehicle/billing or manual |
| Current stock view | Table with all materials + current qty |
| Low stock alert logic | Check on every stock-out if below min level |
| Stock history page | Filter by material, date range |
| Warehouse/godown support | Optional multi-location stock |
| Edit/delete with audit log | All changes recorded with user + timestamp |

**Week 3 Deliverable:** Complete stock tracking working, alerts firing.

---

### Week 4 — Billing & Invoice

| Task | Details |
|---|---|
| Customer master | Add/edit customers with GSTIN, credit limit |
| Invoice creation form | Customer select, add line items, GST calc |
| Auto invoice numbering | `SCM/2025-26/0001` format, auto-increment |
| GST calculation | 5% / 12% / 18% auto-applied |
| Payment recording | Cash / UPI / Bank / Credit modes |
| Payment status tracking | Paid / Partial / Unpaid with due date |
| PDF invoice generation | jsPDF with plant logo + GST format |
| Print invoice | Direct print from app |
| WhatsApp share button | Opens WhatsApp with PDF attached (web link) |

**Week 4 Deliverable:** Full billing cycle — create invoice → record payment → export PDF.

---

## Phase 2 — Operations (Weeks 5–8)

> **Goal:** Vehicle management, expenses, reports

### Week 5 — Vehicle & Truck Management

| Task | Details |
|---|---|
| Vehicle entry form | Vehicle no, driver, material, entry weight |
| Vehicle exit form | Exit weight, auto net weight calculation |
| Challan generation | Auto-generate challan no, PDF export |
| Vehicle list view | Today's entries, filter by date/type |
| Diesel tracking | Per-vehicle diesel record |
| Vehicle history | Search by vehicle number |
| Weighbridge integration prep | Hook for future hardware integration |

---

### Week 6 — Expense Management

| Task | Details |
|---|---|
| Expense categories setup | Diesel, Labour, Maintenance, Electricity, Other |
| Expense entry form | Date, amount, category, description |
| Expense list view | Filter by category, date range |
| Monthly expense summary | Category-wise totals |
| Recurring expense support | Monthly entries like electricity bill |

---

### Week 7 — Customer Ledger & Payments

| Task | Details |
|---|---|
| Customer ledger view | All invoices + payments for a customer |
| Outstanding balance calc | Running balance with date-wise history |
| Due payment list | All customers with pending amount |
| Payment reminder log | Manual note when reminder sent |
| Customer purchase report | Total purchases by customer in date range |
| Credit limit enforcement | Alert if new invoice exceeds limit |

---

### Week 8 — Reports Module

| Report | Filters | Export |
|---|---|---|
| Sales Report | Date range, customer, material | PDF + Excel |
| Inventory Report | Current stock + movement history | PDF + Excel |
| Vehicle Report | Date range, vehicle no, type | PDF + Excel |
| Production Report | Date range, material, machine | PDF + Excel |
| Expense Report | Date range, category | PDF + Excel |
| Profit & Loss | Month / quarter / custom | PDF + Excel |
| Employee Report | Month, employee | PDF + Excel |
| Due Payment Report | All outstanding | PDF + Excel |

**Report Engine Tasks:**

| Task | Details |
|---|---|
| Report filter UI | Reusable date + dropdown filter components |
| Data aggregation queries | Prisma queries for each report |
| PDF report layout | jsPDF with table formatting |
| Excel export | SheetJS with proper column headers |
| Print functionality | Print report directly from app |

---

## Phase 3 — Advanced Features (Weeks 9–12)

> **Goal:** Dashboard analytics, backup system, notifications, polish

### Week 9 — Dashboard & Analytics

| Task | Details |
|---|---|
| Summary cards | Today's production, sales, pending, vehicles |
| Monthly revenue vs expense chart | Recharts bar chart |
| Production trend graph | Line chart, last 30 days |
| Material-wise sales pie chart | Recharts pie |
| Vehicle entry frequency | Bar chart by date |
| Date range filter | Today / This Week / This Month / Custom |
| Real-time data refresh | Dashboard auto-refreshes on data change |

---

### Week 10 — Backup & Restore System

| Task | Details |
|---|---|
| Manual backup | Copy `.db` file to ZIP with timestamp |
| Auto backup | Daily/weekly schedule, save to chosen folder |
| Backup location picker | User selects backup destination (USB, drive) |
| Restore from backup | Upload ZIP → validate → restore DB |
| Backup history log | List of all backups with date + size |
| Cloud sync prep | Architecture ready for future Dropbox/Drive sync |

---

### Week 11 — Notifications & Alerts

| Alert | Trigger | Channel |
|---|---|---|
| Low stock alert | Stock falls below min level | In-app popup + log |
| Payment due alert | Invoice due date reached | In-app + SMS (optional) |
| Invoice auto-share | Invoice created | WhatsApp link / email |
| Daily summary | End of day | In-app notification |

**Implementation:**

| Task | Details |
|---|---|
| Notification center | Bell icon with unread count, in-app drawer |
| Alert rules engine | Configurable thresholds per material/customer |
| WhatsApp sharing | wa.me link with pre-filled message + PDF URL |
| Email integration | Nodemailer (optional, requires internet) |

---

### Week 12 — Settings, Polish & Production Build

| Task | Details |
|---|---|
| Plant settings | Plant name, address, GSTIN, logo upload |
| Invoice settings | Prefix format, GST defaults, payment terms |
| User management | Admin CRUD for all users |
| Activity log | Who did what — full audit trail |
| App theme | Light/dark mode toggle |
| Loading states | Skeleton loaders on all data tables |
| Error handling | Proper error messages for all operations |
| Form validation | Zod schemas on all forms |
| Performance audit | Large dataset query optimization |
| Electron Builder config | Windows `.exe` + portable version |
| Installer testing | Fresh Windows install test |
| Final QA checklist | All modules end-to-end test |

---

## Weeks 13–14 — Testing & Delivery

| Task | Details |
|---|---|
| Client UAT | Client uses software, feedback collected |
| Bug fixes | Priority bugs from UAT |
| Data migration | If client has existing Excel data → import |
| Training session | 2–3 hour walkthrough with client staff |
| Documentation | User manual PDF (module-wise) |
| Final build | Signed `.exe` installer delivery |
| Support handover | 30-day support window defined |

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

### Phase 1 ✅
- [ ] Project boilerplate setup
- [ ] Electron + React + Prisma connected
- [ ] Login / Roles working
- [ ] Inventory CRUD complete
- [ ] Billing + PDF invoice working

### Phase 2 ✅
- [ ] Vehicle entry/exit + challan
- [ ] Expense tracking
- [ ] Customer ledger + outstanding
- [ ] All 8 reports with export

### Phase 3 ✅
- [ ] Dashboard with charts
- [ ] Backup/restore working
- [ ] Notification center
- [ ] Settings + audit log
- [ ] `.exe` installer generated

### Delivery ✅
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
