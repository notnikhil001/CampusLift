import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      id: string;
      email: string;
      name: string;
      collegeId: string;
    };
  };
}

export function initializeSocketIO(io: Server) {
  // Middleware: Authenticate socket connections via HTTP-only cookie or auth payload
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      let token: string | undefined;

      // 1. Check handshake headers cookie
      if (socket.handshake.headers.cookie) {
        const parsedCookies = cookie.parse(socket.handshake.headers.cookie);
        token = parsedCookies.token;
      }

      // 2. Fallback to auth object
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, collegeId: true, accountStatus: true },
      });

      if (!user || user.accountStatus === 'SUSPENDED') {
        return next(new Error('Unauthorized socket connection'));
      }

      socket.data.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        collegeId: user.collegeId,
      };

      next();
    } catch (err) {
      return next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) return;

    // Join personal notification channel
    socket.join(`user_${user.id}`);

    // Event: Join group chat room (verifies active membership first)
    socket.on('join_group', async ({ groupId }: { groupId: string }) => {
      try {
        const member = await prisma.groupMember.findFirst({
          where: { groupId, userId: user.id, status: 'ACTIVE' },
        });

        if (!member) {
          socket.emit('error', { message: 'You are not an active member of this group' });
          return;
        }

        socket.join(groupId);
        socket.emit('joined_group', { groupId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join group chat room' });
      }
    });

    // Event: Leave group room
    socket.on('leave_group_room', ({ groupId }: { groupId: string }) => {
      socket.leave(groupId);
    });

    // Event: Send chat message
    socket.on('send_message', async ({ groupId, content }: { groupId: string; content: string }) => {
      try {
        if (!content || !content.trim()) return;

        const member = await prisma.groupMember.findFirst({
          where: { groupId, userId: user.id, status: 'ACTIVE' },
        });

        if (!member) {
          socket.emit('error', { message: 'Must be an active member to send messages' });
          return;
        }

        const message = await prisma.message.create({
          data: {
            groupId,
            senderId: user.id,
            content: content.trim(),
            isSystemMessage: false,
          },
          include: {
            sender: {
              select: { id: true, name: true, profilePhoto: true },
            },
          },
        });

        io.to(groupId).emit('new_message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to deliver message' });
      }
    });

    // Event: Propose common time
    socket.on('propose_time', async ({ groupId, commonTime }: { groupId: string; commonTime: string }) => {
      try {
        const group = await prisma.travelGroup.update({
          where: { id: groupId },
          data: { commonTime },
        });

        const sysMsg = await prisma.message.create({
          data: {
            groupId,
            senderId: null,
            content: `${user.name} proposed travel time: ${commonTime}`,
            isSystemMessage: true,
          },
        });

        io.to(groupId).emit('time_updated', { commonTime, message: sysMsg });
      } catch (err) {
        socket.emit('error', { message: 'Failed to update travel time' });
      }
    });

    // Event: Confirm meeting point
    socket.on(
      'confirm_meeting_point',
      async ({ groupId, meetingPointId }: { groupId: string; meetingPointId: string }) => {
        try {
          const location = await prisma.location.findUnique({
            where: { id: meetingPointId },
          });

          if (!location) return;

          const group = await prisma.travelGroup.update({
            where: { id: groupId },
            data: { meetingPointId },
            include: { meetingPoint: true },
          });

          const sysMsg = await prisma.message.create({
            data: {
              groupId,
              senderId: null,
              content: `${user.name} confirmed meeting point: ${location.name}`,
              isSystemMessage: true,
            },
          });

          io.to(groupId).emit('meeting_point_updated', {
            meetingPoint: group.meetingPoint,
            message: sysMsg,
          });
        } catch (err) {
          socket.emit('error', { message: 'Failed to update meeting point' });
        }
      }
    );

    socket.on('disconnect', () => {
      // Clean up connection
    });
  });
}
