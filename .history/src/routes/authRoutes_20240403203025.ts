/
import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User';
import jwt from 'jsonwebtoken';

// src/routes/authRoutes.ts

const router = express.Router();

// Environment variables
const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL,
    GPT_CALLBACK_URL,
    JWT_SECRET
} = process.env;

// Redirect to GitHub's authorization page
const redirectToGitHubAuthorization = (req: Request, res: Response) => {
    console.log('Start of redirectToGitHubAuthorization function');
    const state = req.query.state || 'no_state_provided';
    const scope = 'user:email,repo';
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

    if (!GITHUB_CLIENT_ID || !GITHUB_CALLBACK_URL) {
        console.error('Missing GitHub client ID or callback URL');
        res.status(500).send('Missing GitHub client ID or callback URL');
        return;
    }

    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    console.log('Redirecting to GitHub authorization page:', url);
    res.redirect(url);
    console.log('End of redirectToGitHubAuthorization function');
};

// GitHub callback route - handles the callback and redirects to GPT
const handleGitHubCallback = async (req: Request, res: Response) => {
    console.log('Start of /github/callback function');
    const { code, state } = req.query;
    const GPT_CALLBACK_URL = process.env.GPT_CALLBACK_URL;

    if (!GPT_CALLBACK_URL) {
        console.error('Missing GPT callback URL');
        res.status(500).send('Missing GPT callback URL');
        return;
    }

    // Ensure that the code parameter is always of type string
    const tokenInfo = await exchangeCodeForToken(code as string);

    if (!tokenInfo) {
        console.error('Failed to exchange code for token');
        res.status(500).send('Failed to exchange code for token');
        return;
    }

    //use tokenInfo to get user info from GitHub and save it to the database
    // Fetch user info from GitHub using the access token
    try {
        console.log('Fetching user info from GitHub...');
        const userInfoResponse = await axios.get('https://api.github.com/user', { headers: { Authorization: `token ${tokenInfo.access_token}` } });
        const user = userInfoResponse.data;

        // Save or update user in your database
        const userData = {
            githubId: user.id,
            accessToken: tokenInfo.access_token,
            displayName: user.name || '',
            username: user.login,
            profileUrl: user.html_url,
            avatarUrl: user.avatar_url,
        };

        await User.findOneAndUpdate({ githubId: user.id }, userData, { upsert: true, new: true });

        // Generate JWT for user
        // const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        // Redirect to GPT callback URL with the code for OpenAI to handle token exchange
        console.log('Redirecting to GPT callback URL:', `${GPT_CALLBACK_URL}?state=${state}&code=${code}&auth_state=true`);
        res.redirect(`${GPT_CALLBACK_URL}?state=${state}&code=${code}&auth_state=true`);
    } catch (error) {
        console.error('Error handling GitHub callback:', error);
        res.status(500).send('Error handling GitHub callback');
    }

    console.log('End of /github/callback function');
};

// Token exchange route - exchanges code for token
const exchangeCodeForToken = async (code: string) => {
    console.log('Start of code exchange for token function');

    try {
        // Exchange code for access token with GitHub
        console.log('Exchanging code for token...');
        const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token`, {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: GITHUB_CALLBACK_URL
        }, { headers: { Accept: 'application/json' } });

        const { access_token, token_type, scope } = tokenResponse.data;

        // Respond with the access token information in the format expected by OpenAI
        console.log('Token exchange successful. Responding with access token information.');
        return {
            access_token,
            token_type,
            scope
        };
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw new Error('Failed to exchange code for token');
    }
};

export { redirectToGitHubAuthorization, handleGitHubCallback, exchangeCodeForToken };