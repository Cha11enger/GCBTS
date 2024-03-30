import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import axios, { AxiosResponse } from 'axios';
import { AccessTokenData, GitHubUserData } from '../types/github';

dotenv.config();

const router = express.Router();

// Trigger GitHub OAuth flow
router.get('/github', (req, res) => {
    const state = req.query.state || 'no_state_provided';
    console.log('Initiating OAuth with state:', state);
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&state=${state}&scope=user:email,repo`;
    
    res.redirect(url);
});

// Handle GitHub OAuth callback and create user in database if it doesn't exist yet and redirect to 

export default router;
