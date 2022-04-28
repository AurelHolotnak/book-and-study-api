import express, { Request, Response } from 'express';
import { mqttDaco as mqtt } from '../mqtt-client';
import { prisma } from '../index';
import bodyParser from 'body-parser';
import { convertClerkIdToDbId } from '../utils/auth';

const SUB_CRED_TOPIC = 'iot/BookAndStudy/PostCred';
const PUB_CRED_TOPIC = 'iot/BookAndStudy/Access';

const SUB_REG_TOPIC = 'iot/BookAndStudy/RegisterPub';
const PUB_REG_TOPIC = 'iot/BookAndStudy/RegisterSub';

const router = express.Router();

mqtt.on('connect', function () {
  // subscribe to place the isic topic
  mqtt.subscribe(SUB_CRED_TOPIC, function (err) {
    if (!err) {
      console.log(`connected to ${SUB_CRED_TOPIC}`);
    }
  });

  // subscribe to register isic topic
  mqtt.subscribe(SUB_REG_TOPIC, function (err) {
    if (!err) {
      console.log(`connected to ${SUB_REG_TOPIC}`);
    }
  });
});

mqtt.on('message', async function (topic, message) {
  // message is Buffer
  if (topic === SUB_CRED_TOPIC) {
    const splitMessage = message.toString().split('/');
    const isicCardId = splitMessage[0];
    const currentTime = new Date();

    try {
      const user = await prisma.user.findUnique({
        where: {
          isicCardId: isicCardId,
        },
      });

      if (user?.isTeacher) {
        mqtt.publish(PUB_CRED_TOPIC, 'true');
        return;
      }

      const lab = await prisma.lab.findFirst({
        where: {
          labNumber: splitMessage[1],
        },
      });

      if (!lab) {
        throw new Error('Lab not found');
      }

      if (user?.isTeacher) {
        const updatedUser = prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            lastVisitedLabId: lab.id,
          },
        });
        mqtt.publish(PUB_CRED_TOPIC, 'true');
        return;
      }

      const reservations = await prisma.reservation.findMany({
        where: {
          AND: [
            {
              userId: user?.id,
            },
            {
              labId: lab?.id,
            },
            {
              startTime: {
                gte: currentTime,
              },
            },
            {
              endTime: {
                lte: currentTime,
              },
            },
          ],
        },
      });

      if (reservations.length === 0 || user?.id === undefined) {
        mqtt.publish(PUB_CRED_TOPIC, 'false');
      } else {
        mqtt.publish(PUB_CRED_TOPIC, 'true');
      }
    } catch (error: any) {
      console.log(error.message);
    }
  }
});

router.get(
  '/register-isic',
  bodyParser.raw({ type: 'application/json' }),
  // @ts-ignore - express-clerk doesn't have a type for this
  async (req: WithAuthProp<Request>, res) => {
    const clerkId = req.auth.userId!;

    console.log(`ClerkId: ${clerkId}`);

    try {
      await mqtt.publish(PUB_REG_TOPIC, 'register');
      await mqtt.on('message', async function (topic, message) {
        if (topic === SUB_REG_TOPIC) {
          const uid = await convertClerkIdToDbId(clerkId);
          console.log(`Message: ${message.toString()}`);

          const updatedUser = await prisma.user.update({
            where: {
              id: uid,
            },
            data: {
              isicCardId: message.toString(),
            },
          });

          console.log(`updatedUser: ${updatedUser}`);
        }
      });
      return res.status(200).json(true);
    } catch (error: any) {
      return res.status(200).json(false);
    }
  }
);

export default router;
