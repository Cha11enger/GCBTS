import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User'; // Adjust the path as necessary

const router = express.Router();

const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL,
} = process.env;

const redirectToGitHubAuth = (req: Request, res: Response) => {
    const state = req.query.state || 'no_state_provided'; // State can be used for CSRF protection
    const scope = 'read:user,user:email'; // Minimal scope for user identification
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL || '')}&scope=${encodeURIComponent(scope)}&state=${state}`;
    res.redirect(url);
};

// Handle callback from GitHub
const handleGitHubCallback = async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('Authorization code is required');
    }

    try {
        // Exchange code for an access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: GITHUB_CALLBACK_URL,
        }, {
            headers: {
                Accept: 'application/json',
            },
        });

        const { access_token } = tokenResponse.data;

        // Fetch user info from GitHub
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${access_token}` },
        });

        const { login, id, avatar_url, html_url } = userResponse.data;

        // Save or update user in your database
        await User.findOneAndUpdate({ githubId: id }, {
            username: login,
            githubId: id,
            profileUrl: html_url,
            avatarUrl: avatar_url,
            accessToken: access_token,
        }, { upsert: true, new: true });

        res.send('Authentication successful!');
    } catch (error) {
        console.error('Authentication failed:', error);
        res.status(500).send('Authentication failed');
    }
};

export { redirectToGitHubAuth, handleGitHubCallback };
