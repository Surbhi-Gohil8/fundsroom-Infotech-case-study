import { Router } from 'express';
import { listInvoices } from './invoices.controller.js';
import { generateInvoicePDF } from '../challans/challans.pdf.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

const viewRoles = [Role.ADMIN, Role.ACCOUNTS];

router.get(
  '/',
  authenticate,
  authorize(viewRoles),
  listInvoices
);

router.get(
  '/:id/pdf',
  authenticate,
  authorize(viewRoles),
  generateInvoicePDF
);

export default router;
