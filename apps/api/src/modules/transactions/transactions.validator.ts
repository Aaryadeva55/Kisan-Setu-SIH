import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    matchId: z.string().min(1),
    quantityKg: z.number().positive(),
    agreedPrice: z.number().positive().optional(),
  }),
});

export const updateStatusNoteSchema = z.object({
  body: z.object({
    note: z.string().optional(),
    rejectionReason: z.string().optional(),
  }),
});
