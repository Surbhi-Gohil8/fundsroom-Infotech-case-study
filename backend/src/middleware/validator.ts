import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);
        // Mutate existing query object fields to bypass Express 5 getter-only reassignment check
        for (const key of Object.keys(req.query)) {
          delete req.query[key];
        }
        Object.assign(req.query, parsedQuery);
      }
      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params);
        // Mutate existing params object fields to bypass Express 5 getter-only reassignment check
        for (const key of Object.keys(req.params)) {
          delete req.params[key];
        }
        Object.assign(req.params, parsedParams);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
