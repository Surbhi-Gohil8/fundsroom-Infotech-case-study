import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import bcrypt from 'bcrypt';
import { Role, CustomerType, CustomerStatus } from '@prisma/client';
import { execSync } from 'child_process';

let adminToken: string;
let salesToken: string;
let warehouseToken: string;
let customerId: string;
let productId: string;
let challanId: string;

beforeAll(async () => {
  // Clean up existing test data
  await prisma.invoice.deleteMany();
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed test users
  const adminUser = await prisma.user.create({
    data: { name: 'Test Admin', email: 'admin-test@example.com', passwordHash, role: Role.ADMIN },
  });
  const salesUser = await prisma.user.create({
    data: { name: 'Test Sales', email: 'sales-test@example.com', passwordHash, role: Role.SALES },
  });
  const warehouseUser = await prisma.user.create({
    data: { name: 'Test Warehouse', email: 'warehouse-test@example.com', passwordHash, role: Role.WAREHOUSE },
  });

  // Login to get tokens
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-test@example.com', password: 'password123' });
  adminToken = adminLogin.body.data.token;

  const salesLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sales-test@example.com', password: 'password123' });
  salesToken = salesLogin.body.data.token;

  const warehouseLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'warehouse-test@example.com', password: 'password123' });
  warehouseToken = warehouseLogin.body.data.token;
});

afterAll(async () => {
  // Restore demo seed data so the app is usable after running tests
  try {
    execSync('npx prisma db seed', { stdio: 'ignore', cwd: process.cwd() });
  } catch {
    // Seed errors are non-fatal for test results
  }
  await prisma.$disconnect();
});

describe('1. Authentication and RBAC', () => {
  it('Login success with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('Login failed with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Denies access to non-authenticated request on protected routes', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
  });

  it('Enforces RBAC: Warehouse user cannot create customers', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        customerName: 'Illegal Cust',
        mobile: '1234567890',
        email: 'illegal@cust.com',
        businessName: 'Illegal Business',
        customerType: CustomerType.RETAIL,
        address: 'Illegal Street',
        notes: ''
      });

    expect(res.status).toBe(403);
  });
});

describe('2. Customer CRM Module', () => {
  it('Creates a customer successfully under Sales user', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerName: 'John CRM',
        mobile: '9876543210',
        email: 'john@crm.com',
        businessName: 'John CRM Enterprises',
        gstNumber: '07AAAAA1111A1Z1',
        customerType: CustomerType.WHOLESALE,
        address: 'Sector 62, Noida',
        notes: 'Needs product quotes'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    customerId = res.body.data.id;
  });

  it('Validates email formatting on customer creation', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerName: 'Invalid Mail',
        mobile: '9876543210',
        email: 'invalidmail',
        businessName: 'No Mail Store',
        customerType: CustomerType.RETAIL,
        address: 'Noida',
        notes: ''
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('3. Product and Inventory Module', () => {
  it('Creates a product successfully', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'HP Elitebook Laptop',
        sku: 'HP-ELITE-01',
        category: 'Electronics',
        unitPrice: 75000.0,
        currentStock: 10,
        minimumStock: 3,
        warehouseLocation: 'A-05',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    productId = res.body.data.id;
  });

  it('Rejects product creation with duplicate SKU', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'HP Laptop Clone',
        sku: 'HP-ELITE-01',
        category: 'Electronics',
        unitPrice: 60000.0,
        currentStock: 5,
        minimumStock: 2,
        warehouseLocation: 'A-05',
      });

    expect(res.status).toBe(409);
  });

  it('Warehouse user records stock IN successfully', async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/stock`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        quantity: 5,
        movementType: 'IN',
        reason: 'Purchase Receipt PR-100',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.currentStock).toBe(15);
  });

  it('Rejects manual stock OUT exceeding current stock (Negative Stock Prevention)', async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/stock`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        quantity: 20,
        movementType: 'OUT',
        reason: 'Manual adjustment',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });
});

describe('4. Sales Challan Flow', () => {
  it('Creates a draft challan and verifies stock is UNCHANGED', async () => {
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId,
        items: [
          { productId, quantity: 5 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    challanId = res.body.data.id;

    // Verify stock is still 15
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.currentStock).toBe(15);
  });

  it('Confirms challan, reduces stock, and verifies snapshot preservation', async () => {
    const res = await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify stock reduced to 10
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.currentStock).toBe(10);

    // Verify snapshot fields preserved
    const challan = await prisma.salesChallan.findUnique({
      where: { id: challanId },
      include: { items: true }
    });
    expect(challan?.status).toBe('CONFIRMED');
    expect(challan?.items[0].productNameSnapshot).toBe('HP Elitebook Laptop');
    expect(challan?.items[0].skuSnapshot).toBe('HP-ELITE-01');
    expect(challan?.items[0].unitPriceSnapshot).toBe(75000.0);
  });

  it('Rejects confirmation on an already confirmed challan (Idempotency check)', async () => {
    const res = await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CHALLAN_ALREADY_CONFIRMED');
  });

  it('Insufficient stock rejects confirmation and rolls back', async () => {
    // 1. Create a draft challan requesting 12 laptops (we only have 10)
    const draftRes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId,
        items: [
          { productId, quantity: 12 }
        ]
      });

    const failedChallanId = draftRes.body.data.id;

    // 2. Try to confirm, should fail due to stock
    const confirmRes = await request(app)
      .post(`/api/challans/${failedChallanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(confirmRes.status).toBe(409);
    expect(confirmRes.body.error.code).toBe('INSUFFICIENT_STOCK');

    // 3. Verify stock remains at 10 (rolled back)
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.currentStock).toBe(10);
  });
});
