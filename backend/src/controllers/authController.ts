import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/authValidators';

export async function register(req: Request, res: Response) {
  const validated = registerSchema.parse(req.body);

  const college = await prisma.college.findUnique({
    where: { id: validated.collegeId },
  });

  if (!college) {
    return sendError(res, 'Selected college not found', 400, 'INVALID_COLLEGE');
  }

  // Validate college domain matches email
  const emailDomain = validated.email.split('@')[1]?.toLowerCase();
  if (!emailDomain || emailDomain !== college.emailDomain.toLowerCase()) {
    return sendError(
      res,
      `Email domain (@${emailDomain}) does not match college domain (@${college.emailDomain})`,
      400,
      'DOMAIN_MISMATCH'
    );
  }

  // Check if email already registered
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email.toLowerCase() },
  });

  if (existingUser) {
    return sendError(res, 'An account with this email already exists', 409, 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(validated.password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email.toLowerCase(),
      passwordHash,
      collegeId: college.id,
      phoneNumber: validated.phoneNumber,
      course: validated.course,
      year: validated.year,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: verificationExpires,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      college: { select: { id: true, name: true, emailDomain: true } },
      createdAt: true,
    },
  });

  await sendVerificationEmail(user.email, verificationToken);

  return sendSuccess(
    res,
    user,
    'Registration successful. Please check your college email to verify your account.',
    201
  );
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = verifyEmailSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpires: { gte: new Date() },
    },
  });

  if (!user) {
    return sendError(
      res,
      'Invalid or expired verification token',
      400,
      'INVALID_TOKEN'
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  return sendSuccess(res, { isVerified: true }, 'College email verified successfully!');
}

export async function resendVerification(req: Request, res: Response) {
  const { email } = resendVerificationSchema.parse(req.body);
  const targetEmail = (req.user?.email || email)?.toLowerCase();

  if (!targetEmail) {
    return sendError(res, 'Email address is required to resend verification link', 400, 'EMAIL_REQUIRED');
  }

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    // Generic response to avoid email enumeration
    return sendSuccess(
      res,
      null,
      'If an account with that email exists, a verification link has been sent.'
    );
  }

  if (user.isVerified) {
    return sendError(res, 'This account is already verified.', 400, 'ALREADY_VERIFIED');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationTokenExpires: verificationExpires,
    },
  });

  await sendVerificationEmail(user.email, verificationToken);

  return sendSuccess(
    res,
    null,
    'Verification email resent successfully! Please check your college inbox.'
  );
}


export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      college: { select: { id: true, name: true, emailDomain: true } },
    },
  });

  if (!user) {
    return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (user.accountStatus === 'SUSPENDED') {
    return sendError(res, 'Your account has been suspended by an administrator', 403, 'SUSPENDED');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash, verificationToken, resetPasswordToken, ...safeUser } = user;

  return sendSuccess(res, { user: safeUser, token }, 'Login successful');
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return sendSuccess(res, null, 'Logged out successfully');
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      profilePhoto: true,
      collegeId: true,
      course: true,
      year: true,
      isVerified: true,
      role: true,
      accountStatus: true,
      createdAt: true,
      college: { select: { id: true, name: true, emailDomain: true } },
    },
  });

  if (!user) {
    return sendError(res, 'User not found', 404, 'NOT_FOUND');
  }

  // Calculate rating stats and completed trips count
  const ratings = await prisma.rating.findMany({
    where: { ratedUserId: user.id },
    select: { rating: true },
  });

  const avgRating = ratings.length
    ? Number((ratings.reduce((acc: number, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1))
    : 5.0;

  const completedTripsCount = await prisma.groupMember.count({
    where: {
      userId: user.id,
      group: { status: 'COMPLETED' },
    },
  });

  return sendSuccess(
    res,
    {
      ...user,
      rating: avgRating,
      ratingCount: ratings.length,
      completedTripsCount,
    },
    'User profile retrieved'
  );
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return sendSuccess(res, null, 'If that email exists in our system, a reset link was sent.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    },
  });

  await sendPasswordResetEmail(user.email, resetToken);

  return sendSuccess(res, null, 'If that email exists in our system, a reset link was sent.');
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = resetPasswordSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gte: new Date() },
    },
  });

  if (!user) {
    return sendError(res, 'Invalid or expired password reset token', 400, 'INVALID_TOKEN');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return sendSuccess(res, null, 'Password reset successful! You can now log in with your new password.');
}

export async function updateProfile(req: Request, res: Response) {
  const userId = req.user!.id;
  const validated = updateProfileSchema.parse(req.body);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: validated,
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      profilePhoto: true,
      course: true,
      year: true,
      isVerified: true,
      college: true,
    },
  });

  return sendSuccess(res, updatedUser, 'Profile updated successfully');
}
