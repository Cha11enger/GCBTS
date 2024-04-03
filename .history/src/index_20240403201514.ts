// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database';
//import routes from './routes';
import routes from './routes';
import cookieParser from 'cookie-parser';

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.send('Hello World!'));
app.use

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


