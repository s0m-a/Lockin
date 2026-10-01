import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/jwt.util';
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
  UpdateProfileInput,
} from '../validators/auth.validator';
import { createHttpError } from '../middleware/error.middleware';
import { env } from '../config/env';
import { sendVerificationEmail } from './email.service';

const SALT_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
  const { email, username, password } = input;

  const existingUser = await prisma.user.findFirst({
    where: { email },
    select: { email: true },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw createHttpError(409, 'An account exist please log in instead ');
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
    },
  });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token: verificationToken,
      expiresAt,
    },
  });

  sendVerificationEmail({
    to: user.email,
    username: user.username,
    token: verificationToken,
  }).catch(() => {});

  return {
    message: 'Registration successful. Please check your email to verify your account.',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
  };
}

export async function verifyEmail(input: VerifyEmailInput) {
  const { token } = input;

  const verificationRecord = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationRecord) {
    throw createHttpError(400, 'Invalid or expired verification token');
  }

  if (verificationRecord.expiresAt < new Date()) {
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    });
    throw createHttpError(400, 'Verification token has expired. Please request a new one.');
  }

  await prisma.user.update({
    where: { id: verificationRecord.userId },
    data: { isVerified: true },
  });

  await prisma.verificationToken.deleteMany({
    where: { userId: verificationRecord.userId },
  });

  return {
    message: 'Email verified successfully! You can now log in.',
    user: {
      id: verificationRecord.user.id,
      email: verificationRecord.user.email,
      username: verificationRecord.user.username,
      studentEmail: verificationRecord.user.studentEmail,
      major: verificationRecord.user.major,
      theme: verificationRecord.user.theme,
      isVerified: true,
    },
  };
}

export async function resendVerificationEmail(input: ResendVerificationInput) {
  const { email } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  const genericSuccessMessage = 'A verification link has been sent.';

  if (!user || user.isVerified) {
    return { message: genericSuccessMessage };
  }

  await prisma.verificationToken.deleteMany({
    where: { userId: user.id },
  });

  const newToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token: newToken,
      expiresAt,
    },
  });

  await sendVerificationEmail({
    to: user.email,
    username: user.username,
    token: newToken,
  });

  return { message: genericSuccessMessage };
}

export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw createHttpError(401, 'Invalid email or password');
  }
  if (!user.isVerified) {
    throw createHttpError(403, 'Please verify your email address before logging in. Check your inbox for the verification link.');
  }
  if (!user.isActive) {
    throw createHttpError(403, 'Your account has been deactivated');
  }

  const accessToken = generateAccessToken(user.id, user.email);
  const familyId = uuidv4();
  const refreshToken = generateRefreshToken(user.id, familyId);

  const expiresAt = getRefreshTokenExpiry();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      studentEmail: user.studentEmail,
      major: user.major,
      theme: user.theme,
      isVerified: user.isVerified,
    },
  };
}

export async function refreshSession(rawRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw createHttpError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(rawRefreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!stored) {
    await prisma.refreshToken.updateMany({
      where: { familyId: payload.familyId },
      data: { isRevoked: true },
    });
    throw createHttpError(401, 'Refresh token reuse detected. Please log in again.');
  }

  if (stored.isRevoked) {
    const activeTokenInFamily = await prisma.refreshToken.findFirst({
      where: {
        familyId: stored.familyId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeTokenInFamily && (Date.now() - activeTokenInFamily.createdAt.getTime()) < 15000) {
      const user = await prisma.user.findUnique({
        where: { id: stored.userId },
      });

      if (user && user.isActive) {
        const newAccessToken = generateAccessToken(user.id, user.email);
        return {
          accessToken: newAccessToken,
          refreshToken: '',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            studentEmail: user.studentEmail,
            major: user.major,
            theme: user.theme,
            isVerified: user.isVerified,
          },
        };
      }
    }

    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId },
      data: { isRevoked: true },
    });
    throw createHttpError(401, 'Refresh token has been revoked');
  }

  if (stored.expiresAt < new Date()) {
    throw createHttpError(401, 'Refresh token has expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
  });

  if (!user || !user.isActive) {
    throw createHttpError(403, 'User not found or deactivated');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { isRevoked: true },
  });

  const newAccessToken = generateAccessToken(user.id, user.email);
  const newRefreshToken = generateRefreshToken(user.id, stored.familyId);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      familyId: stored.familyId,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      studentEmail: user.studentEmail,
      major: user.major,
      theme: user.theme,
      isVerified: user.isVerified,
    },
  };
}

export async function logoutUser(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: { familyId: true },
  });

  if (stored) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId },
      data: { isRevoked: true },
    });
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      studentEmail: true,
      major: true,
      theme: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) throw createHttpError(404, 'User not found');
  return { user };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const dataToUpdate: {
    username?: string;
    studentEmail?: string | null;
    major?: string | null;
    theme?: string;
  } = {};

  if (input.username !== undefined) {
    dataToUpdate.username = input.username;
  }
  if (input.studentEmail !== undefined) {
    dataToUpdate.studentEmail = input.studentEmail || null;
  }
  if (input.major !== undefined) {
    dataToUpdate.major = input.major || null;
  }
  if (input.theme !== undefined) {
    dataToUpdate.theme = input.theme;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: {
      id: true,
      email: true,
      username: true,
      studentEmail: true,
      major: true,
      theme: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return { user };
}

function getRefreshTokenExpiry(): Date {
  const duration = env.JWT_REFRESH_EXPIRES_IN;
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = duration.match(/^(\d+)([smhd])$/);
  const seconds = match ? parseInt(match[1], 10) * units[match[2]] : 7 * 86400;
  return new Date(Date.now() + seconds * 1000);
}
