import { Router } from 'express';
import {
  listCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  addFollowUp,
  getFollowUps
} from './customers.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addFollowUpSchema,
  queryCustomerSchema
} from './customers.schema.js';
import { Role } from '@prisma/client';

const router = Router();

const viewRoles = [Role.ADMIN, Role.SALES, Role.ACCOUNTS];
const editRoles = [Role.ADMIN, Role.SALES];

router.get(
  '/',
  authenticate,
  authorize(viewRoles),
  validate({ query: queryCustomerSchema }),
  listCustomers
);

router.post(
  '/',
  authenticate,
  authorize(editRoles),
  validate({ body: createCustomerSchema }),
  createCustomer
);

router.get(
  '/:id',
  authenticate,
  authorize(viewRoles),
  getCustomer
);

router.patch(
  '/:id',
  authenticate,
  authorize(editRoles),
  validate({ body: updateCustomerSchema }),
  updateCustomer
);

router.delete(
  '/:id',
  authenticate,
  authorize([Role.ADMIN]),
  deleteCustomer
);

router.post(
  '/:id/follow-ups',
  authenticate,
  authorize(editRoles),
  validate({ body: addFollowUpSchema }),
  addFollowUp
);

router.get(
  '/:id/follow-ups',
  authenticate,
  authorize(viewRoles),
  getFollowUps
);

export default router;
