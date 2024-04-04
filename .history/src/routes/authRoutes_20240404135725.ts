// src/routes/authRoutes.ts
import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User'; // Adjust the path as necessary

const router = express.Router();

const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL,
} = process.env;

// Redirects the user to GitHub's authorization page
const redirectToGitHubAuth = (req: Request, res: Response) => {
    const state = req.query.state || 'no_state_provided'; // State can be used for CSRF protection
    const scope = 'read:user,user:email'; // Minimal scope for user identification
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL || '')}&scope=${encodeURIComponent(scope)}&state=${state}`;
    res.redirect(url);
};

// Handles the callback from GitHub after user authorization
const handleGitHubCallback = async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('Authorization code is required');
    }

    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: GITHUB_CALLBACK_URL,
        }, {
            headers: { Accept: 'application/json' },
        });

        const { access_token } = tokenResponse.data;

        // Fetch the user's profile information from GitHub
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${access_token}` },
        });

        const { login, id, avatar_url, html_url } = userResponse.data;

        // Save or update the user's information in the database
        await User.findOneAndUpdate({ githubId: id }, {
            username: login,
            githubId: id,
            profileUrl: html_url,
            avatarUrl: avatar_url,
            accessToken: access_token, // Storing access token is optional and should be handled securely
        }, { upsert: true, new: true });

        // Redirect or respond after successful authentication
        // For example, redirect to a 'success' page or back to the application
        res.redirect('/auth/success'); // Adjust as needed
    } catch (error) {
        console.error('Authentication failed:', error);
        res.status(500).send('Authentication failed');
    }
};

// Exchanges an authorization code for a token, formatted for Custom GPT Actions OAuth , just get the access token from callback and res.json it
const exchangeCodeForToken = async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'Code parameter is required.' });
    }

    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: GITHUB_CALLBACK_URL,
        }, {
            headers: { Accept: 'application/json' },
        });

        const { access_token, token_type } = tokenResponse.data;

        // update the access token in the database
        

        // Respond with the token information, including simulated fields as necessary
        res.json({
            access_token: access_token,
            token_type: token_type,
            refresh_token: "example_refresh_token", // Simulated for demonstration
            expires_in: 3600, // Simulated value (1 hour)
        });
    } catch (error) {
        console.error('Failed to exchange code for token:', error);
        res.status(500).json({ error: 'Failed to exchange authorization code for token.' });
    }
};



export { redirectToGitHubAuth, handleGitHubCallback, exchangeCodeForToken };
