# Mini ERP + CRM Operations Portal

A full-stack ERP + CRM operations portal built for wholesale and distribution companies.

The application provides customer relationship management, product and inventory management, sales challans, authentication, role-based access control, and production-ready deployment configuration.

---

## Table of Contents

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
11. [Production Deployment](#11-production-deployment)
12. [Docker Deployment](#12-docker-deployment)
13. [Testing](#13-testing)
14. [Project Structure](#14-project-structure)

---

# 1. Project Overview

This project was developed as a Full Stack Developer case study for a wholesale/distribution business.

The system helps internal teams manage:

- Customers and CRM follow-ups
- Products
- Inventory
- Stock movements
- Sales challans
- User authentication
- Role-based access control

The application is designed around practical business workflows rather than unnecessary complexity.

## Key Engineering Features

- JWT authentication
- bcrypt password hashing
- Role-based authorization
- Zod request validation
- PostgreSQL database
- Prisma ORM
- Atomic stock operations
- Transaction-based challan confirmation
- Product snapshot data in challan items
- Pagination and search
- Centralized error handling
- Responsive React admin interface
- Production environment configuration
- Docker support

---

# 2. Technology Stack

## Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Validation | Zod |
| HTTP Security | Helmet |
| CORS | cors |
| Logging | Morgan |
| Development | tsx |

## Frontend

| Layer | Technology |
|---|---|
| Framework | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| HTTP Client | Axios |
| Forms | React Hook Form |
| Validation | Zod |

## Infrastructure

| Layer | Technology |
|---|---|
| Frontend Hosting | AWS Amplify |
| Backend Hosting | AWS EC2 |
| Database | AWS RDS PostgreSQL |
| Reverse Proxy | Nginx |
| Containerization | Docker |
| Source Control | GitHub |

---

# 3. System Architecture

```text
                         Internet
                            |
                            v
                    AWS Amplify
                    React Frontend
                            |
                            | HTTPS API Requests
                            v
                    AWS EC2 Instance
                  Node.js + Express API
                            |
                            | PostgreSQL
                            v
                    AWS RDS PostgreSQL
````

## Local Architecture

```text
D:\final
|
├── backend/
|   ├── src/
|   ├── prisma/
|   ├── package.json
|   └── Dockerfile
|
├── frontend/
|   ├── src/
|   ├── package.json
|   └── Dockerfile
|
├── .gitignore
└── README.md
```

---

# 4. Database Schema

The application uses PostgreSQL with Prisma.

## Main Entities

```text
User
Customer
CustomerFollowUp
Product
StockMovement
SalesChallan
SalesChallanItem
Invoice
```

## Main Relationships

```text
User
 |
 +---- Customer
 |
 +---- CustomerFollowUp
 |
 +---- StockMovement
 |
 +---- SalesChallan
 |
 +---- Invoice


Customer
 |
 +---- CustomerFollowUp
 |
 +---- SalesChallan
 |
 +---- Invoice


Product
 |
 +---- StockMovement
 |
 +---- SalesChallanItem


SalesChallan
 |
 +---- SalesChallanItem
 |
 +---- Invoice
```

## Important Constraints

* User email is unique.
* Product SKU is unique.
* Challan number is unique.
* Invoice number is unique.
* Product stock cannot become negative.
* Stock quantities must be greater than zero.
* Challan item quantities must be greater than zero.
* Foreign key relationships are enforced by PostgreSQL.
* Challan items store product snapshot information.

## Product Snapshot

When a challan is created, the following product information is copied into `SalesChallanItem`:

```text
productNameSnapshot
skuSnapshot
unitPriceSnapshot
quantity
```

This prevents historical challans from changing when the original product information changes.

---

# 5. Role-Based Access Control

The system contains four roles:

* ADMIN
* SALES
* WAREHOUSE
* ACCOUNTS

## Permission Matrix

| Feature              | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| -------------------- | :---: | :---: | :-------: | :------: |
| Login                |  Yes  |  Yes  |    Yes    |    Yes   |
| Dashboard            |  Yes  |  Yes  |    Yes    |    Yes   |
| View Customers       |  Yes  |  Yes  |     No    |    Yes   |
| Create Customers     |  Yes  |  Yes  |     No    |    No    |
| Edit Customers       |  Yes  |  Yes  |     No    |    No    |
| Delete Customers     |  Yes  |   No  |     No    |    No    |
| View Follow-ups      |  Yes  |  Yes  |     No    |    Yes   |
| Create Follow-ups    |  Yes  |  Yes  |     No    |    No    |
| View Products        |  Yes  |  Yes  |    Yes    |    Yes   |
| Create Products      |  Yes  |   No  |    Yes    |    No    |
| Edit Products        |  Yes  |   No  |    Yes    |    No    |
| View Stock           |  Yes  |  Yes  |    Yes    |    Yes   |
| Adjust Stock         |  Yes  |   No  |    Yes    |    No    |
| View Stock Movements |  Yes  |  Yes  |    Yes    |    Yes   |
| Create Challans      |  Yes  |  Yes  |     No    |    No    |
| Confirm Challans     |  Yes  |  Yes  |     No    |    No    |
| Cancel Challans      |  Yes  |  Yes  |     No    |    No    |
| View Challans        |  Yes  |  Yes  |     No    |    Yes   |
| View Invoices        |  Yes  |  Yes  |     No    |    Yes   |
| User Management      |  Yes  |   No  |     No    |    No    |

Permissions are enforced at both levels:

1. Backend API authorization middleware
2. Frontend protected routes and navigation

Frontend visibility is not treated as the security boundary.

---

# 6. Feature Modules

## Authentication

* Login
* JWT authentication
* Password hashing with bcrypt
* `/api/auth/me`
* Role-based authorization
* Protected API routes
* Centralized authentication errors

## Customer CRM

* Customer list
* Customer search
* Pagination
* Customer creation
* Customer editing
* Customer details
* Customer deletion
* Follow-up notes
* Follow-up dates

Search supports:

* Customer name
* Mobile number
* Business name
* Email

## Products

* Product list
* Product search
* Pagination
* Product creation
* Product editing
* Product details
* Unique SKU validation
* Low-stock detection

## Inventory

* Stock IN
* Stock OUT
* Stock movement history
* Stock quantity validation
* Insufficient stock protection
* Stock movement audit trail

Stock status is determined using:

```text
currentStock <= minimumStock
```

## Sales Challans

Challan lifecycle:

```text
DRAFT
  |
  v
CONFIRMED
```

or:

```text
DRAFT
  |
  v
CANCELLED
```

Important business rules:

* Draft challans do not reduce stock.
* Confirmed challans reduce stock.
* Cancelled challans do not reduce stock.
* Stock can never become negative.
* Confirmation validates every product before modifying stock.
* Confirmation uses a database transaction.
* If any product has insufficient stock, the complete transaction is rolled back.
* OUT stock movements are created during successful confirmation.
* Duplicate confirmation is prevented.
* Product snapshot information is stored in challan items.

---

# 7. API Reference

All APIs are prefixed with:

```text
/api
```

Protected routes require:

```text
Authorization: Bearer <JWT_TOKEN>
```

## Authentication

| Method | Endpoint          | Access        | Description  |
| ------ | ----------------- | ------------- | ------------ |
| POST   | `/api/auth/login` | Public        | Login        |
| GET    | `/api/auth/me`    | Authenticated | Current user |

## Customers

| Method | Endpoint                       | Access                   |
| ------ | ------------------------------ | ------------------------ |
| GET    | `/api/customers`               | ADMIN / SALES / ACCOUNTS |
| POST   | `/api/customers`               | ADMIN / SALES            |
| GET    | `/api/customers/:id`           | ADMIN / SALES / ACCOUNTS |
| PUT    | `/api/customers/:id`           | ADMIN / SALES            |
| DELETE | `/api/customers/:id`           | ADMIN                    |
| GET    | `/api/customers/:id/followups` | ADMIN / SALES / ACCOUNTS |
| POST   | `/api/customers/:id/followups` | ADMIN / SALES            |

## Products

| Method | Endpoint            | Access            |
| ------ | ------------------- | ----------------- |
| GET    | `/api/products`     | Authenticated     |
| POST   | `/api/products`     | ADMIN / WAREHOUSE |
| GET    | `/api/products/:id` | Authenticated     |
| PUT    | `/api/products/:id` | ADMIN / WAREHOUSE |

## Inventory

| Method | Endpoint                            | Access            |
| ------ | ----------------------------------- | ----------------- |
| GET    | `/api/products/:id/stock-movements` | Authenticated     |
| POST   | `/api/products/:id/stock-in`        | ADMIN / WAREHOUSE |
| POST   | `/api/products/:id/stock-out`       | ADMIN / WAREHOUSE |

## Challans

| Method | Endpoint                    | Access        |
| ------ | --------------------------- | ------------- |
| GET    | `/api/challans`             | Authenticated |
| POST   | `/api/challans`             | ADMIN / SALES |
| GET    | `/api/challans/:id`         | Authenticated |
| PUT    | `/api/challans/:id`         | ADMIN / SALES |
| POST   | `/api/challans/:id/confirm` | ADMIN / SALES |
| POST   | `/api/challans/:id/cancel`  | ADMIN / SALES |

---

# 8. Environment Configuration

Environment variables are not committed to Git.

The repository contains `.env.example` files as templates.

## Backend Environment

Create:

```text
backend/.env
```

Example:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_mvp"

JWT_SECRET="your-long-random-secret"
JWT_EXPIRES_IN="1d"

CORS_ORIGIN="http://localhost:5173"
```

For production:

```env
NODE_ENV=production
PORT=5000

DATABASE_URL="postgresql://postgresadmin:PASSWORD@RDS_ENDPOINT:5432/crm_mvp?sslmode=require"

JWT_SECRET="your-production-random-secret"
JWT_EXPIRES_IN="1d"

CORS_ORIGIN="https://YOUR-AMPLIFY-DOMAIN.amplifyapp.com"
```

Never commit:

```text
.env
database passwords
JWT secrets
AWS credentials
private keys
```

## Frontend Environment

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

Production:

```env
VITE_API_URL=https://YOUR-EC2-API-DOMAIN/api
```

The frontend should never contain database credentials or JWT signing secrets.

---

# 9. Demo Credentials

Development seed users can be created using the Prisma seed script.

Example development credentials:

| Role      | Email                                             | Password                  |
| --------- | ------------------------------------------------- | ------------------------- |
| ADMIN     | [admin@crm.local](mailto:admin@crm.local)         | Development seed password |
| SALES     | [sales@crm.local](mailto:sales@crm.local)         | Development seed password |
| WAREHOUSE | [warehouse@crm.local](mailto:warehouse@crm.local) | Development seed password |
| ACCOUNTS  | [accounts@crm.local](mailto:accounts@crm.local)   | Development seed password |

These credentials are for development/testing only.

Production passwords must be changed and must not be hardcoded into application source code.

---

# 10. Local Development Setup

## Prerequisites

* Node.js
* npm
* PostgreSQL
* Git

## Backend

```bash
cd backend
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

Configure:

```env
DATABASE_URL=...
JWT_SECRET=...
JWT_EXPIRES_IN=1d
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Seed development data:

```bash
npx prisma db seed
```

Start backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

## Frontend

```bash
cd frontend
npm install
```

Create:

```env
VITE_API_URL=http://localhost:5000/api
```

Start:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 11. Production Deployment

Target AWS architecture:

```text
React
  |
  v
AWS Amplify
  |
  | HTTPS
  v
AWS EC2
Node.js + Express
  |
  | PostgreSQL
  v
AWS RDS
```

## AWS RDS

Create a PostgreSQL RDS database.

Configure:

* PostgreSQL engine
* Database name
* Master username
* Strong master password
* Appropriate VPC
* Security group

Allow inbound PostgreSQL traffic on port:

```text
5432
```

The recommended source is the EC2 security group rather than opening PostgreSQL to the public internet.

## EC2

Create an EC2 instance for the backend.

Install:

```bash
git
node
npm
nginx
```

Clone the project:

```bash
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>/backend
```

Install production dependencies:

```bash
npm ci
```

Generate Prisma Client:

```bash
npx prisma generate
```

Configure the production `.env` with the RDS connection string.

Apply production migrations:

```bash
npx prisma migrate deploy
```

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

For a production server, use a process manager such as PM2 or a Docker container so the application can restart automatically.

## Nginx

Nginx can run on the EC2 instance in front of the Node.js API.

Example:

```text
Internet
   |
   v
Nginx :80/:443
   |
   v
Node.js :5000
   |
   v
RDS PostgreSQL
```

Nginx can handle:

* HTTP to HTTPS redirect
* TLS termination
* Reverse proxying
* API domain routing

---

# 12. Docker Deployment

## Backend Docker Build

Build the backend image:

```bash
cd backend
docker build -t funds-crm-backend .
```

The production image should build the TypeScript application and generate Prisma Client.

Do not place production secrets directly inside the Dockerfile.

Provide environment variables at runtime.

Example:

```bash
docker run \
  --env-file .env \
  -p 5000:5000 \
  funds-crm-backend
```

## Prisma in Docker

Prisma 7 uses `prisma.config.ts` for the database connection configuration.

The Prisma schema datasource should not contain:

```prisma
url = env("DATABASE_URL")
```

Instead, the database URL is configured through `prisma.config.ts`.

Example:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url: process.env.DATABASE_URL || "",
  },
});
```

Production migrations:

```bash
npx prisma migrate deploy
```

Do not use:

```bash
npx prisma migrate dev
```

against the production RDS database.

Do not use:

```bash
npx prisma db push
```

for production schema management.

## Frontend

Build:

```bash
cd frontend
npm run build
```

The generated production files are located in:

```text
frontend/dist/
```

AWS Amplify can build and host the React application.

Configure:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

---

# 13. Testing

## Backend Build

```bash
cd backend
npm run build
```

## Frontend Build

```bash
cd frontend
npm run build
```

## Prisma Validation

```bash
cd backend
npx prisma validate
```

## Prisma Migration Status

```bash
npx prisma migrate status
```

## Tests

If tests are configured:

```bash
npm test
```

Important scenarios to test:

* Login success
* Invalid login
* Protected routes
* Role authorization
* Customer CRUD
* Customer search
* Customer pagination
* Product CRUD
* Duplicate SKU
* Stock IN
* Stock OUT
* Insufficient stock
* Challan creation
* Challan confirmation
* Stock deduction
* Stock movement creation
* Insufficient stock rollback
* Duplicate confirmation
* Challan cancellation

---

# 14. Project Structure

```text
final/
|
├── backend/
│   |
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   └── challans/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── prisma.config.ts
│
├── frontend/
│   |
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

---

# Git Safety

The following files must never be committed:

```text
.env
.env.local
.env.production
*.pem
*.key
AWS credentials
database passwords
JWT secrets
```

The following should be committed:

```text
.env.example
prisma/schema.prisma
prisma/migrations/
package.json
package-lock.json
Dockerfile
README.md
source code
```

---

# Production Verification Checklist

Before deployment:

```bash
# Backend
cd backend
npm ci
npx prisma generate
npx prisma validate
npm run build

# Frontend
cd ../frontend
npm ci
npm run build
```

On EC2:

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Verify:

```text
Frontend loads successfully
API responds successfully
Login works
JWT authentication works
Role authorization works
RDS connection works
Customer APIs work
Product APIs work
Inventory APIs work
Challan confirmation works
Stock deduction works
CORS allows only the configured frontend origin
```

---

# License

This project was built as a technical case study demonstration.
