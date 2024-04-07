// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database';
//import routes from './routes';
import cookieParser from 'cookie-parser';
// import path from 'path';
import routes from './routes';
import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';

type User = {
  githubId: string;
  _id: string;
};

declare module 'express-session' {
  interface SessionData {
    user: User;
    id: string;
  }
}

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
const cors = require('cors');
app.use(cors({ credentials: true, origin: 'https://chat.openai.com' }));
app.use(cookieParser());
app.use(session({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'strict', // or 'lax' based on your requirements
  },
  secret: 'your_secret_key', // Use a secure, unique secret key
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }) // Use your MongoDB connection string
}));

// Then, after configuring express-session, initialize Passport and session support:
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the public directory
// app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => res.send('Hello World!'));
app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


