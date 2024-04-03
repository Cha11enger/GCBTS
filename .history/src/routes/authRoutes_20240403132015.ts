import express, { Request, Response } from 'express';
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
router.get('/github', (req: Request, res: Response) => {
    const state = req.query.state || 'no_state_provided';
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&state=${encodeURIComponent(state.toString())}&scope=user:email,repo`;
    res.redirect(url);
});

// GitHub OAuth callback
router.get('/github/callback', async (req: Request, res: Response) => {
    const { code, state } = req.query;
    if (!code || !state) {
        return res.status(400).send("Error: Code and state are required.");
    }
    res.redirect(`${SERVER_BASE_URL}/auth/token?code=${code}&state=${encodeURIComponent(state.toString())}`);
});

// Exchange the authorization code for an access token
router.post('/auth/token', async (req: Request, res: Response) => {
    const code = req.query.code;
    const state = req.query.state;

    // Ensure that code and state are not undefined and are of type string
    if (typeof code !== 'string' || typeof state !== 'string') {
        return res.status(400).json({ error: 'Code and state must be provided and must be strings.' });
    }

    try {
        const params = new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code,
            redirect_uri: GPT_CALLBACK_URL,
            state: state,
        });
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', params, { headers: { Accept: 'application/json' } });

        if (tokenResponse.data.error) {
            return res.status(400).json({ error: 'Failed to obtain access token' });
        }

        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}` } });

        // Example user data saving logic
        const githubId = userResponse.data.id.toString();
        const updatedUser = await User.findOneAndUpdate({ githubId }, {
            githubId,
            accessToken,
            displayName: userResponse.data.name,
            username: userResponse.data.login,
            profileUrl: userResponse.data.html_url,
            avatarUrl: userResponse.data.avatar_url,
        }, { new: true, upsert: true });

        console.log('User saved/updated:', updatedUser);

        res.json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: 3600,
        });
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;
