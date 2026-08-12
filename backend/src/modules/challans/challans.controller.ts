import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { NotFoundError, BadRequestError, ConflictError, AppError } from '../../utils/errors.js';
import { Prisma } from '@prisma/client';

// Concurrency-safe helper to fetch the next challan number
async function getNextChallanNumber(tx: any): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `CH-${currentYear}-`;

  const latestChallans = await tx.$queryRaw<any[]>`
    SELECT "challanNumber" FROM "SalesChallan" 
    WHERE "challanNumber" LIKE ${yearPrefix + '%'} 
    ORDER BY "challanNumber" DESC 
    LIMIT 1 
    FOR UPDATE
  `;

  let nextSequence = 1;
  if (latestChallans.length > 0) {
    const lastNum = latestChallans[0].challanNumber;
    const parts = lastNum.split('-');
    const sequenceStr = parts[parts.length - 1];
    nextSequence = parseInt(sequenceStr, 10) + 1;
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${yearPrefix}${paddedSequence}`;
}

export const listChallans = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page: rawPage, limit: rawLimit, search, status, customerId, sortBy, sortOrder } = req.query as any;

    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const skip = (page - 1) * limit;
    const where: Prisma.SalesChallanWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (search) {
      where.OR = [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { customerName: { contains: search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [challans, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { id: true, customerName: true, businessName: true }
          },
          creator: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.salesChallan.count({ where }),
    ]);

    res.json({
      success: true,
      data: challans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { customerId, items } = req.body;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const challan = await prisma.$transaction(async (tx: any) => {
      // 1. Generate Challan Number
      const challanNumber = await getNextChallanNumber(tx);

      // 2. Prepare items with snapshots from products
      let totalQty = 0;
      const challanItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive) {
          throw new NotFoundError(`Product not found or inactive: ID ${item.productId}`);
        }

        totalQty += item.quantity;
        challanItemsData.push({
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          unitPriceSnapshot: product.unitPrice,
          quantity: item.quantity,
          totalPrice: product.unitPrice * item.quantity,
        });
      }

      // 3. Create Challan
      const created = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity: totalQty,
          status: 'DRAFT',
          createdBy: userId,
          items: {
            create: challanItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      return created;
    });

    res.status(201).json({
      success: true,
      data: challan,
      message: 'Draft Challan created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: true
          }
        },
        invoices: true
      }
    });

    if (!challan) {
      throw new NotFoundError('Sales Challan not found');
    }

    res.json({
      success: true,
      data: challan,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { customerId, items } = req.body;

    const existingChallan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingChallan) {
      throw new NotFoundError('Sales Challan not found');
    }

    if (existingChallan.status !== 'DRAFT') {
      throw new BadRequestError('Only draft challans can be updated', 'CHALLAN_NOT_DRAFT');
    }

    const challan = await prisma.$transaction(async (tx: any) => {
      // Clear existing items
      await tx.salesChallanItem.deleteMany({ where: { challanId: id } });

      let totalQty = 0;
      const challanItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive) {
          throw new NotFoundError(`Product not found or inactive: ID ${item.productId}`);
        }

        totalQty += item.quantity;
        challanItemsData.push({
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          unitPriceSnapshot: product.unitPrice,
          quantity: item.quantity,
          totalPrice: product.unitPrice * item.quantity,
        });
      }

      const updated = await tx.salesChallan.update({
        where: { id },
        data: {
          customerId: customerId || existingChallan.customerId,
          totalQuantity: totalQty,
          items: {
            create: challanItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      return updated;
    });

    res.json({
      success: true,
      data: challan,
      message: 'Challan updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const confirmChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    await prisma.$transaction(async (tx: any) => {
      // 1. Fetch and Lock Challan
      const challan = (await tx.salesChallan.findUnique({
        where: { id },
        include: { items: true, customer: true }
      })) as any;

      if (!challan) {
        throw new NotFoundError('Sales Challan not found');
      }

      if (challan.status === 'CONFIRMED') {
        throw new ConflictError('This challan is already confirmed', 'CHALLAN_ALREADY_CONFIRMED');
      }

      if (challan.status === 'CANCELLED') {
        throw new BadRequestError('Cancelled challans cannot be confirmed', 'CHALLAN_ALREADY_CANCELLED');
      }

      // 2. Lock & Validate stock for all items
      let subtotal = 0;
      for (const item of challan.items) {
        if (!item.productId) {
          throw new BadRequestError(`Cannot confirm challan. Product for item ${item.skuSnapshot} no longer exists.`, 'PRODUCT_DELETED');
        }

        // Pessimistic lock row
        await tx.$executeRaw`SELECT * FROM "Product" WHERE id = ${item.productId} FOR UPDATE`;

        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new NotFoundError(`Product not found: ID ${item.productId}`);
        }

        if (product.currentStock < item.quantity) {
          throw new AppError(409, 'INSUFFICIENT_STOCK', `Insufficient stock for product ${product.name}. Available: ${product.currentStock}, requested: ${item.quantity}.`);
        }

        // 3. Deduct stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        // 4. Create Stock Ledger entry
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan Confirmation (${challan.challanNumber})`,
            referenceType: 'SalesChallan',
            referenceId: challan.id,
            createdBy: userId,
          },
        });

        subtotal += item.totalPrice;
      }

      // 5. Update status
      await tx.salesChallan.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      // P2: Automatic invoice creation
      const taxRate = 0.18; // 18% GST standard
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      // Autonumber invoice: INV-YYYY-XXXX
      const currentYear = new Date().getFullYear();
      const invoiceYearPrefix = `INV-${currentYear}-`;
      const latestInvoices = await tx.$queryRaw<any[]>`
        SELECT "invoiceNumber" FROM "Invoice" 
        WHERE "invoiceNumber" LIKE ${invoiceYearPrefix + '%'} 
        ORDER BY "invoiceNumber" DESC 
        LIMIT 1 
        FOR UPDATE
      `;

      let nextInvSeq = 1;
      if (latestInvoices.length > 0) {
        const lastInvNum = latestInvoices[0].invoiceNumber;
        const parts = lastInvNum.split('-');
        const sequenceStr = parts[parts.length - 1];
        nextInvSeq = parseInt(sequenceStr, 10) + 1;
      }
      const paddedInvSequence = String(nextInvSeq).padStart(4, '0');
      const invoiceNumber = `${invoiceYearPrefix}${paddedInvSequence}`;

      await tx.invoice.create({
        data: {
          invoiceNumber,
          challanId: challan.id,
          customerId: challan.customerId,
          subtotal,
          tax,
          total,
          status: 'UNPAID',
          createdBy: userId,
        },
      });
    });

    res.json({
      success: true,
      message: 'Challan confirmed successfully. Stock deducted and Invoice generated.',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    await prisma.$transaction(async (tx: any) => {
      const challan = (await tx.salesChallan.findUnique({
        where: { id },
        include: { items: true }
      })) as any;

      if (!challan) {
        throw new NotFoundError('Sales Challan not found');
      }

      if (challan.status === 'CANCELLED') {
        throw new ConflictError('Challan is already cancelled', 'CHALLAN_ALREADY_CANCELLED');
      }

      // If CONFIRMED, revert the stock
      if (challan.status === 'CONFIRMED') {
        for (const item of challan.items) {
          if (item.productId) {
            // Lock and increment stock
            await tx.$executeRaw`SELECT * FROM "Product" WHERE id = ${item.productId} FOR UPDATE`;
            await tx.product.update({
              where: { id: item.productId },
              data: {
                currentStock: {
                  increment: item.quantity,
                },
              },
            });

            // Create Stock Ledger IN movement
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantityChanged: item.quantity,
                movementType: 'IN',
                reason: `Sales Challan Cancellation (${challan.challanNumber})`,
                referenceType: 'SalesChallan',
                referenceId: challan.id,
                createdBy: userId,
              },
            });
          }
        }

        // Cancel the related invoices
        await tx.invoice.updateMany({
          where: { challanId: id },
          data: { status: 'CANCELLED' }
        });
      }

      // Update status to CANCELLED
      await tx.salesChallan.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });
    });

    res.json({
      success: true,
      message: 'Challan cancelled successfully. Related stock deductions reverted.',
    });
  } catch (error) {
    next(error);
  }
};
