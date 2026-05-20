import { z } from 'zod';

// budget tolerates string or number input (coerced) to match the prior
// express-validator behaviour, which did not type-check non-required fields.
const budget = z.coerce.number().nullable().optional();

export const createCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  genre: z.array(z.string()).optional(),
  platform: z.array(z.string()).optional(),
  budget,
  deadline: z.string().nullable().optional(),
  requirements: z.string().optional(),
});

export const updateCampaignSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  genre: z.array(z.string()).optional(),
  platform: z.array(z.string()).optional(),
  budget,
  deadline: z.string().nullable().optional(),
  requirements: z.string().optional(),
  status: z.enum(['open', 'closed', 'archived']).optional(),
});
