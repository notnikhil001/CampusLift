import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { reportSchema, blockUserSchema } from '../validators/safetyValidators';

export async function createReport(req: Request, res: Response) {
  const reporterId = req.user!.id;
  const validated = reportSchema.parse(req.body);

  if (validated.reportedUserId && validated.reportedUserId === reporterId) {
    return sendError(res, 'You cannot report yourself', 400, 'SELF_REPORT');
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      reportedUserId: validated.reportedUserId,
      groupId: validated.groupId,
      category: validated.category,
      description: validated.description,
    },
  });

  return sendSuccess(res, report, 'Report submitted successfully. Our team will review it.', 201);
}

export async function blockUser(req: Request, res: Response) {
  const blockerId = req.user!.id;
  const { blockedUserId } = blockUserSchema.parse(req.body);

  if (blockerId === blockedUserId) {
    return sendError(res, 'You cannot block yourself', 400, 'SELF_BLOCK');
  }

  const existing = await prisma.block.findUnique({
    where: {
      blockerId_blockedUserId: {
        blockerId,
        blockedUserId,
      },
    },
  });

  if (existing) {
    return sendError(res, 'User is already blocked', 400, 'ALREADY_BLOCKED');
  }

  const block = await prisma.block.create({
    data: {
      blockerId,
      blockedUserId,
    },
    include: {
      blockedUser: { select: { id: true, name: true } },
    },
  });

  return sendSuccess(res, block, 'User blocked successfully', 201);
}

export async function unblockUser(req: Request, res: Response) {
  const blockerId = req.user!.id;
  const { blockedUserId } = req.params;

  await prisma.block.deleteMany({
    where: { blockerId, blockedUserId },
  });

  return sendSuccess(res, null, 'User unblocked successfully');
}

export async function getBlocks(req: Request, res: Response) {
  const blockerId = req.user!.id;

  const blocks = await prisma.block.findMany({
    where: { blockerId },
    include: {
      blockedUser: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          course: true,
          year: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, blocks, 'Blocked users retrieved');
}
