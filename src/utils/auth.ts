import { WithAuthProp } from '@clerk/clerk-sdk-node';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '..';

export async function convertClerkIdToDbId(clerkId?: string | null) {
  const user = await prisma.user.findUnique({
    where: {
      clerkId: clerkId || '',
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.id;
}

export function isAuthenticated(
  req: WithAuthProp<Request>,
  res: Response,
  next: NextFunction
) {
  if (req.auth.userId) {
    return next();
  }

  return res.status(401).send('Unauthorized');
}

export async function isTeacher(
  req: WithAuthProp<Request>,
  _res: Response,
  next: NextFunction
) {
  const clerkId = req.auth.userId;

  try {
    const uid = await convertClerkIdToDbId(clerkId);

    const user = await prisma.user.findUnique({
      where: {
        id: uid,
      },
    });

    if (!user?.isTeacher) {
      throw new Error('User is not a teacher');
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
