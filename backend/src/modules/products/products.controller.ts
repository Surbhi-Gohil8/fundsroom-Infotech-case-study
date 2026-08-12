import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors.js';
import { uploadFile, deleteFile } from '../../utils/storage.js';
import type { Prisma } from '@prisma/client';

export const listProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page: rawPage, limit: rawLimit, search, category, stockStatus, sortBy, sortOrder } = req.query as any;

    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stockStatus) {
      if (stockStatus === 'OUT_OF_STOCK') {
        where.currentStock = 0;
      } else if (stockStatus === 'LOW_STOCK') {
        where.currentStock = {
          gt: 0,
          lte: prisma.product.fields.minimumStock // In Prisma we can write custom bounds, but to keep it simple, we can filter in JavaScript or write raw where.
        };
        // Wait, comparing columns directly is not easily done via where in Prisma Client without raw sql, or we can use:
        // where.AND = [
        //   { currentStock: { gt: 0 } },
        //   { currentStock: { lte: prisma.product.fields.minimumStock } } // wait, this works in modern prisma!
        // ]
        // Let's write raw where to be safe or check if we can query for low stock by fetching and filtering, or writing a custom where.
      } else if (stockStatus === 'HEALTHY') {
        where.currentStock = {
          gt: prisma.product.fields.minimumStock
        };
      }
    }

    // Wait, let's make sure the stockStatus query is database-safe. If we cannot easily use columns comparison, we can do it via $queryRaw or simpler: since we have a database, we can do:
    // "where.currentStock = { gt: 0 }" is fine. If stockStatus is LOW_STOCK, let's write raw SQL or fetch and filter, or just compare:
    // Wait, a very safe and standard way is to use a Prisma raw query or query fields. Let's look at the fields logic.
    // If Prisma fields don't compile, we can write a raw query or simply:
    // where: { OR: [ { currentStock: { lte: 5 } } ] } - but minimumStock is dynamic per product.
    // So let's write a Prisma raw SQL query, or just write it using Prisma's where. Let's write standard Prisma:
    // To support comparing two fields in Prisma, we can use Prisma.ProductWhereInput.
    // Since page size is limited, let's fetch all and filter in JS if stockStatus is provided, or better:
    // where is simple, and if stockStatus is LOW_STOCK or HEALTHY, we can do:
    // SELECT * FROM "Product" WHERE "currentStock" <= "minimumStock" AND "currentStock" > 0;
    // Let's write the query dynamically!

    let products: any[] = [];
    let total = 0;

    if (stockStatus === 'LOW_STOCK' || stockStatus === 'HEALTHY') {
      const sqlQuery = stockStatus === 'LOW_STOCK'
        ? Prisma.sql`SELECT * FROM "Product" WHERE "currentStock" <= "minimumStock" AND "currentStock" > 0 ${search ? Prisma.sql`AND ("name" ILIKE ${'%' + search + '%'} OR "sku" ILIKE ${'%' + search + '%'} OR "category" ILIKE ${'%' + search + '%'})` : Prisma.empty} ${category ? Prisma.sql`AND "category" = ${category}` : Prisma.empty} ORDER BY "${Prisma.raw(sortBy)}" ${Prisma.raw(sortOrder)} LIMIT ${limit} OFFSET ${skip}`
        : Prisma.sql`SELECT * FROM "Product" WHERE "currentStock" > "minimumStock" ${search ? Prisma.sql`AND ("name" ILIKE ${'%' + search + '%'} OR "sku" ILIKE ${'%' + search + '%'} OR "category" ILIKE ${'%' + search + '%'})` : Prisma.empty} ${category ? Prisma.sql`AND "category" = ${category}` : Prisma.empty} ORDER BY "${Prisma.raw(sortBy)}" ${Prisma.raw(sortOrder)} LIMIT ${limit} OFFSET ${skip}`;

      const sqlCountQuery = stockStatus === 'LOW_STOCK'
        ? Prisma.sql`SELECT COUNT(*)::int FROM "Product" WHERE "currentStock" <= "minimumStock" AND "currentStock" > 0 ${search ? Prisma.sql`AND ("name" ILIKE ${'%' + search + '%'} OR "sku" ILIKE ${'%' + search + '%'} OR "category" ILIKE ${'%' + search + '%'})` : Prisma.empty} ${category ? Prisma.sql`AND "category" = ${category}` : Prisma.empty}`
        : Prisma.sql`SELECT COUNT(*)::int FROM "Product" WHERE "currentStock" > "minimumStock" ${search ? Prisma.sql`AND ("name" ILIKE ${'%' + search + '%'} OR "sku" ILIKE ${'%' + search + '%'} OR "category" ILIKE ${'%' + search + '%'})` : Prisma.empty} ${category ? Prisma.sql`AND "category" = ${category}` : Prisma.empty}`;

      const [resProducts, resCount] = await Promise.all([
        prisma.$queryRaw<any[]>(sqlQuery),
        prisma.$queryRaw<{ count: number }[]>(sqlCountQuery),
      ]);
      products = resProducts;
      total = resCount[0]?.count || 0;
    } else {
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.product.count({ where }),
      ]);
    }

    res.json({
      success: true,
      data: products,
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

export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productData = req.body;
    const file = req.file;

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: productData.sku },
    });
    if (existingSku) {
      throw new ConflictError('A product with this SKU already exists');
    }

    let imageUrl: string | null = null;
    if (file) {
      imageUrl = await uploadFile(file);
    }

    // Use a transaction to create the product and an initial stock ledger movement if currentStock > 0
    const product = await prisma.$transaction(async (tx: any) => {
      const created = await tx.product.create({
        data: {
          ...productData,
          imageUrl,
        },
      });

      if (created.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            quantityChanged: created.currentStock,
            movementType: 'IN',
            reason: 'Initial stock on creation',
            createdBy: req.user!.id,
          },
        });
      }

      return created;
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const productData = req.body;
    const file = req.file;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    if (productData.sku && productData.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku: productData.sku } });
      if (existingSku) {
        throw new ConflictError('A product with this SKU already exists');
      }
    }

    let imageUrl = existingProduct.imageUrl;
    if (file) {
      // Delete old file
      if (existingProduct.imageUrl) {
        await deleteFile(existingProduct.imageUrl);
      }
      imageUrl = await uploadFile(file);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        imageUrl,
      },
    });

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    if (existingProduct.imageUrl) {
      await deleteFile(existingProduct.imageUrl);
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = req.params.id as string;
    const { quantity, movementType, reason } = req.body;
    const userId = req.user!.id;

    // Run in a transaction to lock the product and perform calculations atomically
    const movement = await prisma.$transaction(async (tx: any) => {
      // Lock row
      await tx.$executeRaw`SELECT * FROM "Product" WHERE id = ${productId} FOR UPDATE`;

      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      let newStock = product.currentStock;
      if (movementType === 'IN') {
        newStock += quantity;
      } else if (movementType === 'OUT') {
        if (product.currentStock < quantity) {
          throw new BadRequestError(`Insufficient stock. Current stock is ${product.currentStock}, requested adjustment is OUT ${quantity}.`, 'INSUFFICIENT_STOCK');
        }
        newStock -= quantity;
      }

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const log = await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged: quantity,
          movementType,
          reason,
          createdBy: userId,
        },
      });

      return log;
    });

    res.status(201).json({
      success: true,
      data: movement,
      message: 'Stock adjusted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const listStockMovements = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page: rawPage = 1, limit: rawLimit = 20, productId, movementType, search } = req.query as any;

    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.StockMovementWhereInput = {};

    if (productId) {
      where.productId = productId;
    }
    if (movementType) {
      where.movementType = movementType;
    }
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true, currentStock: true }
          },
          creator: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({
      success: true,
      data: movements,
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
