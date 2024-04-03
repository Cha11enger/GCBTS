// src/routes/authRoutes.ts
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User';

dotenv.config();

const router = express.Router();

// Ensure essential environment variables are set
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || !process.env.JWT_SECRET) {
    throw new Error('Essential environment variables are not set');
}
