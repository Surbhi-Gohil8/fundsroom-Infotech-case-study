import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { NotFoundError } from '../../utils/errors.js';
import type { Prisma } from '@prisma/client';

export const listCustomers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page: rawPage, limit: rawLimit, search, status, customerType, sortBy, sortOrder } = req.query as any;

    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (customerType) {
      where.customerType = customerType;
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
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

export const createCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const customerData = req.body;

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        createdBy: userId,
      },
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: { id: true, name: true }
            }
          }
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            challanNumber: true,
            totalQuantity: true,
            status: true,
            createdAt: true,
            confirmedAt: true,
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const customerData = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: customerData,
    });

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    await prisma.customer.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addFollowUp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customerId = req.params.id as string;
    const userId = req.user!.id;
    const { note, followUpDate } = req.body;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Run inside database transaction to keep customer's direct followUpDate and the follow-ups log table in sync
    const followUp = await prisma.$transaction(async (tx: any) => {
      const log = await tx.customerFollowUp.create({
        data: {
          customerId,
          note,
          followUpDate,
          createdBy: userId,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { followUpDate },
      });

      return log;
    });

    res.status(201).json({
      success: true,
      data: followUp,
      message: 'Follow-up logged successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowUps = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customerId = req.params.id as string;

    const followUps = await prisma.customerFollowUp.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    next(error);
  }
};
