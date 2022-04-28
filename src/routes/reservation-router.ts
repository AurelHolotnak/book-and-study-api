import { WithAuthProp } from '@clerk/clerk-sdk-node';
import express, { Request, Response } from 'express';
import { prisma } from '..';
import { isAuthenticated } from '../middleware/auth';
import { convertClerkIdToDbId } from '../utils/auth';

const router = express.Router();

router.get(
  '/reservations/me',
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  async (req: WithAuthProp<Request>, res: Response) => {
    const clerkId = req.auth.userId!;

    try {
      const uid = await convertClerkIdToDbId(clerkId);
      const reservations = await prisma.reservation.findMany({
        where: {
          userId: uid,
        },
        include: {
          lab: true,
          user: true,
        },
      });

      return res.status(200).json({
        reservations,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

export default router;
