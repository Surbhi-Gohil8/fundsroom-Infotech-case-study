import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

const challanItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(challanItemSchema)
    .min(1, 'Challan must contain at least one item')
    .refine(
      (items) => {
        const ids = items.map((i) => i.productId);
        return new Set(ids).size === ids.length;
      },
      { message: 'Challan cannot contain duplicate product line items' }
    ),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(challanItemSchema)
    .min(1)
    .refine(
      (items) => {
        const ids = items.map((i) => i.productId);
        return new Set(ids).size === ids.length;
      },
      { message: 'Challan cannot contain duplicate product line items' }
    ).optional(),
});

export const queryChallanSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.nativeEnum(ChallanStatus).optional(),
  customerId: z.string().uuid().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
