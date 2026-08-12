import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.coerce.number().positive('Unit price must be positive'),
  currentStock: z.coerce.number().int().nonnegative('Current stock cannot be negative').optional().default(0),
  minimumStock: z.coerce.number().int().nonnegative('Minimum stock cannot be negative').optional().default(5),
  warehouseLocation: z.string().min(2, 'Warehouse location is required'),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().min(3).optional(),
  category: z.string().min(2).optional(),
  unitPrice: z.coerce.number().positive().optional(),
  currentStock: z.coerce.number().int().nonnegative().optional(),
  minimumStock: z.coerce.number().int().nonnegative().optional(),
  warehouseLocation: z.string().min(2).optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const adjustStockSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  movementType: z.nativeEnum(StockMovementType),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

export const queryProductSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  stockStatus: z.enum(['HEALTHY', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
