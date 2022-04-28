import express, { Request, Response } from "express";
import { mqttDaco as mqtt } from "../mqtt-client";
import { prisma } from "../index";

const router = express.Router();

const cardAndUidMap = new Map([["0x2a44a648", "62680eefec7c8e9e7b412915"]]);

mqtt.on("connect", function () {
  mqtt.subscribe("iot/BookAndStudy/PostCred", function (err) {
    if (!err) {
      // mqtt.publish('iot/BookAndStudy/Access', 'Hello mqtt')
      console.log("connected to iot/BookAndStudy/PostCred");
    }
  });
});

mqtt.on("message", async function (topic, message) {
  // message is Buffer
  const splitMessage = message.toString().split("/");

  const id = cardAndUidMap.get(splitMessage[0]);
  const currentTime = new Date();

  try {
    const lab = await prisma.lab.findFirst({
      where: {
        labNumber: splitMessage[1],
      },
    });

    const reservations = await prisma.reservation.findMany({
      where: {
        AND: [
          {
            userId: id,
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

    if (reservations.length === 0 || id === undefined) {
      mqtt.publish("iot/BookAndStudy/Access", "false");
    } else {
      mqtt.publish("iot/BookAndStudy/Access", "true");
    }
  } catch (error: any) {
    console.log(error.message);
  }
});

export default router;
