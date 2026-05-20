import { body, ValidationChain } from 'express-validator';

// express-validator chain for POST /api/cart/add. Kept as express-validator
// (not zod) to preserve the existing 400 error-response shape.
export const addToCartValidators: ValidationChain[] = [
  body('influencerId').notEmpty().withMessage('Influencer ID is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
];
