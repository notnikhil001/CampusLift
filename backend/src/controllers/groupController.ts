import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import {
  joinGroupSchema,
  createGroupSchema,
  updateCommonTimeSchema,
  setMeetingPointSchema,
  updateGroupStatusSchema,
} from '../validators/groupValidators';
import { GroupStatus, GroupRole, MemberStatus, IntentStatus, TripStatus } from '@prisma/client';

export async function getGroup(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  const group = await prisma.travelGroup.findUnique({
    where: { id },
    include: {
      fromLocation: { select: { id: true, name: true, type: true } },
      toLocation: { select: { id: true, name: true, type: true } },
      meetingPoint: { select: { id: true, name: true, description: true } },
      members: {
        where: { status: MemberStatus.ACTIVE },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              profilePhoto: true,
              isVerified: true,
              course: true,
              year: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true, profilePhoto: true } },
        },
      },
      trips: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!group) {
    return sendError(res, 'Travel group not found', 404, 'NOT_FOUND');
  }

  // Check if current user is an active member
  const isMember = group.members.some((m) => m.userId === userId);

  return sendSuccess(
    res,
    {
      ...group,
      isMember,
    },
    'Group details retrieved'
  );
}

/**
 * Explicitly creates a single TravelGroup for a given intent.
 * Idempotent: If an active group already exists for this intent/creator, returns the existing group.
 */
export async function createGroup(req: Request, res: Response) {
  const userId = req.user!.id;
  const collegeId = req.user!.collegeId;
  const { intentId } = createGroupSchema.parse(req.body);

  const intent = await prisma.travelIntent.findUnique({
    where: { id: intentId },
    include: { creator: true, fromLocation: true, toLocation: true },
  });

  if (!intent) {
    return sendError(res, 'Travel intent not found', 404, 'NOT_FOUND');
  }

  if (intent.creatorId !== userId && req.user!.role !== 'ADMIN') {
    return sendError(res, 'Not authorized to create a group for this intent', 403, 'FORBIDDEN');
  }

  // Execute in database transaction to guarantee atomicity & idempotency
  const result = await prisma.$transaction(async (tx) => {
    // Check if user already has an active group membership linked to this intent or route/date
    const existingMembership = await tx.groupMember.findFirst({
      where: {
        userId,
        intentId,
        status: MemberStatus.ACTIVE,
        group: {
          status: { in: [GroupStatus.OPEN, GroupStatus.PLANNING, GroupStatus.READY, GroupStatus.ACTIVE] },
        },
      },
      include: { group: true },
    });

    if (existingMembership) {
      return { group: existingMembership.group, isExisting: true };
    }

    // Create new TravelGroup
    const group = await tx.travelGroup.create({
      data: {
        collegeId,
        fromLocationId: intent.fromLocationId,
        toLocationId: intent.toLocationId,
        date: intent.date,
        commonTime: intent.preferredTime || intent.startTime,
        status: GroupStatus.OPEN,
      },
    });

    // Add creator as LEADER
    await tx.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        intentId: intent.id,
        role: GroupRole.LEADER,
        status: MemberStatus.ACTIVE,
      },
    });

    // Mark intent matched
    await tx.travelIntent.update({
      where: { id: intentId },
      data: { status: IntentStatus.MATCHED },
    });

    // Create system message
    await tx.message.create({
      data: {
        groupId: group.id,
        senderId: null,
        content: `${intent.creator.name} created the travel group.`,
        isSystemMessage: true,
      },
    });

    return { group, isExisting: false };
  });

  return sendSuccess(
    res,
    { group: result.group, groupId: result.group.id },
    result.isExisting ? 'Existing group returned' : 'Travel group created successfully',
    result.isExisting ? 200 : 201
  );
}

/**
 * Explicitly joins an existing group.
 * Transactional: Handles idempotency and re-joining after status 'LEFT' cleanly.
 */
