import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Clerk from '@clerk/clerk-sdk-node/dist/Clerk';
import { PrismaClient } from '@prisma/client';

import labRouter from './routes/lab-router';
import userRouter from './routes/user-router';
import reservationRouter from './routes/reservation-router';

dotenv.config({ path: '.env' });

export const clerk = new Clerk({ apiKey: process.env.CLERK_API_KEY });
export const prisma = new PrismaClient();
prisma.$connect();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(clerk.expressWithAuth());
app.use(labRouter);
app.use(userRouter);
app.use(reservationRouter);

app.listen(4001, () => {
  console.log('Server started on port 4000');
});
