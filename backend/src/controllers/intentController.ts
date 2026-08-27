import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { createIntentSchema } from '../validators/intentValidators';
import {
  computeEffectiveTimeWindow,
  evaluateMatchQuality,
} from '../utils/matching';
import { IntentStatus, GroupStatus, LocationType } from '@prisma/client';

export async function createIntent(req: Request, res: Response) {
  const userId = req.user!.id;
  const collegeId = req.user!.collegeId;

  const validated = createIntentSchema.parse(req.body);

  const { effectiveStart, effectiveEnd } = computeEffectiveTimeWindow(
    validated.date,
    validated.timeMode,
    validated.startTime,
    validated.endTime,
    validated.preferredTime,
    validated.flexibilityMinutes
  );

  const intent = await prisma.travelIntent.create({
    data: {
      creatorId: userId,
      fromLocationId: validated.fromLocationId,
      toLocationId: validated.toLocationId,
      date: validated.date,
      timeMode: validated.timeMode,
      startTime: validated.startTime,
      endTime: validated.endTime,
      preferredTime: validated.preferredTime,
      flexibilityMinutes: validated.flexibilityMinutes,
      effectiveStart,
      effectiveEnd,
      note: validated.note,
      status: IntentStatus.ACTIVE,
    },
    include: {
      fromLocation: { select: { id: true, name: true, type: true } },
      toLocation: { select: { id: true, name: true, type: true } },
      creator: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          course: true,
          year: true,
          profilePhoto: true,
        },
      },
    },
  });

  // Find blocked users (given or received)
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedUserId: userId }],
    },
  });
  const blockedUserIds = blocks.map((b) =>
    b.blockerId === userId ? b.blockedUserId : b.blockerId
  );

  // Search for matching open TravelGroups
  const openGroups = await prisma.travelGroup.findMany({
    where: {
      collegeId,
      fromLocationId: validated.fromLocationId,
      toLocationId: validated.toLocationId,
      date: validated.date,
      status: { in: [GroupStatus.OPEN, GroupStatus.PLANNING] },
    },
    include: {
      fromLocation: { select: { id: true, name: true, type: true } },
      toLocation: { select: { id: true, name: true, type: true } },
      meetingPoint: { select: { id: true, name: true, description: true } },
      members: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              course: true,
              year: true,
              profilePhoto: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter groups with blocked users and mark user membership status
  const validGroups = openGroups
    .filter((g) => !g.members.some((m) => blockedUserIds.includes(m.userId)))
    .map((g) => ({
      ...g,
      isMember: g.members.some((m) => m.userId === userId),
    }));

  return sendSuccess(
    res,
    {
      intent,
      matchingGroups: validGroups,
    },
    'Travel intent created successfully',
    201
  );
}

export async function getFeed(req: Request, res: Response) {
  const collegeId = req.user?.collegeId;
  const userId = req.user?.id;

  const { direction, locationId, date } = req.query;
  const todayStr = (date as string) || new Date().toISOString().split('T')[0];

  // Blocked users
  let blockedUserIds: string[] = [];
  if (userId) {
    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedUserId: userId }] },
    });
    blockedUserIds = blocks.map((b) => (b.blockerId === userId ? b.blockedUserId : b.blockerId));
  }

  // Base location conditions
  const locationWhere: any = {};
  if (direction === 'FROM_CAMPUS') {
    locationWhere.fromLocation = { type: LocationType.CAMPUS };
    if (locationId) locationWhere.toLocationId = locationId as string;
  } else if (direction === 'TO_CAMPUS') {
    locationWhere.toLocation = { type: LocationType.CAMPUS };
    if (locationId) locationWhere.fromLocationId = locationId as string;
  } else if (locationId) {
    locationWhere.OR = [{ fromLocationId: locationId }, { toLocationId: locationId }];
  }

  // Fetch groups
  const groups = await prisma.travelGroup.findMany({
    where: {
      ...(collegeId ? { collegeId } : {}),
      date: todayStr,
      status: { in: [GroupStatus.OPEN, GroupStatus.PLANNING, GroupStatus.READY] },
      ...locationWhere,
    },
    include: {
      fromLocation: { select: { id: true, name: true, type: true } },
      toLocation: { select: { id: true, name: true, type: true } },
      meetingPoint: { select: { id: true, name: true } },
      members: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              profilePhoto: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch individual intents
  const intents = await prisma.travelIntent.findMany({
    where: {
      creatorId: { notIn: blockedUserIds },
      ...(collegeId ? { creator: { collegeId } } : {}),
      date: todayStr,
      status: IntentStatus.ACTIVE,
      ...locationWhere,
    },
    include: {
      fromLocation: { select: { id: true, name: true, type: true } },
      toLocation: { select: { id: true, name: true, type: true } },
      creator: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          course: true,
          year: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(
    res,
    {
      groups: groups.filter((g) => !g.members.some((m) => blockedUserIds.includes(m.userId))),
      intents,
    },
    'Feed retrieved successfully'
  );
}

export async function cancelIntent(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  const intent = await prisma.travelIntent.findUnique({
    where: { id },
  });

  if (!intent) {
    return sendError(res, 'Travel intent not found', 404, 'NOT_FOUND');
  }

  if (intent.creatorId !== userId && req.user!.role !== 'ADMIN') {
    return sendError(res, 'Not authorized to cancel this intent', 403, 'FORBIDDEN');
  }

  const updated = await prisma.travelIntent.update({
    where: { id },
    data: { status: IntentStatus.CANCELLED },
  });

  return sendSuccess(res, updated, 'Travel intent cancelled');
}
