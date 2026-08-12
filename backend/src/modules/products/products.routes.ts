import { Router } from 'express';
import multer from 'multer';
import {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  listStockMovements,
} from './products.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { createProductSchema, updateProductSchema, adjustStockSchema, queryProductSchema } from './products.schema.js';
import { Role } from '@prisma/client';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Images only (jpeg, jpg, png, webp, gif)'));
  },
});

const viewRoles = [Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS];
const adminRoles = [Role.ADMIN];
const warehouseRoles = [Role.ADMIN, Role.WAREHOUSE];

// Global stock movements ledger route (declared before :id to prevent collision)
router.get(
  '/stock-movements',
  authenticate,
  authorize(warehouseRoles),
  listStockMovements
);

router.get(
  '/',
  authenticate,
  authorize(viewRoles),
  validate({ query: queryProductSchema }),
  listProducts
);

router.post(
  '/',
  authenticate,
  authorize(adminRoles),
  upload.single('image'),
  validate({ body: createProductSchema }),
  createProduct
);

router.get(
  '/:id',
  authenticate,
  authorize(viewRoles),
  getProduct
);

router.patch(
  '/:id',
  authenticate,
  authorize(adminRoles),
  upload.single('image'),
  validate({ body: updateProductSchema }),
  updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize(adminRoles),
  deleteProduct
);

router.post(
  '/:id/stock',
  authenticate,
  authorize(warehouseRoles),
  validate({ body: adjustStockSchema }),
  adjustStock
);

export default router;
