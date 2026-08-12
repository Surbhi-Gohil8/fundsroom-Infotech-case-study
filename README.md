# 🏭 Mini ERP + CRM Operations Portal

> A production-grade, full-stack internal operations portal built for wholesale/distribution companies — featuring role-based access control, real-time inventory management, CRM lead pipelines, atomic sales challan workflows, auto-generated tax invoices, and dynamic PDF streaming.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Role-Based Access Control](#5-role-based-access-control)
6. [Feature Modules](#6-feature-modules)
7. [API Reference](#7-api-reference)
8. [Environment Configuration](#8-environment-configuration)
9. [Demo Credentials](#9-demo-credentials)
10. [Local Development Setup](#10-local-development-setup)
11. [Production & Docker Deployment](#11-production--docker-deployment)
12. [Testing](#12-testing)
13. [Project Structure](#13-project-structure)

---

## 1. Project Overview

This is a **48-hour Full Stack Developer Case Study** — a cohesive mini-ERP + CRM product demonstrating real-world engineering ability across the entire stack.

**What it solves**: Internal operations teams at wholesale/distribution companies need a single platform to manage customer relationships, track inventory, create delivery challans, confirm stock dispatch, and generate GST-compliant tax invoices — all with strict department-based access control.

**Key engineering highlights**:
- ⚡ Concurrency-safe challan confirmation using PostgreSQL row-level locks
- 🔄 Atomic stock deduction with automatic rollback on insufficient inventory
- 📄 On-the-fly binary PDF streaming (no disk writes)
- 🔐 JWT authentication with role-based middleware guards
- ✅ 14 automated integration tests covering auth boundaries, schema validation, and transaction rollbacks

---

## 2. Technology Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js v22 + TypeScript |
| Framework | Express 5 |
| ORM | Prisma 7.9.1 |
| Database | PostgreSQL 15 |
| DB Driver | `@prisma/adapter-pg` (pg driver adapter) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Validation | Zod v4 |
| PDF Generation | PDFKit (binary streaming) |
| File Uploads | Multer (local disk fallback) / AWS S3 |
| Logging | Winston (structured JSON) |
| Testing | Vitest + Supertest |
| Dev Server | `tsx watch` (ESM-native hot reload) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |

### Infrastructure
| Layer | Technology |
|---|---|
| Containerization | Docker multi-stage builds |
| Orchestration | Docker Compose |
| Frontend Serving | Nginx (SPA fallback routing) |
| CI | GitHub Actions |

---

## 3. System Architecture

```
d:\final\
├── backend/          ← Node.js + Express API (port 5000)
│   ├── prisma/       ← Schema, migrations, seed
│   ├── src/
│   │   ├── config/   ← DB adapter, env parser, logger
│   │   ├── middleware/← Auth, RBAC, validation, error handler
│   │   ├── modules/  ← Feature modules (auth, customers, products, challans, invoices)
│   │   └── utils/    ← Errors, storage, PDF generation
│   ├── tests/        ← Integration test suite (Vitest)
│   ├── uploads/      ← Local product image storage fallback
│   ├── Dockerfile    ← Multi-stage production build
│   └── docker-compose.yml
│
├── frontend/         ← React SPA (port 5173 dev / port 80 prod)
│   ├── src/
│   │   ├── context/  ← Auth context + Axios header bootstrap
│   │   ├── components/← ProtectedRoute, Layout, Sidebar
│   │   └── pages/    ← Dashboard, Customers, Products, Inventory,
│   │                    Challans, CreateChallan, Invoices, Users
│   ├── Dockerfile    ← Nginx production image
│   └── nginx.conf    ← SPA fallback routing
│
├── .gitignore
└── README.md
```

---

## 4. Database Schema

```mermaid
erDiagram
    User {
        uuid id PK
        string name
        string email
        string passwordHash
        enum role
        bool isActive
    }
    Customer {
        uuid id PK
        string customerName
        string mobile
        string email
        string businessName
        string gstNumber
        enum customerType
        enum status
        datetime followUpDate
    }
    Product {
        uuid id PK
        string name
        string sku
        string category
        decimal unitPrice
        int currentStock
        int minimumStock
        string warehouseLocation
    }
    SalesChallan {
        uuid id PK
        string challanNumber
        enum status
        int totalQuantity
        datetime confirmedAt
        datetime cancelledAt
    }
    SalesChallanItem {
        uuid id PK
        string productNameSnapshot
        string skuSnapshot
        decimal unitPriceSnapshot
        int quantity
        decimal totalPrice
    }
    StockMovement {
        uuid id PK
        int quantityChanged
        enum movementType
        string reason
        string referenceType
    }
    Invoice {
        uuid id PK
        string invoiceNumber
        decimal subtotal
        decimal tax
        decimal total
        enum status
    }
    CustomerFollowUp {
        uuid id PK
        string note
        datetime followUpDate
    }

    User ||--o{ Customer : "creates"
    User ||--o{ CustomerFollowUp : "logs"
    User ||--o{ StockMovement : "records"
    User ||--o{ SalesChallan : "manages"
    User ||--o{ Invoice : "generates"
    Customer ||--o{ CustomerFollowUp : "has"
    Customer ||--o{ SalesChallan : "receives"
    Customer ||--o{ Invoice : "billed-to"
    Product ||--o{ StockMovement : "tracks"
    Product ||--o{ SalesChallanItem : "included-in"
    SalesChallan ||--o{ SalesChallanItem : "contains"
    SalesChallan ||--o{ Invoice : "originates"
```

---

## 5. Role-Based Access Control

| Feature | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|:---:|:---:|:---:|:---:|
| Login / Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Customers | ✅ | ✅ | ❌ | ✅ |
| Create / Edit Customers | ✅ | ✅ | ❌ | ❌ |
| Delete Customers | ✅ | ❌ | ❌ | ❌ |
| Add CRM Follow-Ups | ✅ | ✅ | ❌ | ❌ |
| View Products | ✅ | ✅ | ✅ | ✅ |
| Create / Edit Products | ✅ | ❌ | ✅ | ❌ |
| Adjust Stock (IN/OUT) | ✅ | ❌ | ✅ | ❌ |
| View Stock Movements | ✅ | ✅ | ✅ | ✅ |
| Create Sales Challans | ✅ | ✅ | ❌ | ❌ |
| Confirm / Cancel Challans | ✅ | ✅ | ❌ | ❌ |
| View Invoices | ✅ | ✅ | ❌ | ✅ |
| Download PDF (Challan/Invoice) | ✅ | ✅ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ |

---

## 6. Feature Modules

### 🔐 Authentication
- JWT-signed tokens with configurable expiry (`JWT_EXPIRES_IN`)
- Passwords hashed using bcrypt (10 salt rounds)
- Token accepted via `Authorization: Bearer <token>` header **or** `?token=<token>` query parameter (for PDF browser tab requests)
- `/api/auth/me` endpoint for session validation on app load

### 👥 Customer CRM
- Paginated customer directory with full-text search (name, business, email, mobile)
- Filter by status (`LEAD`, `ACTIVE`, `INACTIVE`) and type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`)
- Per-customer activity timeline with follow-up date scheduling
- GSTIN storage and validation

### 📦 Products & Inventory
- Product catalog with SKU, category, unit price, warehouse location, and image
- Automatic stock status classification: **Healthy** / **Low Stock** (≤ minimum) / **Out of Stock**
- Manual stock adjustment ledger (IN/OUT) with timestamped reason logs
- Dashboard counters for out-of-stock and low-stock product counts

### 📋 Sales Challans
- Sequential auto-numbered challan IDs (e.g. `CH-2024-0001`) with row-level lock protection
- Draft → Confirmed → Cancelled state machine
- Confirmation atomically deducts stock per line item inside a single PostgreSQL transaction
- If any product has insufficient stock, the entire transaction rolls back with a descriptive error
- Idempotency guard prevents double-confirmation of already-confirmed challans
- On-the-fly printable PDF generation (binary stream, no temp files)

### 🧾 Tax Invoices
- Automatically created when a challan is confirmed
- 18% GST applied on subtotal; grand total calculated
- Sequential invoice numbering (e.g. `INV-2024-0001`)
- Printable PDF with full line-item breakdown, customer GSTIN, and tax summary

### 👤 User Management (Admin only)
- Create users with name, email, password, and role assignment
- Edit user role and active status
- Users list with role badges

---

## 7. API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login with email & password |
| GET | `/auth/me` | 🔐 Any | Get current user session |
| GET | `/auth/users` | 🔐 Admin | List all users |
| POST | `/auth/users` | 🔐 Admin | Create a new user |
| PATCH | `/auth/users/:id` | 🔐 Admin | Update user role/status |

### Customers
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/customers` | 🔐 Admin/Sales/Accounts | List customers (paginated, filterable) |
| POST | `/customers` | 🔐 Admin/Sales | Create customer |
| GET | `/customers/:id` | 🔐 Admin/Sales/Accounts | Get customer details |
| PATCH | `/customers/:id` | 🔐 Admin/Sales | Update customer |
| DELETE | `/customers/:id` | 🔐 Admin | Delete customer |
| GET | `/customers/:id/follow-ups` | 🔐 Admin/Sales/Accounts | List follow-ups |
| POST | `/customers/:id/follow-ups` | 🔐 Admin/Sales | Add follow-up |

### Products & Inventory
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | 🔐 Any | List products (paginated, filterable) |
| POST | `/products` | 🔐 Admin/Warehouse | Create product |
| GET | `/products/:id` | 🔐 Any | Get product detail |
| PATCH | `/products/:id` | 🔐 Admin/Warehouse | Update product |
| DELETE | `/products/:id` | 🔐 Admin | Deactivate product |
| POST | `/products/:id/stock` | 🔐 Admin/Warehouse | Manual stock adjustment |
| GET | `/products/stock-movements` | 🔐 Any | Paginated stock movement ledger |
| POST | `/products/:id/image` | 🔐 Admin/Warehouse | Upload product image |

### Sales Challans
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/challans` | 🔐 Any | List challans (paginated) |
| POST | `/challans` | 🔐 Admin/Sales | Create draft challan |
| GET | `/challans/:id` | 🔐 Any | Get challan with items |
| POST | `/challans/:id/confirm` | 🔐 Admin/Sales | Confirm & deduct stock |
| POST | `/challans/:id/cancel` | 🔐 Admin/Sales | Cancel challan |
| GET | `/challans/:id/pdf` | 🔐 Any* | Stream challan PDF |

### Invoices
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/invoices` | 🔐 Any | List invoices (paginated) |
| GET | `/invoices/:id` | 🔐 Any | Get invoice detail |
| GET | `/invoices/:id/pdf` | 🔐 Any* | Stream invoice PDF |

> *PDF endpoints also accept `?token=<jwt>` query parameter for browser tab access.

---

## 8. Environment Configuration

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/crm_mvp

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5173

# AWS S3 (optional — falls back to local disk storage if not set)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

> **Note**: `DATABASE_URL` is read by `prisma.config.ts` and injected via the `@prisma/adapter-pg` driver. The `schema.prisma` datasource block intentionally has no `url` field (Prisma 7 requirement).

---

## 9. Demo Credentials

After running `npm run db:seed`, the following accounts are available:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@example.com` | `password123` | Full system access |
| **Sales** | `sales@example.com` | `password123` | CRM + Challans |
| **Warehouse** | `warehouse@example.com` | `password123` | Inventory + Stock |
| **Accounts** | `accounts@example.com` | `password123` | Invoices + Financials |

> ⚠️ If you run `npm run test`, the test suite wipes and re-creates the database. Re-run `npm run db:seed` after testing to restore demo accounts.

---

## 10. Local Development Setup

### Prerequisites
- Node.js v18+ (v22 recommended)
- PostgreSQL 15 running locally
- npm v9+

### Backend Setup

```bash
cd backend

# 1. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 2. Install dependencies
npm install

# 3. Run schema migrations
npx prisma migrate dev

# 4. Seed demo data (users, products, customers, challans)
npm run db:seed

# 5. Start dev server (hot-reload via tsx watch)
npm run dev
# → API running at http://localhost:5000
# → Swagger docs at http://localhost:5000/api/docs
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → App running at http://localhost:5173
```

### Available npm Scripts

#### Backend (`backend/`)
| Script | Command | Description |
|---|---|---|
| `npm run dev` | `tsx watch src/index.ts` | Hot-reload dev server |
| `npm run build` | `tsc` | TypeScript compilation |
| `npm run start` | `node dist/index.js` | Run compiled production build |
| `npm run test` | `vitest run` | Run integration test suite |
| `npm run db:migrate` | `prisma migrate dev` | Apply schema migrations |
| `npm run db:seed` | `prisma db seed` | Seed demo data |

#### Frontend (`frontend/`)
| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite` | Vite hot-reload dev server |
| `npm run build` | `tsc -b && vite build` | Production bundle |
| `npm run preview` | `vite preview` | Preview production build |

---

## 11. Production & Docker Deployment

### Docker Compose (Full Stack)

```bash
cd backend
docker compose up --build
```

This spins up three containers:
- `db` — PostgreSQL 15
- `api` — Node.js Express API (port 5000)
- `web` — Nginx serving the React build (port 80)

### Individual Dockerfiles

**Backend** (`backend/Dockerfile`): Multi-stage build — installs deps, compiles TypeScript, runs `node dist/index.js`.

**Frontend** (`frontend/Dockerfile`): Multi-stage build — Vite builds the SPA, then copies `dist/` into an Nginx image.

### Nginx SPA Routing

`frontend/nginx.conf` includes the fallback rule to prevent 404s on React Router page refreshes:

```nginx
location / {
    root   /usr/share/nginx/html;
    index  index.html index.htm;
    try_files $uri $uri/ /index.html;
}
```

---

## 12. Testing

### Integration Test Suite

The backend ships with **14 automated integration tests** covering:

| Category | Tests |
|---|---|
| Authentication & RBAC | Login failure, unauthenticated access, role enforcement |
| Customer CRM Module | Customer creation, email validation |
| Product & Inventory | Product creation, duplicate SKU rejection, negative stock prevention |
| Sales Challan Flow | Challan creation, confirmation + stock deduction, idempotency, insufficient stock rollback |

```bash
cd backend
npm run test
```

Expected output:
```
✓ tests/api.test.ts (14 tests) ~800ms

Test Files  1 passed (1)
     Tests  14 passed (14)
```

> The test suite automatically re-seeds the database after all tests complete, so demo accounts are always restored.

---

## 13. Project Structure

```
backend/src/
├── config/
│   ├── db.ts           ← PrismaClient with @prisma/adapter-pg
│   ├── env.ts          ← Zod-validated environment variables
│   └── logger.ts       ← Winston structured logger
├── middleware/
│   ├── auth.ts         ← JWT authentication + RBAC authorize()
│   ├── errorHandler.ts ← Global Express error handler
│   └── validator.ts    ← Zod request body/query validation
├── modules/
│   ├── auth/           ← Login, /me, user management
│   ├── customers/      ← CRM module + follow-ups
│   ├── products/       ← Catalog + stock adjustments + movements
│   ├── challans/       ← Draft/Confirm/Cancel + PDF
│   └── invoices/       ← Invoice list + PDF
└── utils/
    ├── errors.ts       ← Typed HTTP error classes
    ├── pdf.ts          ← PDFKit document generators
    └── storage.ts      ← Multer/S3 storage adapter

frontend/src/
├── context/
│   └── AuthContext.tsx ← JWT token management + Axios bootstrap
├── components/
│   ├── Layout.tsx      ← App shell with sidebar
│   └── ProtectedRoute.tsx ← Route auth + role guards
└── pages/
    ├── Dashboard.tsx   ← KPI widgets + Recharts analytics
    ├── Login.tsx       ← Auth form + demo quick-login panel
    ├── Customers.tsx   ← CRM directory
    ├── CustomerDetails.tsx ← CRM timeline + follow-ups
    ├── Products.tsx    ← Product catalog
    ├── Inventory.tsx   ← Stock movement ledger
    ├── CreateChallan.tsx ← Challan builder form
    ├── Challans.tsx    ← Challan list
    ├── ChallanDetails.tsx ← Challan view + confirm/cancel + PDF
    ├── Invoices.tsx    ← Invoice list + PDF download
    └── Users.tsx       ← Admin user management
```

---

## License

This project was built as a technical case study demonstration. All code is original.
