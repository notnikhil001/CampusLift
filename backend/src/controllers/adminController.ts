import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { collegeSchema, locationSchema, resolveReportSchema } from '../validators/safetyValidators';

export async function getDashboardMetrics(req: Request, res: Response) {
  const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
  const verifiedStudents = await prisma.user.count({ where: { role: 'STUDENT', isVerified: true } });
  const activeIntents = await prisma.travelIntent.count({ where: { status: 'ACTIVE' } });
  const activeGroups = await prisma.travelGroup.count({
    where: { status: { in: ['OPEN', 'PLANNING', 'READY', 'ACTIVE'] } },
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const tripsToday = await prisma.travelGroup.count({ where: { date: todayStr } });
  const completedTrips = await prisma.trip.count({ where: { status: 'COMPLETED' } });
  const openReports = await prisma.report.count({ where: { status: 'OPEN' } });

  return sendSuccess(
    res,
    {
      totalStudents,
      verifiedStudents,
      activeIntents,
      activeGroups,
      tripsToday,
      completedTrips,
      openReports,
    },
    'Admin dashboard metrics retrieved'
  );
}

export async function getUsers(req: Request, res: Response) {
  const { search, status, verified } = req.query;

  const where: any = {};
  if (status) where.accountStatus = status;
  if (verified !== undefined) where.isVerified = verified === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      course: true,
      year: true,
      isVerified: true,
      role: true,
      accountStatus: true,
      createdAt: true,
      college: { select: { id: true, name: true, emailDomain: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, users, 'Users retrieved');
}

export async function updateUserStatus(req: Request, res: Response) {
  const { userId } = req.params;
  const { accountStatus } = req.body;

  if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) {
    return sendError(res, 'Invalid account status', 400, 'INVALID_STATUS');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { accountStatus },
    select: { id: true, name: true, email: true, accountStatus: true },
  });

  return sendSuccess(res, user, `User account status updated to ${accountStatus}`);
}

export async function deleteUser(req: Request, res: Response) {
  const { userId } = req.params;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return sendError(res, 'User account not found', 404, 'NOT_FOUND');
  }

  if (targetUser.role === 'ADMIN') {
    return sendError(res, 'Cannot delete an administrator account', 400, 'FORBIDDEN');
  }

  // Deleting user triggers Prisma onDelete: Cascade for intents, memberships, ratings, blocks, notifications
  await prisma.user.delete({
    where: { id: userId },
  });

  return sendSuccess(res, null, `Student account (${targetUser.name}) and all related data deleted successfully`);
}

export async function getAdminColleges(req: Request, res: Response) {
  const colleges = await prisma.college.findMany({
    include: {
      _count: { select: { users: true, locations: true } },
    },
    orderBy: { name: 'asc' },
  });
  return sendSuccess(res, colleges, 'Colleges retrieved');
}

export async function createCollege(req: Request, res: Response) {
  const validated = collegeSchema.parse(req.body);

  const college = await prisma.college.create({
    data: validated,
  });
  return sendSuccess(res, college, 'College created successfully', 201);
}

export async function updateCollege(req: Request, res: Response) {
  const { id } = req.params;
  const validated = collegeSchema.partial().parse(req.body);

  const college = await prisma.college.update({
    where: { id },
    data: validated,
  });
  return sendSuccess(res, college, 'College updated successfully');
}

export async function getAdminLocations(req: Request, res: Response) {
  const { collegeId } = req.query;

  const locations = await prisma.location.findMany({
    where: collegeId ? { collegeId: collegeId as string } : {},
    include: { college: { select: { name: true } } },
    orderBy: [{ collegeId: 'asc' }, { type: 'asc' }, { name: 'asc' }],
  });

  return sendSuccess(res, locations, 'Locations retrieved');
}

export async function createLocation(req: Request, res: Response) {
  const validated = locationSchema.parse(req.body);

  const location = await prisma.location.create({
    data: validated,
    include: { college: { select: { name: true } } },
  });

  return sendSuccess(res, location, 'Location created successfully', 201);
}

export async function updateLocation(req: Request, res: Response) {
  const { id } = req.params;
  const validated = locationSchema.partial().parse(req.body);

  const location = await prisma.location.update({
    where: { id },
    data: validated,
    include: { college: { select: { name: true } } },
  });

  return sendSuccess(res, location, 'Location updated successfully');
}

export async function getAdminReports(req: Request, res: Response) {
  const { status } = req.query;

  const reports = await prisma.report.findMany({
    where: status ? { status: status as any } : {},
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reportedUser: { select: { id: true, name: true, email: true } },
      group: { select: { id: true, date: true, fromLocation: true, toLocation: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, reports, 'Reports retrieved');
}

export async function resolveReport(req: Request, res: Response) {
  const { id } = req.params;
  const { status, adminNotes } = resolveReportSchema.parse(req.body);

  const report = await prisma.report.update({
    where: { id },
    data: {
      status,
      adminNotes,
      resolvedAt: status === 'RESOLVED' || status === 'REJECTED' ? new Date() : null,
    },
  });

  return sendSuccess(res, report, `Report updated to ${status}`);
}
