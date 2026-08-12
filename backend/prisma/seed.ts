import { Role, CustomerType, CustomerStatus, StockMovementType, ChallanStatus } from '@prisma/client';
import { prisma } from '../src/config/db.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');
  
  await prisma.invoice.deleteMany();
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@example.com', passwordHash, role: Role.ADMIN },
  });
  const sales = await prisma.user.create({
    data: { name: 'Sales Rep', email: 'sales@example.com', passwordHash, role: Role.SALES },
  });
  const warehouse = await prisma.user.create({
    data: { name: 'Warehouse Mgr', email: 'warehouse@example.com', passwordHash, role: Role.WAREHOUSE },
  });
  const accounts = await prisma.user.create({
    data: { name: 'Accounts Officer', email: 'accounts@example.com', passwordHash, role: Role.ACCOUNTS },
  });

  console.log('Seeded Users: admin, sales, warehouse, accounts.');

  const products = [
    { name: 'Dell XPS 13 Laptop', sku: 'DELL-XPS13-01', category: 'Electronics', unitPrice: 95000.0, currentStock: 25, minimumStock: 5, warehouseLocation: 'A-12' },
    { name: 'Logitech MX Master 3', sku: 'LOGI-MXM3-02', category: 'Accessories', unitPrice: 8500.0, currentStock: 50, minimumStock: 10, warehouseLocation: 'B-04' },
    { name: 'Sony WH-1000XM4 Headphones', sku: 'SONY-WH4-03', category: 'Audio', unitPrice: 24000.0, currentStock: 15, minimumStock: 5, warehouseLocation: 'A-08' },
    { name: 'Samsung 32" 4K Monitor', sku: 'SAMS-4K32-04', category: 'Electronics', unitPrice: 35000.0, currentStock: 8, minimumStock: 3, warehouseLocation: 'C-01' },
    { name: 'Apple iPad Air (64GB)', sku: 'APPL-IPADA-05', category: 'Electronics', unitPrice: 54000.0, currentStock: 12, minimumStock: 4, warehouseLocation: 'A-15' },
    { name: 'Mechanical Keyboard (Red Switches)', sku: 'MECH-KBRD-06', category: 'Accessories', unitPrice: 4500.0, currentStock: 4, minimumStock: 8, warehouseLocation: 'B-09' },
    { name: 'Ergonomic Office Chair', sku: 'ERGO-CHAIR-07', category: 'Furniture', unitPrice: 18000.0, currentStock: 2, minimumStock: 3, warehouseLocation: 'W-01' },
    { name: 'USB-C Hub 8-in-1', sku: 'USBC-HUB-08', category: 'Accessories', unitPrice: 3200.0, currentStock: 45, minimumStock: 15, warehouseLocation: 'B-12' },
    { name: 'HDMI Cable 3m', sku: 'HDMI-3M-09', category: 'Accessories', unitPrice: 650.0, currentStock: 120, minimumStock: 20, warehouseLocation: 'B-15' },
    { name: 'Hard Drive 2TB External', sku: 'HDD-2TB-10', category: 'Storage', unitPrice: 6200.0, currentStock: 0, minimumStock: 5, warehouseLocation: 'D-02' },
    { name: 'Solid State Drive 1TB M.2', sku: 'SSD-1TB-11', category: 'Storage', unitPrice: 8500.0, currentStock: 30, minimumStock: 10, warehouseLocation: 'D-05' },
    { name: 'Laptop Stand Aluminum', sku: 'STAND-AL-12', category: 'Accessories', unitPrice: 1800.0, currentStock: 3, minimumStock: 5, warehouseLocation: 'B-02' },
    { name: 'Webcam 1080p HD', sku: 'CAM-HD108-13', category: 'Accessories', unitPrice: 4200.0, currentStock: 18, minimumStock: 5, warehouseLocation: 'C-08' },
    { name: 'Wireless Charging Pad', sku: 'WIRE-CHRG-14', category: 'Accessories', unitPrice: 1500.0, currentStock: 0, minimumStock: 5, warehouseLocation: 'B-10' },
    { name: 'Office Desk Organizer', sku: 'DESK-ORG-15', category: 'Furniture', unitPrice: 1200.0, currentStock: 40, minimumStock: 5, warehouseLocation: 'W-05' },
    { name: 'Standing Desk Converter', sku: 'DESK-CONV-16', category: 'Furniture', unitPrice: 15000.0, currentStock: 5, minimumStock: 2, warehouseLocation: 'W-08' },
    { name: 'Power Strip Surge Protector', sku: 'PWR-SURG-17', category: 'Accessories', unitPrice: 950.0, currentStock: 75, minimumStock: 10, warehouseLocation: 'B-20' },
    { name: 'Gel Wrist Rest Pad', sku: 'GEL-WRIST-18', category: 'Accessories', unitPrice: 800.0, currentStock: 35, minimumStock: 5, warehouseLocation: 'B-01' },
    { name: 'Bluetooth Dongle 5.0', sku: 'BLUE-50-19', category: 'Accessories', unitPrice: 450.0, currentStock: 150, minimumStock: 15, warehouseLocation: 'C-02' },
    { name: 'Ethernet Cable 10m Cat6', sku: 'ETH-10M-20', category: 'Accessories', unitPrice: 850.0, currentStock: 60, minimumStock: 10, warehouseLocation: 'B-22' },
  ];

  const dbProducts = [];
  for (const prod of products) {
    const created = await prisma.product.create({ data: prod });
    dbProducts.push(created);

    if (created.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          quantityChanged: created.currentStock,
          movementType: StockMovementType.IN,
          reason: 'Initial opening stock',
          createdBy: admin.id,
        }
      });
    }
  }
  console.log('Seeded 20 Products.');

  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

  const customers = [
    { customerName: 'Aman Sharma', mobile: '9876543210', email: 'aman@sharmaretails.com', businessName: 'Sharma Retail Outlets', gstNumber: '07AAAAA1111A1Z1', customerType: CustomerType.RETAIL, address: 'Connaught Place, New Delhi', status: CustomerStatus.ACTIVE, followUpDate: tomorrow, notes: 'Follow up on order confirmation' },
    { customerName: 'Rajesh Patel', mobile: '9123456789', email: 'rajesh@pateldist.com', businessName: 'Patel Distribution Systems', gstNumber: '24BBBBB2222B2Z2', customerType: CustomerType.DISTRIBUTOR, address: 'SG Highway, Ahmedabad', status: CustomerStatus.ACTIVE, followUpDate: null, notes: 'Prefers bulk delivery on weekends' },
    { customerName: 'Priya Nair', mobile: '9812345670', email: 'priya@nairventures.com', businessName: 'Nair Tech Solutions', gstNumber: '32CCCCC3333C3Z3', customerType: CustomerType.WHOLESALE, address: 'Kakkanad, Kochi', status: CustomerStatus.ACTIVE, followUpDate: yesterday, notes: 'Follow up overdue! Urgently check pricing requirements.' },
    { customerName: 'Vikram Singh', mobile: '9456789123', email: 'vikram@singhelectronics.com', businessName: 'Singh Electronics Store', gstNumber: '08DDDDD4444D4Z4', customerType: CustomerType.RETAIL, address: 'MI Road, Jaipur', status: CustomerStatus.LEAD, followUpDate: today, notes: 'First contact made. Needs catalog.' },
    { customerName: 'Neha Gupta', mobile: '9988776655', email: 'neha@guptastores.com', businessName: 'Gupta & Sons General Store', gstNumber: '09EEEEE5555E5Z5', customerType: CustomerType.RETAIL, address: 'Hazratganj, Lucknow', status: CustomerStatus.LEAD, followUpDate: nextWeek, notes: 'Interested in office furniture models' },
    { customerName: 'Amit Verma', mobile: '9345678901', email: 'amit@vermatraders.com', businessName: 'Verma Wholesale Traders', gstNumber: null, customerType: CustomerType.WHOLESALE, address: 'Chandni Chowk, Delhi', status: CustomerStatus.ACTIVE, followUpDate: null, notes: 'Regular buyer, pays within 15 days' },
    { customerName: 'Sanjay Dutt', mobile: '9210987654', email: 'sanjay@duttcorp.com', businessName: 'Dutt Enterprises', gstNumber: '27FFFFF6666F6Z6', customerType: CustomerType.DISTRIBUTOR, address: 'Andheri West, Mumbai', status: CustomerStatus.INACTIVE, followUpDate: null, notes: 'Closed account due to relocation' },
    { customerName: 'Karan Johar', mobile: '9555666777', email: 'karan@dharmaretails.com', businessName: 'Dharma Retail Emporium', gstNumber: '27GGGGG7777G7Z7', customerType: CustomerType.RETAIL, address: 'Bandra, Mumbai', status: CustomerStatus.ACTIVE, followUpDate: tomorrow, notes: 'Send quotes for mechanical keyboards' },
    { customerName: 'Ritu Phogat', mobile: '9666777888', email: 'ritu@phogatsports.com', businessName: 'Phogat Sports Academy', gstNumber: null, customerType: CustomerType.RETAIL, address: 'Rohtak, Haryana', status: CustomerStatus.LEAD, followUpDate: today, notes: 'Requires quotes for ergonomic chairs' },
    { customerName: 'John Doe', mobile: '9998887776', email: 'john@doeenterprises.com', businessName: 'Doe Global Logistics', gstNumber: '19HHHHH8888H8Z8', customerType: CustomerType.DISTRIBUTOR, address: 'Salt Lake, Kolkata', status: CustomerStatus.ACTIVE, followUpDate: null, notes: 'Partnership account' },
  ];

  const dbCustomers = [];
  for (const cust of customers) {
    const created = await prisma.customer.create({
      data: {
        ...cust,
        createdBy: sales.id,
      }
    });
    dbCustomers.push(created);

    if (cust.notes) {
      await prisma.customerFollowUp.create({
        data: {
          customerId: created.id,
          note: `Initial Note: ${cust.notes}`,
          followUpDate: cust.followUpDate || today,
          createdBy: sales.id,
          createdAt: yesterday,
        }
      });
    }
  }
  console.log('Seeded 10 Customers and Follow-Up logs.');

  const confirmedChallan = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0001',
      customerId: dbCustomers[0].id,
      totalQuantity: 3,
      status: ChallanStatus.CONFIRMED,
      createdBy: sales.id,
      confirmedAt: yesterday,
      items: {
        create: [
          {
            productId: dbProducts[0].id,
            productNameSnapshot: dbProducts[0].name,
            skuSnapshot: dbProducts[0].sku,
            unitPriceSnapshot: dbProducts[0].unitPrice,
            quantity: 1,
            totalPrice: dbProducts[0].unitPrice * 1,
          },
          {
            productId: dbProducts[1].id,
            productNameSnapshot: dbProducts[1].name,
            skuSnapshot: dbProducts[1].sku,
            unitPriceSnapshot: dbProducts[1].unitPrice,
            quantity: 2,
            totalPrice: dbProducts[1].unitPrice * 2,
          }
        ]
      }
    },
    include: { items: true }
  });

  for (const item of confirmedChallan.items) {
    await prisma.product.update({
      where: { id: item.productId! },
      data: { currentStock: { decrement: item.quantity } }
    });

    await prisma.stockMovement.create({
      data: {
        productId: item.productId!,
        quantityChanged: item.quantity,
        movementType: StockMovementType.OUT,
        reason: `Sales Challan Confirmation (CH-2026-0001)`,
        createdBy: sales.id,
        createdAt: yesterday,
      }
    });
  }

  const subtotal = confirmedChallan.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      challanId: confirmedChallan.id,
      customerId: confirmedChallan.customerId,
      subtotal,
      tax,
      total,
      status: 'UNPAID',
      createdBy: admin.id,
      createdAt: yesterday,
    }
  });

  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0002',
      customerId: dbCustomers[1].id,
      totalQuantity: 3,
      status: ChallanStatus.DRAFT,
      createdBy: sales.id,
      items: {
        create: [
          {
            productId: dbProducts[2].id,
            productNameSnapshot: dbProducts[2].name,
            skuSnapshot: dbProducts[2].sku,
            unitPriceSnapshot: dbProducts[2].unitPrice,
            quantity: 2,
            totalPrice: dbProducts[2].unitPrice * 2,
          },
          {
            productId: dbProducts[10].id,
            productNameSnapshot: dbProducts[10].name,
            skuSnapshot: dbProducts[10].sku,
            unitPriceSnapshot: dbProducts[10].unitPrice,
            quantity: 1,
            totalPrice: dbProducts[10].unitPrice * 1,
          }
        ]
      }
    }
  });

  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0003',
      customerId: dbCustomers[2].id,
      totalQuantity: 1,
      status: ChallanStatus.CANCELLED,
      createdBy: sales.id,
      cancelledAt: today,
      items: {
        create: [
          {
            productId: dbProducts[0].id,
            productNameSnapshot: dbProducts[0].name,
            skuSnapshot: dbProducts[0].sku,
            unitPriceSnapshot: dbProducts[0].unitPrice,
            quantity: 1,
            totalPrice: dbProducts[0].unitPrice * 1,
          }
        ]
      }
    }
  });

  console.log('Seeded 3 Challans (1 Confirmed + Invoice, 1 Draft, 1 Cancelled).');
  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
