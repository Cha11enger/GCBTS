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

// Handle GitHub OAuth callback and create user in database if it doesn't exist yet and redirect to GPT_CALLBACK_URL with same state and code while initiating authentication
router.get('/github/callback', async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    console.log('Received OAuth callback with code:', code, 'and state:', state);
    if (!code || !state) {
        return res.status(400).json({ error: 'Invalid code or state' });
    }

    // Get access token from GitHub
    const accessTokenResponse = await axios.post<AccessTokenData>   ('  
