import { Router } from 'express';
import { login, getMe, listUsers, createUser, updateUser } from './auth.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { loginSchema, createUserSchema, updateUserSchema } from './auth.schema.js';
import { Role } from '@prisma/client';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.get('/me', authenticate, getMe);

// Admin user management routes
router.get('/users', authenticate, authorize([Role.ADMIN]), listUsers);
router.post('/users', authenticate, authorize([Role.ADMIN]), validate({ body: createUserSchema }), createUser);
router.patch('/users/:id', authenticate, authorize([Role.ADMIN]), validate({ body: updateUserSchema }), updateUser);

export default router;
