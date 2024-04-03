import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User';

dotenv.config();

const router = express.Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || '';
const GPT_CALLBACK_URL = process.env.GPT_CALLBACK_URL || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_jwt_secret_here';

// Start GitHub OAuth flow
router.get('/github', (req: Request, res: Response) => {
    const state = req.query.state || 'no_state_provided';
    // Redirect user to GitHub for authorization
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&state=${state}&scope=user:email,repo`;
    res.redirect(url);
});

// GitHub OAuth callback
router.get('/github/callback', async (req: Request, res: Response) => {
    // GitHub redirects here after user authorization
    const { code, state } = req.query;
    if (!code || !state) {
        return res.status(400).send("Error: Code and state are required.");
    }

    // Directly call the /auth/token endpoint to handle the exchange
    res.redirect(`${SERVER_BASE_URL}/auth/token?code=${code}&state=${encodeURIComponent(state.toString())}`);
});

// Exchange the authorization code for an access token
router.post('/auth/token', async (req: Request, res: Response) => {
    const { code, state } = req.query; // Assuming you're redirecting here with query parameters
    try {
        const params = new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code!.toString(), // Add type assertion to ensure 'code' is always a string
            redirect_uri: GPT_CALLBACK_URL, // Redirect URI should point to OpenAI GPT-3 OAuth callback URL
            state: state!.toString(), // Add type assertion to ensure 'state' is always a string
        });

        // Request to exchange code for an access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', params, { headers: { Accept: 'application/json' } });

        if (tokenResponse.data.error) {
            return res.status(400).json({ error: 'Failed to obtain access token' });
        }

        const accessToken = tokenResponse.data.access_token;
        
        // Optionally: Use access token to fetch user info from GitHub and save/update in your DB
        const userResponse = await axios.get('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}` } });
        const user = userResponse.data;
        const emailResponse = await axios.get('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${accessToken}` } });

        // Respond with the access token and redirect to the OpenAI GPT-3 OAuth callback URL with the state
        res.json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: 3600, // Example expiration time
            // Include any other necessary data as per your requirement
        });
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
