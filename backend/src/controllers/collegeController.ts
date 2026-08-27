import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export async function getColleges(req: Request, res: Response) {
  const colleges = await prisma.college.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      emailDomain: true,
      logo: true,
    },
    orderBy: { name: 'asc' },
  });

  return sendSuccess(res, colleges, 'Colleges retrieved');
}

export async function getCollegeLocations(req: Request, res: Response) {
  const { collegeId } = req.params;

  const locations = await prisma.location.findMany({
    where: {
      collegeId,
      active: true,
    },
    select: {
      id: true,
      collegeId: true,
      name: true,
      description: true,
      type: true,
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  return sendSuccess(res, locations, 'College locations retrieved');
}