export async function joinGroup(req: Request, res: Response) {
  const userId = req.user!.id;
  const { groupId, intentId } = joinGroupSchema.parse(req.body);

  const group = await prisma.travelGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return sendError(res, 'Travel group not found', 404, 'NOT_FOUND');
  }

  if (['COMPLETED', 'CANCELLED', 'CLOSED'].includes(group.status)) {
    return sendError(res, `Cannot join a group that is ${group.status.toLowerCase()}`, 400, 'INVALID_STATUS');
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Check existing membership record (active or left)
    const existingMember = await tx.groupMember.findFirst({
      where: { groupId, userId },
    });

    let member;
    if (existingMember) {
      if (existingMember.status === MemberStatus.ACTIVE) {
        // Already active member - return gracefully (idempotent)
        return { member: existingMember, isAlreadyMember: true };
      }

      // Was previously LEFT or REMOVED - update existing row to ACTIVE to avoid @@unique([groupId, userId]) failure
      member = await tx.groupMember.update({
        where: { id: existingMember.id },
        data: {
          status: MemberStatus.ACTIVE,
          joinedAt: new Date(),
          leftAt: null,
          intentId: intentId || existingMember.intentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              profilePhoto: true,
              isVerified: true,
              course: true,
              year: true,
            },
          },
        },
      });
    } else {
      // Create new GroupMember
      member = await tx.groupMember.create({
        data: {
          groupId,
          userId,
          intentId,
          role: GroupRole.MEMBER,
          status: MemberStatus.ACTIVE,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              profilePhoto: true,
              isVerified: true,
              course: true,
              year: true,
            },
          },
        },
      });
    }

    // Update intent status if provided
    if (intentId) {
      await tx.travelIntent.update({
        where: { id: intentId },
        data: { status: IntentStatus.MATCHED },
      });
    }

    // Post system message
    await tx.message.create({
      data: {
        groupId,
        senderId: null,
        content: `${user?.name || 'A student'} joined the travel group.`,
        isSystemMessage: true,
      },
    });

    // If group status was OPEN, transition to PLANNING
    if (group.status === GroupStatus.OPEN) {
      await tx.travelGroup.update({
        where: { id: groupId },
        data: { status: GroupStatus.PLANNING },
      });
    }

    // Notify other active members
    const activeMembers = await tx.groupMember.findMany({
      where: { groupId, status: MemberStatus.ACTIVE, userId: { not: userId } },
    });

    for (const existing of activeMembers) {
      await tx.notification.create({
        data: {
          userId: existing.userId,
          type: 'GROUP_JOIN',
          title: 'New Member Joined',
          body: `${user?.name || 'A student'} joined your travel group!`,
          metadata: { groupId },
        },
      });
    }

    return { member, isAlreadyMember: false };
  });

  return sendSuccess(
    res,
    { member: result.member, groupId },
    result.isAlreadyMember ? 'You are already a member of this group' : 'Joined travel group successfully',
    200
  );
}

/**
 * Legacy handler refactored for safety: prevents spawning duplicate groups.
 * If a group already exists for target intent creator, joins it instead of creating duplicates.
 */
export async function createGroupFromIntent(req: Request, res: Response) {
  const userId = req.user!.id;
  const { targetIntentId } = req.body;

  const targetIntent = await prisma.travelIntent.findUnique({
    where: { id: targetIntentId },
    include: { creator: true },
  });

  if (!targetIntent || targetIntent.status !== IntentStatus.ACTIVE) {
    return sendError(res, 'Target travel intent is not active or available', 400, 'INTENT_UNAVAILABLE');
  }

  // Check if target intent creator already has an open/planning group
  const existingGroupMember = await prisma.groupMember.findFirst({
    where: {
      userId: targetIntent.creatorId,
      status: MemberStatus.ACTIVE,
      group: {
        status: { in: [GroupStatus.OPEN, GroupStatus.PLANNING] },
        fromLocationId: targetIntent.fromLocationId,
        toLocationId: targetIntent.toLocationId,
        date: targetIntent.date,
      },
    },
  });

  if (existingGroupMember) {
    // Join existing group instead of creating a duplicate group
    req.body.groupId = existingGroupMember.groupId;
    return joinGroup(req, res);
  }

  // Otherwise, create group atomically for target intent
  const group = await prisma.travelGroup.create({
    data: {
      collegeId: req.user!.collegeId,
      fromLocationId: targetIntent.fromLocationId,
      toLocationId: targetIntent.toLocationId,
      date: targetIntent.date,
      commonTime: targetIntent.preferredTime || targetIntent.startTime,
      status: GroupStatus.PLANNING,
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: targetIntent.creatorId,
      intentId: targetIntent.id,
      role: GroupRole.LEADER,
      status: MemberStatus.ACTIVE,
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId,
      role: GroupRole.MEMBER,
      status: MemberStatus.ACTIVE,
    },
  });

  await prisma.travelIntent.update({
    where: { id: targetIntentId },
    data: { status: IntentStatus.MATCHED },
  });

  return sendSuccess(res, { groupId: group.id }, 'Travel group created and joined', 201);
}

