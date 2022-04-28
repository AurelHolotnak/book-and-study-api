import { WithAuthProp } from "@clerk/clerk-sdk-node";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { Webhook } from "svix";
import { prisma } from "..";
import { ClerkUser } from "../types/types.helpers";
import { isAuthenticated } from "../middleware/auth";

const router = express.Router();

router.post(
  "/user-created",
  bodyParser.raw({ type: "application/json" }),
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
        return res.status(200).send("User already exists");
      }

      await prisma.user.create({
        data: {
          clerkId: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          profileImage: data.profile_image_url,
        },
      });

      return res.status(200).send("OK");
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.post(
  "/profile/me/edit",
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  async (req: WithAuthProp<Request>, res: Response) => {
    const clerkId = req.auth.userId!;
    const input = req.body;

    try {
      await prisma.user.update({
        where: {
          clerkId,
        },
        data: {
          name: input.name,
          isicCardId: input.isicCardId,
          titleBefore: input.titleBefore,
          titleAfter: input.titleAfter,
        },
      });

      return res.status(200).json({
        message: "Successfully updated user profile",
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.get(
  "/profile/me",
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  async (req: WithAuthProp<Request>, res: Response) => {
    const clerkId = req.auth.userId!;

    try {
      const user = await prisma.user.findUnique({
        where: {
          clerkId,
        },
      });

      if (!user) {
        return res.status(400).json({
          error: "User not found",
        });
      }

      return res.status(200).json({
        user,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

router.get(
  "/teachers",
  // @ts-ignore - express-clerk doesn't have a type for this
  isAuthenticated,
  async (req: WithAuthProp<Request>, res: Response) => {
    try {
      const teachers = await prisma.user.findMany({
        where: {
          isTeacher: true,
        },
      });

      return res.status(200).json({
        teachers,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

export default router;
