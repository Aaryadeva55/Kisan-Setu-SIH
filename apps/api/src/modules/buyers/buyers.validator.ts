import { z } from 'zod';

export const createRequirementSchema = z.object({
  body: z.object({
    cropId: z.string().min(1),
    quantityKg: z.number().positive(),
    maxPrice: z.number().positive().optional(),
    minQuality: z.string().optional(),
    districtId: z.string().optional(),
    radiusKm: z.number().positive().optional(),
  }),
});

export const updateRequirementSchema = z.object({
  body: z.object({
    quantityKg: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    minQuality: z.string().optional(),
    districtId: z.string().optional(),
    radiusKm: z.number().positive().optional(),
    isActive: z.boolean().optional(),
  }),
});