export async function leaveGroup(req: Request, res: Response) {
  const { id: groupId } = req.params;
  const userId = req.user!.id;

  const member = await prisma.groupMember.findFirst({
    where: { groupId, userId, status: MemberStatus.ACTIVE },
  });

  if (!member) {
    return sendError(res, 'You are not an active member of this group', 400, 'NOT_MEMBER');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Mark member LEFT
  await prisma.groupMember.update({
    where: { id: member.id },
    data: {
      status: MemberStatus.LEFT,
      leftAt: new Date(),
    },
  });

  // System Message
  await prisma.message.create({
    data: {
      groupId,
      senderId: null,
      content: `${user?.name || 'A student'} left the travel group.`,
      isSystemMessage: true,
    },
  });

  // Check remaining active members
  const remaining = await prisma.groupMember.findMany({
    where: { groupId, status: MemberStatus.ACTIVE },
  });

  if (remaining.length === 0) {
    await prisma.travelGroup.update({
      where: { id: groupId },
      data: { status: GroupStatus.CANCELLED },
    });
  } else if (member.role === GroupRole.LEADER) {
    // Reassign leader to first active member
    await prisma.groupMember.update({
      where: { id: remaining[0].id },
      data: { role: GroupRole.LEADER },
    });
  }

  return sendSuccess(res, null, 'You have left the travel group');
}

export async function updateCommonTime(req: Request, res: Response) {
  const { id: groupId } = req.params;
  const { commonTime } = updateCommonTimeSchema.parse(req.body);

  const group = await prisma.travelGroup.update({
    where: { id: groupId },
    data: { commonTime },
  });

  await prisma.message.create({
    data: {
      groupId,
      senderId: null,
      content: `Travel time was updated to ${commonTime}.`,
      isSystemMessage: true,
    },
  });

  return sendSuccess(res, group, 'Common travel time updated');
}

export async function setMeetingPoint(req: Request, res: Response) {
  const { id: groupId } = req.params;
  const { meetingPointId } = setMeetingPointSchema.parse(req.body);

  const location = await prisma.location.findUnique({
    where: { id: meetingPointId },
  });

  if (!location) {
    return sendError(res, 'Selected location not found', 404, 'NOT_FOUND');
  }

  const group = await prisma.travelGroup.update({
    where: { id: groupId },
    data: { meetingPointId },
    include: { meetingPoint: true },
  });

  await prisma.message.create({
    data: {
      groupId,
      senderId: null,
      content: `Meeting point was confirmed: ${location.name}`,
      isSystemMessage: true,
    },
  });

  return sendSuccess(res, group, 'Meeting point updated');
}

export async function updateStatus(req: Request, res: Response) {
  const { id: groupId } = req.params;
  const { status } = updateGroupStatusSchema.parse(req.body);

  const group = await prisma.travelGroup.update({
    where: { id: groupId },
    data: { status },
  });

  // If status moved to ACTIVE or READY, handle trip creation
  if (status === GroupStatus.ACTIVE || status === GroupStatus.READY) {
    const existingTrip = await prisma.trip.findFirst({
      where: { groupId },
    });

    if (!existingTrip) {
      await prisma.trip.create({
        data: {
          groupId,
          status: TripStatus.UPCOMING,
          scheduledTime: new Date(),
        },
      });
    }
  } else if (status === GroupStatus.COMPLETED) {
    const trip = await prisma.trip.findFirst({
      where: { groupId, status: { in: [TripStatus.UPCOMING, TripStatus.ACTIVE] } },
    });
    if (trip) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: TripStatus.COMPLETED, completedAt: new Date() },
      });
    }
  }

  await prisma.message.create({
    data: {
      groupId,
      senderId: null,
      content: `Group status changed to ${status}.`,
      isSystemMessage: true,
    },
  });

  return sendSuccess(res, group, `Group status updated to ${status}`);
}
