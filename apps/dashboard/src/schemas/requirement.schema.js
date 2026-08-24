import { z } from 'zod';

export const requirementSchema = z.object({
  cropId: z.string().min(1, 'Please select a crop'),
  quantityKg: z.coerce.number().positive('Quantity must be greater than 0'),
  maxPricePerKg: z.coerce.number().positive('Price must be greater than 0').optional().nullable(),
  minQualityGrade: z.enum(['A', 'B', 'C', 'ANY'], {
    errorMap: () => ({ message: 'Please select a minimum quality grade' }),
  }),
  districtId: z.string().min(1, 'Please select a district'),
  radiusKm: z.coerce.number().min(10, 'Radius must be at least 10 km').max(500, 'Radius cannot exceed 500 km'),
  neededByDate: z.string().min(1, 'Please select needed-by date'),
});
