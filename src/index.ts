import express from 'express';
import dotenv from 'dotenv';

import reservationRouter from './routes/reservation-router';
import userRouter from './routes/user-router';
import Clerk from '@clerk/clerk-sdk-node/dist/Clerk';

dotenv.config({ path: '.env' });

const clerk = new Clerk({ apiKey: process.env.CLERK_API_KEY });
const app = express();
app.use(clerk.expressRequireAuth());
app.use(reservationRouter);
app.use(userRouter);

app.listen(4000, () => {
  console.log('Server started on port 4000');
});
