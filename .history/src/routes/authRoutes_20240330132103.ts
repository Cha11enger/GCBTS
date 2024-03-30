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

    // Exchange code for access token
    const accessTokenData = await exchangeCodeForAccessToken(code as string);
    if (!accessTokenData) {
        return res.status(500).json({ error: 'Failed to exchange code for access token' });
    }

    // Fetch user data
    const userData = await fetchUserData(accessTokenData.access_token);
    if (!userData) {
        return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Check if user already exists in database
    const user  = await User.findOne({ githubId: userData.id });    
    if (!user) {
        // Create user in database
        const newUser = new User({
            githubId: userData.id,
            username: userData.login,
            email: userData.email,
            avatarUrl: userData.avatar_url
        });
        await newUser.save();
    }

    // Generate JWT
    const token = jwt.sign({ githubId: userData.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Redirect to GPT_CALLBACK_URL with token
    res.redirect(`${process.env.GPT_CALLBACK_URL}?state=${state}&token=${token}`);
}

// Exchange code for access token
async function exchangeCodeForAccessToken(code: string): Promise<AccessTokenData | null> {
    try {
        const response = await axios.post('https:   //github.com/login/oauth/access_token', {