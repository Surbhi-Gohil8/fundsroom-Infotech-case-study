import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalCustomers,
      activeCustomers,
      leadCustomers,
      totalProducts,
      outOfStockProducts,
      lowStockProductsList,
      draftChallans,
      confirmedChallans,
      revenueSummary,
      recentChallans,
      recentCustomers,
      dueTodayFollowUps,
      overdueFollowUps,
      recentStockMovements,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.product.count(),
      prisma.product.count({ where: { currentStock: 0 } }),
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int FROM "Product" 
        WHERE "currentStock" <= "minimumStock" AND "currentStock" > 0 AND "isActive" = true
      `,
      prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
      prisma.salesChallan.count({ where: { status: 'CONFIRMED' } }),
      prisma.invoice.aggregate({
        _sum: {
          subtotal: true,
          tax: true,
          total: true,
        },
        where: {
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { customerName: true, businessName: true }
          }
        }
      }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.findMany({
        where: {
          followUpDate: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: { not: 'INACTIVE' }
        }
      }),
      prisma.customer.findMany({
        where: {
          followUpDate: {
            lt: todayStart,
          },
          status: { not: 'INACTIVE' }
        }
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true, sku: true }
          }
        }
      })
    ]);

    const lowStockCount = lowStockProductsList[0]?.count || 0;

    res.json({
      success: true,
      data: {
        counts: {
          customers: {
            total: totalCustomers,
            active: activeCustomers,
            leads: leadCustomers,
          },
          products: {
            total: totalProducts,
            outOfStock: outOfStockProducts,
            lowStock: lowStockCount,
            healthy: Math.max(0, totalProducts - outOfStockProducts - lowStockCount),
          },
          challans: {
            draft: draftChallans,
            confirmed: confirmedChallans,
          },
          revenue: {
            subtotal: revenueSummary._sum.subtotal || 0,
            tax: revenueSummary._sum.tax || 0,
            total: revenueSummary._sum.total || 0,
          }
        },
        recentChallans,
        recentCustomers,
        recentStockMovements,
        followUps: {
          dueToday: dueTodayFollowUps,
          overdue: overdueFollowUps,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
