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
