# 🚀 Deployment Guide — Mini ERP + CRM Operations Portal

This guide covers four deployment strategies, from the simplest (Docker Compose on a VPS) to managed cloud platforms.

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Option A — Docker Compose on a VPS (Ubuntu)](#2-option-a--docker-compose-on-a-vps-ubuntu)
3. [Option B — Railway (Managed Cloud, Free Tier)](#3-option-b--railway-managed-cloud-free-tier)
4. [Option C — Render (Managed Cloud, Free Tier)](#4-option-c--render-managed-cloud-free-tier)
5. [Option D — AWS EC2 + RDS (Production Grade)](#5-option-d--aws-ec2--rds-production-grade)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Post-Deployment Steps](#7-post-deployment-steps)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Pre-Deployment Checklist

Before deploying to any platform, make sure you have:

- [ ] A PostgreSQL database provisioned (local Docker, Railway, Supabase, Neon, RDS, etc.)
- [ ] A `DATABASE_URL` connection string ready
- [ ] A strong `JWT_SECRET` (minimum 32 random characters)
- [ ] The frontend `VITE_API_URL` environment variable pointing to your deployed backend URL
- [ ] Docker installed (for Options A and D)

### Generate a strong JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 2. Option A — Docker Compose on a VPS (Ubuntu)

**Best for**: Full control, self-hosted, cheapest long-term cost.  
**Requirements**: A VPS with Docker installed (DigitalOcean Droplet, Hetzner, Linode, etc.)

### Step 1 — Provision and SSH into the server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 2 — Install Docker and Docker Compose

```bash
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin
docker --version   # verify
```

### Step 3 — Clone the repository

```bash
git clone https://github.com/Surbhi-Gohil8/fundsroom-Infotech-case-study.git
cd fundsroom-Infotech-case-study/backend
```

### Step 4 — Create the production `.env` file

```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@db:5432/crm_prod
JWT_SECRET=REPLACE_WITH_64_CHAR_RANDOM_HEX
JWT_EXPIRES_IN=7d
CLIENT_URL=http://YOUR_SERVER_IP
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
EOF
```

> ⚠️ Replace `STRONG_PASSWORD`, `REPLACE_WITH_64_CHAR_RANDOM_HEX`, and `YOUR_SERVER_IP` with real values.

### Step 5 — Review `docker-compose.yml`

The included `backend/docker-compose.yml` orchestrates three services:

```yaml
services:
  db:        # PostgreSQL 15
  api:       # Express backend (port 5000)
  web:       # React frontend on Nginx (port 80)
```

### Step 6 — Build and launch

```bash
docker compose up --build -d
```

### Step 7 — Run migrations and seed

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run db:seed
```

### Step 8 — Verify

```bash
docker compose ps            # all three containers should be Up
curl http://localhost:5000/api/health   # should return { "status": "ok" }
```

Open `http://YOUR_SERVER_IP` in your browser. ✅

### Updating after a code change

```bash
git pull
docker compose up --build -d
docker compose exec api npx prisma migrate deploy
```

---

## 3. Option B — Railway (Managed Cloud, Free Tier)

**Best for**: Quickest zero-config deployment with a free managed PostgreSQL.  
**URL**: https://railway.app

### Step 1 — Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → select `fundsroom-Infotech-case-study`

### Step 2 — Add a PostgreSQL database

1. Inside your project → **Add Service** → **Database** → **PostgreSQL**
2. Railway auto-generates a `DATABASE_URL` — copy it from the **Variables** tab.

### Step 3 — Configure the backend service

1. Click on the **backend** service → **Settings**
2. Set **Root Directory** to `backend`
3. Set **Build Command**: `npm ci && npx prisma generate && npm run build`
4. Set **Start Command**: `npx prisma migrate deploy && node dist/index.js`

### Step 4 — Add environment variables

In the **Variables** tab of the backend service, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | (paste from PostgreSQL service) |
| `JWT_SECRET` | (64-char random hex) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `CLIENT_URL` | (your frontend Railway URL, set after frontend deploys) |

### Step 5 — Deploy the frontend service

1. **Add Service** → **GitHub Repo** → same repo
2. **Root Directory**: `frontend`
3. **Build Command**: `npm ci && npm run build`
4. Set environment variable:

| Variable | Value |
|---|---|
| `VITE_API_URL` | (your backend Railway URL, e.g. `https://api.railway.app`) |

> **Note**: Update `CLIENT_URL` in the backend service with the frontend URL after it deploys.

### Step 6 — Seed demo data (one-time)

In Railway → backend service → **Shell**:

```bash
npm run db:seed
```

---

## 4. Option C — Render (Managed Cloud, Free Tier)

**Best for**: Simple managed deployment with free PostgreSQL and web services.  
**URL**: https://render.com

### Step 1 — Create a PostgreSQL database

1. Render Dashboard → **New** → **PostgreSQL**
2. Choose free tier → **Create Database**
3. Copy the **Internal Database URL**

### Step 2 — Deploy the backend (Web Service)

1. **New** → **Web Service** → connect GitHub repo
2. Set **Root Directory**: `backend`
3. **Build Command**:
   ```
   npm ci && npx prisma generate && npm run build
   ```
4. **Start Command**:
   ```
   npx prisma migrate deploy && node dist/index.js
   ```
5. Add **Environment Variables**:

| Key | Value |
|---|---|
| `DATABASE_URL` | (Internal Database URL from Step 1) |
| `JWT_SECRET` | (64-char random hex) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | (your frontend Render URL) |

### Step 3 — Deploy the frontend (Static Site)

1. **New** → **Static Site** → connect GitHub repo
2. **Root Directory**: `frontend`
3. **Build Command**: `npm ci && npm run build`
4. **Publish Directory**: `frontend/dist`
5. Add **Environment Variable**:

| Key | Value |
|---|---|
| `VITE_API_URL` | (your backend Render URL) |

6. Add a **Redirect/Rewrite Rule** for SPA routing:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite

### Step 4 — Seed demo data (one-time)

In Render → backend service → **Shell**:

```bash
npm run db:seed
```

---

## 5. Option D — AWS EC2 + RDS (Production Grade)

**Best for**: Scalable, enterprise-grade production deployment.

### Architecture

```
Internet → ALB (port 443) → EC2 (Nginx + Docker) → Express API (port 5000)
                                                   → React SPA (port 80)
                         → RDS PostgreSQL (port 5432, private VPC)
```

### Step 1 — Provision RDS PostgreSQL

```bash
# Via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier crm-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username postgres \
  --master-user-password STRONG_PASSWORD \
  --allocated-storage 20 \
  --no-publicly-accessible \
  --vpc-security-group-ids sg-XXXXXXXX
```

Copy the **Endpoint** from the RDS console for your `DATABASE_URL`.

### Step 2 — Launch EC2 instance

- **AMI**: Ubuntu 22.04 LTS
- **Instance type**: `t3.small` or larger
- **Security Group**:
  - Inbound: port 22 (SSH), port 80 (HTTP), port 443 (HTTPS)
  - Outbound: all traffic

### Step 3 — Install dependencies on EC2

```bash
ssh ubuntu@YOUR_EC2_IP

# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# Nginx (for SSL termination)
apt-get install -y nginx certbot python3-certbot-nginx
```

### Step 4 — Clone and configure

```bash
git clone https://github.com/Surbhi-Gohil8/fundsroom-Infotech-case-study.git
cd fundsroom-Infotech-case-study/backend
cp .env.example .env
# Edit .env with your RDS endpoint and JWT_SECRET
nano .env
```

### Step 5 — Build and run containers

```bash
docker compose up --build -d
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run db:seed
```

### Step 6 — Configure Nginx with SSL

```nginx
# /etc/nginx/sites-available/erp-crm
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/erp-crm /etc/nginx/sites-enabled/
certbot --nginx -d yourdomain.com    # auto provisions SSL cert
nginx -t && systemctl reload nginx
```

---

## 6. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | ✅ | Runtime environment | `production` |
| `PORT` | ✅ | API server port | `5000` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | JWT signing key (≥32 chars) | `a8f3...` (64 hex chars) |
| `JWT_EXPIRES_IN` | ✅ | Token expiry duration | `7d` |
| `CLIENT_URL` | ✅ | Frontend URL for CORS | `https://yourdomain.com` |
| `AWS_REGION` | ☑️ Optional | S3 region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | ☑️ Optional | S3 access key | — |
| `AWS_SECRET_ACCESS_KEY` | ☑️ Optional | S3 secret key | — |
| `AWS_S3_BUCKET` | ☑️ Optional | S3 bucket name | — |

> If AWS variables are empty, product images fall back to local disk storage (`backend/uploads/`).

### Frontend

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL | `https://api.yourdomain.com` |

---

## 7. Post-Deployment Steps

After any deployment, always run these in order:

```bash
# 1. Apply any pending schema migrations
npx prisma migrate deploy

# 2. Seed demo data (first time only)
npm run db:seed
```

### Demo Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `password123` |
| Sales | `sales@example.com` | `password123` |
| Warehouse | `warehouse@example.com` | `password123` |
| Accounts | `accounts@example.com` | `password123` |

> ⚠️ **Important**: Change these passwords immediately after first login in a production deployment.

---

## 8. Troubleshooting

### `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`

The `DATABASE_URL` environment variable is missing. Make sure it is set in your deployment platform's environment variables section **before** the build/start command runs.

### `PrismaClientInitializationError: A driver adapter is required`

This project uses Prisma 7 with `@prisma/adapter-pg`. Do **not** instantiate `new PrismaClient()` directly — always import the configured instance from `src/config/db.ts`.

### Frontend shows blank page after refresh

Add a rewrite rule so all routes serve `index.html`:
- **Render**: Add redirect rule `/* → /index.html` (Rewrite)
- **Nginx**: Add `try_files $uri $uri/ /index.html;`
- **AWS S3/CloudFront**: Set the error document to `index.html`

### CORS errors from frontend

Ensure `CLIENT_URL` in the backend `.env` exactly matches the frontend's origin URL (including `https://` and no trailing slash).

### Container health check fails

```bash
docker compose logs api     # view API logs
docker compose logs db      # view database logs
docker compose exec api npx prisma migrate status   # check migration state
```

### Checking live logs on the server

```bash
docker compose logs -f api   # tail backend logs in real time
```
