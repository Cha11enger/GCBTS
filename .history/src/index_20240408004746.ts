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


dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'your_secret', // Replace 'your_secret' with a real secret key
  resave: false,
  saveUninitialized: true,
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


