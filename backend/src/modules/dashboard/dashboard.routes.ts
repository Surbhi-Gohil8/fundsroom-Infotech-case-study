import { Router } from 'express';
import { getDashboardSummary } from './dashboard.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

const allowedRoles = [Role.ADMIN, Role.SALES, Role.ACCOUNTS];

router.get(
  '/summary',
  authenticate,
  authorize(allowedRoles),
  getDashboardSummary
);

export default router;
