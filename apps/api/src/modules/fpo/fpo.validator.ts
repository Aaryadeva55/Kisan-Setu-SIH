import { z } from 'zod';

export const bundleTransactionSchema = z.object({
  body: z.object({
    buyerRequirementId: z.string().min(1),
    sellIntentIds: z.array(z.string().min(1)).min(1),
    agreedPrice: z.number().positive().optional(),
  }),
});
