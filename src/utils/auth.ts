import { prisma } from '..';

export async function convertClerkIdToDbId(clerkId?: string | null) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: clerkId || '',
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.id;
  } catch (error) {
    throw error;
  }
}
