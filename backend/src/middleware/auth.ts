import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { sendError } from '../utils/response';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  collegeId: string;
  role: UserRole;
  isVerified: boolean;
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        collegeId: true,
        role: true,
        isVerified: true,
        accountStatus: true,
      },
    });

    if (!user) {
      return sendError(res, 'User account not found', 401, 'UNAUTHORIZED');
    }

    if (user.accountStatus === 'SUSPENDED') {
      return sendError(res, 'Your account has been suspended by an administrator', 403, 'FORBIDDEN');
    }

    req.user = {
      id: user.id,
      email: user.email,
      collegeId: user.collegeId,
      role: user.role,
      isVerified: user.isVerified,
    };

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired authentication token', 401, 'UNAUTHORIZED');
  }
}

export async function optionalAuthenticateUser(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          collegeId: true,
          role: true,
          isVerified: true,
          accountStatus: true,
        },
      });

      if (user && user.accountStatus !== 'SUSPENDED') {
        req.user = {
          id: user.id,
          email: user.email,
          collegeId: user.collegeId,
          role: user.role,
          isVerified: user.isVerified,
        };
      }
    } catch {
      // Ignore error for optional auth
    }
  }

  next();
}


export function requireVerifiedStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  if (!req.user.isVerified) {
    return sendError(
      res,
      'College email verification is required to perform this action',
      403,
      'UNVERIFIED_STUDENT'
    );
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  if (req.user.role !== UserRole.ADMIN) {
    return sendError(res, 'Admin privileges required', 403, 'FORBIDDEN');
  }

  next();
}
