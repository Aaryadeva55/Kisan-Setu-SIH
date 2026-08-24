import { prisma } from '../../infra/prisma.js';
import { Role, Language } from '@kisan-setu/types';

export class AuthRepository {
  async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: {
        farmerProfile: true,
        buyer: true,
        fpo: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        farmerProfile: true,
        buyer: true,
        fpo: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        farmerProfile: true,
        buyer: true,
        fpo: true,
      },
    });
  }

  async createUserWithProfile(data: {
    phone: string;
    email?: string;
    passwordHash?: string;
    role: Role;
    preferredLang?: Language;
    companyName?: string;
    buyerType?: string;
    fpoName?: string;
    regNumber?: string;
    districtId?: string;
    fullName?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: data.phone,
          email: data.email || null,
          passwordHash: data.passwordHash || null,
          role: data.role,
          preferredLang: data.preferredLang || Language.MARATHI,
        },
      });

      if (data.role === Role.BUYER) {
        await tx.buyer.create({
          data: {
            userId: user.id,
            companyName: data.companyName || data.fullName || 'Buyer Entity',
            buyerType: data.buyerType || 'Agri Trader',
          },
        });
      } else if (data.role === Role.FPO) {
        await tx.fPO.create({
          data: {
            userId: user.id,
            name: data.fpoName || data.fullName || 'Farmer Producer Organization',
            regNumber: data.regNumber || null,
          },
        });
      } else if (data.role === Role.FARMER && data.districtId) {
        await tx.farmerProfile.create({
          data: {
            userId: user.id,
            fullName: data.fullName || 'Farmer',
            districtId: data.districtId,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: { farmerProfile: true, buyer: true, fpo: true },
      });
    });
  }
}

export const authRepository = new AuthRepository();
