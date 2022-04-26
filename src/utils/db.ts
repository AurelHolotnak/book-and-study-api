import { prisma } from '..';

export const isLabFree = async (
  labId: string,
  startTime: Date,
  endTime: Date
) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        AND: [
          {
            labId,
          },
          {
            OR: [
              {
                AND: [
                  { startTime: { lt: startTime } },
                  { endTime: { gt: startTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gt: endTime } },
                ],
              },
            ],
          },
        ],
      },
    });

    return reservations.length === 0;
  } catch (error) {
    throw error;
  }
};
