// import authRoutes from './authRout
import express from 'express';
import authRoutes from './authRoutes'; 
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import cookieParser from 'cookie-parser';
