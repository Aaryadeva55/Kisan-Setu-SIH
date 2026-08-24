import { z } from 'zod';

export const bundleTransactionSchema = z.object({
  buyerRequirementId: z.string().min(1, 'Please select a target buyer requirement'),
  sellIntentIds: z.array(z.string()).min(1, 'Please select at least one member farmer sell intent'),
  notes: z.string().optional(),
});
