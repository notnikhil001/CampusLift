import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { rateTripSchema } from '../validators/groupValidators';
import { TripStatus } from '@prisma/client';

export async function getMyTrips(req: Request, res: Response) {
  const userId = req.user!.id;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });

  const groupIds = memberships.map((m) => m.groupId);

  const groups = await prisma.travelGroup.findMany({
    where: { id: { in: groupIds } },
    include: {
      fromLocation: { select: { name: true } },
      toLocation: { select: { name: true } },
      meetingPoint: { select: { name: true } },
      members: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: { id: true, name: true, profilePhoto: true, isVerified: true },
          },
        },
      },
      trips: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const upcoming: typeof groups = [];
  const active: typeof groups = [];
  const history: typeof groups = [];

  for (const group of groups) {
    const latestTrip = group.trips[0];
    if (latestTrip) {
      if (latestTrip.status === TripStatus.ACTIVE) {
        active.push(group);
      } else if (latestTrip.status === TripStatus.COMPLETED || latestTrip.status === TripStatus.CANCELLED) {
        history.push(group);
      } else {
        upcoming.push(group);
      }
    } else {
      if (['COMPLETED', 'CANCELLED'].includes(group.status)) {
        history.push(group);
      } else {
        upcoming.push(group);
      }
    }
  }

  return sendSuccess(res, { upcoming, active, history }, 'User trips retrieved');
}

export async function rateTrip(req: Request, res: Response) {
  const raterId = req.user!.id;
  const { tripId, ratedUserId, rating, tags, comment } = rateTripSchema.parse(req.body);

  if (raterId === ratedUserId) {
    return sendError(res, 'You cannot rate yourself', 400, 'SELF_RATING');
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { group: { include: { members: true } } },
  });

  if (!trip) {
    return sendError(res, 'Trip record not found', 404, 'NOT_FOUND');
  }

  if (trip.status !== TripStatus.COMPLETED) {
    return sendError(res, 'Ratings can only be submitted for completed trips', 400, 'TRIP_NOT_COMPLETED');
  }

  // Ensure both users were members of the group
  const raterMember = trip.group.members.some((m) => m.userId === raterId);
  const ratedMember = trip.group.members.some((m) => m.userId === ratedUserId);

  if (!raterMember || !ratedMember) {
    return sendError(res, 'Both users must have belonged to the trip group', 403, 'FORBIDDEN');
  }

  // Check duplicate rating
  const existingRating = await prisma.rating.findUnique({
    where: {
      tripId_raterId_ratedUserId: {
        tripId,
        raterId,
        ratedUserId,
      },
    },
  });

  if (existingRating) {
    return sendError(res, 'You have already rated this user for this trip', 409, 'DUPLICATE_RATING');
  }

  const newRating = await prisma.rating.create({
    data: {
      tripId,
      raterId,
      ratedUserId,
      rating,
      tags,
      comment,
    },
  });

  return sendSuccess(res, newRating, 'Rating submitted successfully', 201);
}
