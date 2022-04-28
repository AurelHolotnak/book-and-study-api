import { WithAuthProp } from "@clerk/clerk-sdk-node";
import { NextFunction, Request, Response } from "express";
import { prisma } from "..";
import { convertClerkIdToDbId } from "../utils/auth";

export function isAuthenticated(
  req: WithAuthProp<Request>,
  res: Response,
  next: NextFunction
) {
  if (req.auth.userId) {
    return next();
  }

  return res.status(401).send("Unauthorized");
}

export async function isTeacher(
  req: WithAuthProp<Request>,
  res: Response,
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
      throw new Error("User is not a teacher");
    }

    return next();
  } catch (error: any) {
    return res.status(400).send(error.message);
  }
}

export async function isReservationOwner(
  req: WithAuthProp<Request>,
  res: Response,
  next: NextFunction
) {
  const clerkId = req.auth.userId;
  const reservationId = req.params.reservationId;

  try {
    const uid = await convertClerkIdToDbId(clerkId);

    const reservation = await prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },
    });

    if (!reservation?.userId || reservation.userId !== uid) {
      throw new Error("User is not the reservation owner");
    }

    return next();
  } catch (error: any) {
    return res.status(400).send(error.message);
  }
}
