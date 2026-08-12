import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().max(15, 'GST Number cannot exceed 15 characters').optional().nullable().or(z.literal('')),
  customerType: z.nativeEnum(CustomerType),
  address: z.string().min(5, 'Address is required'),
  status: z.nativeEnum(CustomerStatus).optional().default(CustomerStatus.LEAD),
  followUpDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  notes: z.string().optional().default(''),
});

export const updateCustomerSchema = z.object({
  customerName: z.string().min(2).optional(),
  mobile: z.string().min(10).optional(),
  email: z.string().email().optional(),
  businessName: z.string().min(2).optional(),
  gstNumber: z.string().max(15).optional().nullable().or(z.literal('')),
  customerType: z.nativeEnum(CustomerType).optional(),
  address: z.string().min(5).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  followUpDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  notes: z.string().optional(),
});

export const addFollowUpSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty'),
  followUpDate: z.string().transform(val => new Date(val)),
});

export const queryCustomerSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
