import express from 'express';
import dotenv from 'dotenv';

import labRouter from './routes/lab-router';
import userRouter from './routes/user-router';
import Clerk from '@clerk/clerk-sdk-node/dist/Clerk';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env' });

export const clerk = new Clerk({ apiKey: process.env.CLERK_API_KEY });
export const prisma = new PrismaClient();
prisma.$connect();

const app = express();

app.use(clerk.expressWithAuth());
app.use(labRouter);
app.use(userRouter);

app.listen(4000, () => {
  console.log('Server started on port 4000');
});
