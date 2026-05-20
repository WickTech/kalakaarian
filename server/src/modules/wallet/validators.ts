import { z } from 'zod';

// Withdrawal input. Messages match the prior inline checks so the existing
// { error } response body stays backward compatible (see service.requestWithdrawal).
export const withdrawSchema = z.object({
  amount: z.coerce.number().positive('Invalid amount'),
  upiId: z.string().trim().min(1, 'UPI ID required'),
});
