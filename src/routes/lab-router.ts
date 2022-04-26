import { WithAuthProp } from '@clerk/clerk-sdk-node';
import express, { Request, Response } from 'express';
import { prisma } from '..';
import { isAuthenticated } from '../middleware/auth';
import { convertClerkIdToDbId } from '../utils/auth';
import { isLabFree } from '../utils/db';

const router = express.Router();

router.post(
  '/is-lab-free/:labId',
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  async (req: WithAuthProp<Request>, res: Response) => {
    const { startTime, endTime } = req.body;
    const labId = req.params.labId;

    try {
      const isFree = await isLabFree(labId, startTime, endTime);

      // when user creates a reservation, we will create on reservation pre hour and then we will check if amount of free reservations is more than duration
      if (!isFree) {
        return res.status(200).json({
          message: 'Lab is not free at this time',
        });
      }

      return res.status(200).json({
        isFree,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.post(
  '/reserve-lab/:labId',
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  async (req: WithAuthProp<Request>, res: Response) => {
    const { startTime, endTime, reservationName, email } = req.body;
    const labId = req.params.labId;
    const clerkId = req.auth.userId!;

    try {
      const user = await prisma.user.findUnique({
        where: {
          clerkId,
        },
      });

      if (!user) {
        return res.status(400).json({
          error: 'User not found',
        });
      }

      const isFree = await isLabFree(labId, startTime, endTime);

      if (!isFree) {
        return res.status(400).json({
          error: 'Lab is not free at this time',
        });
      }

      const userId = await convertClerkIdToDbId(clerkId);

      const reservation = await prisma.reservation.create({
        data: {
          labId,
          userId,
          name: reservationName,
          startTime,
          endTime,
          email,
        },
      });

      return res.status(200).json({
        message: `Successfully reserved lab for a ${endTime} hour/s`,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.post(
  '/cancel-reservation/:reservationId',
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  async (req: WithAuthProp<Request>, res: Response) => {
    const reservationId = req.params.reservationId;
    const clerkId = req.auth.userId!;

    try {
      const user = await prisma.user.findUnique({
        where: {
          clerkId,
        },
      });

      if (!user) {
        return res.status(400).json({
          error: 'User not found',
        });
      }

      await prisma.reservation.delete({
        where: {
          id: reservationId,
        },
      });

      return res.status(200).json({
        message: 'Successfully cancelled reservation',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

export default router;
