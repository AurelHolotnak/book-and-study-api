import { WithAuthProp } from '@clerk/clerk-sdk-node';
import bodyParser from 'body-parser';
import express, { Request } from 'express';
import { Webhook } from 'svix';
import { prisma } from '..';
import { ClerkUser } from '../types/types.helpers';

const router = express.Router();

router.post(
  '/user-created',
  bodyParser.raw({ type: 'application/json' }),
  // @ts-ignore - express-clerk doesn't have a type for this
  async (req: WithAuthProp<Request>, res) => {
    const payload = req.body;
    const headers: any = req.headers;

    const webhook = new Webhook(process.env.SVIX_SECRET!);

    try {
      const { data }: { data: ClerkUser } = webhook.verify(
        payload,
        headers
      ) as { data: ClerkUser };

      const user = await prisma.user.findUnique({
        where: {
          email: data.email_addresses[0].email_address,
        },
      });

      if (user) {
        return res.status(200).send('User already exists');
      }

      await prisma.user.create({
        data: {
          clerkId: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          profileImage: data.profile_image_url,
        },
      });

      return res.status(200).send('OK');
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.get('');

export default router;
