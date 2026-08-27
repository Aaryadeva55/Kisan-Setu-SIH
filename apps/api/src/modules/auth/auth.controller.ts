import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { APP_CONSTANTS } from '../../config/constants.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      res.cookie(APP_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: APP_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS,
      });

      return res.status(201).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { login, email, phone, password } = req.body;
      const loginIdentifier = login || email || phone;
      const result = await authService.login(loginIdentifier, password);

      res.cookie(APP_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: APP_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS,
      });

      return res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken =
        req.cookies?.[APP_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME] ||
        req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Refresh token cookie missing',
          },
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.cookie(APP_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: APP_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS,
      });

      return res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie(APP_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME);
      return res.status(200).json({ message: 'Successfully logged out' });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      return res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
