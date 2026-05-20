import { z } from 'zod';

// Body validation for the messaging module. `content` must be a non-empty
// string — the prior route only length-checked when content happened to be a
// string, letting non-string payloads slip into the DB.
export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(2000, 'Message content cannot exceed 2000 characters'),
});
