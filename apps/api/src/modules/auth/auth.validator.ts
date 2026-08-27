import { z } from 'zod';
import { Role, Language } from '@kisan-setu/types';

export const registerSchema = z.object({
  body: z.object({
    phone: z.string().min(10).max(15),
    email: z.string().email().optional(),
    password: z.string().min(6),
    role: z.enum([Role.BUYER, Role.FPO, Role.ADMIN, Role.GOVERNMENT_EVALUATOR]),
    preferredLang: z.enum([Language.MARATHI, Language.HINDI, Language.ENGLISH]).default(Language.MARATHI),
    fullName: z.string().optional(),
    companyName: z.string().optional(),
    buyerType: z.string().optional(),
    fpoName: z.string().optional(),
    regNumber: z.string().optional(),
    districtId: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z
    .object({
      login: z.string().min(1).optional(),
      email: z.string().min(1).optional(),
      phone: z.string().min(1).optional(),
      password: z.string().min(1, 'Password is required'),
    })
    .refine((data) => Boolean(data.login || data.email || data.phone), {
      message: 'Either login, email, or phone is required',
    }),
});

