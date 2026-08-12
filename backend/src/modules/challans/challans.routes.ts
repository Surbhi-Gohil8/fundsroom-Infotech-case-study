import { Router } from 'express';
import {
  listChallans,
  createChallan,
  getChallan,
  updateChallan,
  confirmChallan,
  cancelChallan
} from './challans.controller.js';
import { generateChallanPDF } from './challans.pdf.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { createChallanSchema, updateChallanSchema, queryChallanSchema } from './challans.schema.js';
import { Role } from '@prisma/client';

const router = Router();

const viewRoles = [Role.ADMIN, Role.SALES, Role.ACCOUNTS];
const editRoles = [Role.ADMIN, Role.SALES];

router.get(
  '/',
  authenticate,
  authorize(viewRoles),
  validate({ query: queryChallanSchema }),
  listChallans
);

router.post(
  '/',
  authenticate,
  authorize(editRoles),
  validate({ body: createChallanSchema }),
  createChallan
);

router.get(
  '/:id',
  authenticate,
  authorize(viewRoles),
  getChallan
);

router.patch(
  '/:id',
  authenticate,
  authorize(editRoles),
  validate({ body: updateChallanSchema }),
  updateChallan
);

router.post(
  '/:id/confirm',
  authenticate,
  authorize(editRoles),
  confirmChallan
);

router.post(
  '/:id/cancel',
  authenticate,
  authorize(editRoles),
  cancelChallan
);

// PDF route
router.get(
  '/:id/pdf',
  authenticate,
  authorize(viewRoles),
  generateChallanPDF
);

export default router;
