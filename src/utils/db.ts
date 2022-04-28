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
                  { startTime: { gt: startTime } },
                  { endTime: { lt: startTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: startTime } },
                  { endTime: { gt: endTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: startTime } },
                  { endTime: { gt: startTime } },
                  { endTime: { lt: endTime } },
                ],
              },
              {
                AND: [
                  { startTime: { gt: startTime } },
                  { endTime: { gt: endTime } },
                  { startTime: { lt: endTime } },
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
