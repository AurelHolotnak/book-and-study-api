import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Clerk from '@clerk/clerk-sdk-node/dist/Clerk';
import { PrismaClient } from '@prisma/client';
import { connect } from 'mqtt'; // import connect from mqtt

import labRouter from './routes/lab-router';
import userRouter from './routes/user-router';
import reservationRouter from './routes/reservation-router';
import mqttRouter from './routes/mqtt-router';

dotenv.config({ path: '.env' });

export const clerk = new Clerk({ apiKey: process.env.CLERK_API_KEY });
export const prisma = new PrismaClient();

// export const mqtt  = connect('broker.hivemq.com')

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
app.use(mqttRouter);

app.listen(4001, () => {
  console.log('Server started on port 4000');
});
