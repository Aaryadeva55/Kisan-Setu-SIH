import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role, Language, JwtPayload } from '@kisan-setu/types';
import { config } from '../../config/env.js';
import { APP_CONSTANTS } from '../../config/constants.js';
import { authRepository } from './auth.repository.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../shared/errors/AppError.js';

export class AuthService {
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
  }

  private formatUser(user: any) {
    const name =
      user.buyer?.companyName ||
      user.buyer?.contactName ||
      user.fpo?.name ||
      user.farmerProfile?.fullName ||
      (user.email ? user.email.split('@')[0] : user.phone) ||
      'User';

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name,
      role: user.role,
      preferredLang: user.preferredLang,
      buyer: user.buyer,
      fpo: user.fpo,
      farmerProfile: user.farmerProfile,
    };
  }

  async register(data: {
    phone: string;
    email?: string;
    password?: string;
    role: Role;
    preferredLang?: Language;
    fullName?: string;
    companyName?: string;
    buyerType?: string;
    fpoName?: string;
    regNumber?: string;
    districtId?: string;
  }) {
    const existingPhone = await authRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new ConflictError('A user with this phone number already exists');
    }

    if (data.email) {
      const existingEmail = await authRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictError('A user with this email address already exists');
      }
    }

    let passwordHash: string | undefined;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, APP_CONSTANTS.PASSWORD_SALT_ROUNDS);
    }

    const user = await authRepository.createUserWithProfile({
      ...data,
      passwordHash,
    });

    if (!user) {
      throw new Error('Failed to create user');
    }

    const jwtPayload: JwtPayload = {
      userId: user.id,
      role: user.role as Role,
      phone: user.phone,
      email: user.email || undefined,
    };

    const accessToken = this.generateAccessToken(jwtPayload);
    const refreshToken = this.generateRefreshToken(jwtPayload);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(loginIdentifier: string, passwordPlain: string) {
    const isEmail = loginIdentifier.includes('@');
    const user = isEmail
      ? await authRepository.findByEmail(loginIdentifier)
      : await authRepository.findByPhone(loginIdentifier);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid login credentials');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid login credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated. Please contact support.');
    }

    const jwtPayload: JwtPayload = {
      userId: user.id,
      role: user.role as Role,
      phone: user.phone,
      email: user.email || undefined,
    };

    const accessToken = this.generateAccessToken(jwtPayload);
    const refreshToken = this.generateRefreshToken(jwtPayload);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
      const user = await authRepository.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User session is invalid');
      }

      const jwtPayload: JwtPayload = {
        userId: user.id,
        role: user.role as Role,
        phone: user.phone,
        email: user.email || undefined,
      };

      const newAccessToken = this.generateAccessToken(jwtPayload);
      const newRefreshToken = this.generateRefreshToken(jwtPayload);

      return {
        user: this.formatUser(user),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.formatUser(user);
  }
}

export const authService = new AuthService();
