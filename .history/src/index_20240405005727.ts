// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database';
//import routes from './routes';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoutes from './routes/authRoutes';


dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// app.get('/', (req, res) => res.send('Hello World!'));
app.use('/api', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


