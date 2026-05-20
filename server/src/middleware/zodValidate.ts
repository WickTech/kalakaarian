import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

// Validates req.body against a Zod schema. On success, replaces req.body with
// the parsed (and coerced) value. On failure, mirrors the existing
// express-validator error shape: 400 { errors: [...] }.
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          msg: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
