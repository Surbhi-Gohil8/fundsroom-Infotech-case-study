import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle AppError (401, 403, 404, 400)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`${req.method} ${req.path} - ${err.statusCode} Error: ${err.message}`, { stack: err.stack });
    } else {
      logger.warn(`${req.method} ${req.path} - ${err.statusCode} ${err.code}: ${err.message}`);
    }
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError || err.name === 'ZodError' || err.constructor?.name === 'ZodError') {
    logger.warn(`${req.method} ${req.path} - 400 Validation Error`);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors ? err.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })) : [],
      },
    });
    return;
  }

  // Handle Prisma Database Errors
  if (
    err.constructor?.name === 'PrismaClientKnownRequestError' ||
    err.name === 'PrismaClientKnownRequestError'
  ) {
    if (err.code === 'P2002') {
      const targets = (err.meta?.target as string[]) || [];
      logger.warn(`${req.method} ${req.path} - 409 Unique Constraint Violation: ${targets.join(', ')}`);
      res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `A record with this ${targets.join(', ')} already exists.`,
          details: targets,
        },
      });
      return;
    }
  }

  // Handle unhandled server errors (500)
  logger.error(`${req.method} ${req.path} - Unhandled Server Error: ${err.message || err}`, { stack: err.stack });
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      details: isProduction ? [] : [err.stack],
    },
  });
};
