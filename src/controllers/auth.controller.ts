import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
} from '../utils/cookie.util';
import { createHttpError } from '../middleware/error.middleware';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, message } = await AuthService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = (req.body?.token || req.query?.token) as string;
    if (!token) {
      throw createHttpError(400, 'Verification token is required');
    }

    const { message, user } = await AuthService.verifyEmail({ token });

    res.status(200).json({
      success: true,
      message,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { message } = await AuthService.resendVerificationEmail(req.body);

    res.status(200).json({
      success: true,
      message,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { accessToken, refreshToken, user } = await AuthService.loginUser(
      req.body
    );

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawToken = getRefreshTokenFromCookie(req.cookies);

    if (!rawToken) {
      throw createHttpError(401, 'No refresh token provided');
    }

    const { accessToken, refreshToken, user } =
      await AuthService.refreshSession(rawToken);

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { accessToken, user },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawToken = getRefreshTokenFromCookie(req.cookies);

    if (rawToken) {
      await AuthService.logoutUser(rawToken);
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user } = await AuthService.getMe(req.user!.sub);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user } = await AuthService.updateProfile(req.user!.sub, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
