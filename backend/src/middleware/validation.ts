import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validates request components (body, query, params) against a Zod schema.
 * Responds with a 400 Bad Request and detailed schema validation errors if validation fails.
 */
export const validateRequest = (schema: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Input validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            issue: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
