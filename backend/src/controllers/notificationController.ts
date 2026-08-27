import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';

export async function getNotifications(req: Request, res: Response) {
  const userId = req.user!.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, readAt: null },
  });

  return sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved');
}

export async function markAsRead(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });

  return sendSuccess(res, null, 'Notification marked as read');
}

export async function markAllAsRead(req: Request, res: Response) {
  const userId = req.user!.id;

  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return sendSuccess(res, null, 'All notifications marked as read');
}
