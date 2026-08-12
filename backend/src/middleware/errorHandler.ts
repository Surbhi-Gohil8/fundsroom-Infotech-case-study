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
  logger.error(`${req.method} ${req.path} - Error: ${err.message || err}`, { stack: err.stack });

  // Handle AppError
  if (err instanceof AppError) {
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

  // Handle Prisma Database Errors — use constructor name check to avoid
  // ESM/CJS named-export interop issues with @prisma/client in production
  if (
    err.constructor?.name === 'PrismaClientKnownRequestError' ||
    err.name === 'PrismaClientKnownRequestError'
  ) {
    if (err.code === 'P2002') {
      const targets = (err.meta?.target as string[]) || [];
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

  // Handle general/unknown errors
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
