import { WithAuthProp } from '@clerk/clerk-sdk-node';
import express, { Request, Response } from 'express';
import { prisma } from '..';
import {
  isAuthenticated,
  isLabOwner,
  isReservationOwner,
  isTeacher,
} from '../middleware/auth';
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

      await prisma.reservation.create({
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
  isReservationOwner,
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

router.post(
  '/free-labs',
  // @ts-ignore - express-clerk doesn't have a type for this
  // isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { startTime, endTime } = req.body;
      const labs = await prisma.lab.findMany();

      const freeLabs = await Promise.all(
        labs.map(async (lab) => {
          const isFree = await isLabFree(lab.id, startTime, endTime);

          return {
            ...lab,
            isFree,
          };
        })
      );

      return res.status(200).json({
        labs: freeLabs.filter((lab) => lab.isFree),
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.post(
  '/create-lab',
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  isTeacher,
  async (req: WithAuthProp<Request>, res: Response) => {
    const { labName, labCapacity, labDescription, floor, building, labNumber } =
      req.body;
    const clerkId = req.auth.userId!;

    try {
      const teacherId = await convertClerkIdToDbId(clerkId);
      await prisma.lab.create({
        data: {
          labCapacity,
          labDescription,
          labName,
          labNumber,
          floor,
          building,
          userId: teacherId,
        },
      });

      return res.status(200).json({
        message: 'Successfully created lab',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.post(
  '/edit-lab/:labId',
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  isTeacher,
  isLabOwner,
  async (req: WithAuthProp<Request>, res: Response) => {
    const { labName, labCapacity, labDescription, labNumber, teacherId } =
      req.body;
    const labId = req.params.labId;

    try {
      await prisma.lab.update({
        where: {
          id: labId,
        },
        data: {
          labCapacity,
          labDescription,
          labName,
          labNumber,
          userId: teacherId,
        },
      });

      return res.status(200).json({
        message: 'Successfully edited lab',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.get(
  '/delete-lab/:labId',
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  isTeacher,
  isLabOwner,
  async (req: WithAuthProp<Request>, res: Response) => {
    const labId = req.params.labId;
    try {
      const labReservations = prisma.reservation.deleteMany({
        where: {
          labId,
        },
      });

      const lab = prisma.lab.delete({
        where: {
          id: labId,
        },
      });

      await prisma.$transaction([labReservations, lab]);

      return res.status(200).json({
        message: 'Successfully deleted lab',
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

export default router;
