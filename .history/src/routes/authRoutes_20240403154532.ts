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

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || '';
const GPT_CALLBACK_URL = process.env.GPT_CALLBACK_URL || '';
const JWT_SECRET = process.env.JWT_SECRET;

// Start GitHub OAuth flow
router.get('/github', (req, res) => {
    console.log('Entering /github route');
    const state = req.query.state || 'no_state_provided';
    const url = `http://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&state=${encodeURIComponent(state.toString())}&scope=user:email,repo`;    
    res.redirect
    console.log('Exiting /github route');
}
);

// 