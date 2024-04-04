// src/routes/authRoutes.ts
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

    try {
        const tokenResponse = await exchangeCodeForToken(req.query.code as string);
        const { access_token, token_type, scope } = tokenResponse.data;

        // If you need to inform the client with a JSON response:
        res.json({ message: "User authenticated and saved", userData });
        // Or, if you need to redirect:
        // res.redirect(`${GPT_CALLBACK_URL}?state=${state}&code=${req.query.code}&auth_state=true`);
    } catch (error) {
        console.error('Error handling GitHub callback:', error);
        res.status(500).send('Error handling GitHub callback');
    }
};

// Token exchange route - exchanges code for token
const exchangeCodeForToken = async (req: Request, res: Response) => {
    console.log('Start of code exchange for token function');
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Code is required for token exchange' });
    }

    try {
        const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token`, {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code,
            redirect_uri: GITHUB_CALLBACK_URL,
        }, { headers: { Accept: 'application/json' } });

        const { access_token, token_type, scope } = tokenResponse.data;

        console.log('Token exchange successful. Responding with access token information.');
        
        // Directly respond with token information
        res.json({ access_token, token_type, scope });
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.status(500).json({ error: 'Failed to exchange code for token' });
    }
};

// function to save user to the database
const saveUser = async (userData: { githubId: string, username: string, email: string, avatar_url: string, access_token: string }) => {
    console.log('Start of saveUser function');
    const { username, email, avatar_url, access_token } = req.body;

    if (!username || !email || !avatar_url || !access_token) {
        return res.status(400).json({ error: 'Missing required user information' });
    }

    try {
        // Save user to the database
        const user = new User({ username, email, avatar_url, access_token });
        await user.save();

        console.log('User saved successfully');
        res.json({ message: 'User saved successfully' });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ error: 'Failed to save user' });
    }

    console.log('End of saveUser function');
};

// const exchangeCodeForToken = async (code: string) => {
//     console.log('Start of code exchange for token function');

//     try {
//         // Exchange code for access token with GitHub
//         console.log('Exchanging code for token...');
//         const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token`, {
//             client_id: GITHUB_CLIENT_ID,
//             client_secret: GITHUB_CLIENT_SECRET,
//             code,
//             redirect_uri: GITHUB_CALLBACK_URL
//         }, { headers: { Accept: 'application/json' } });

//         const { access_token, token_type, scope } = tokenResponse.data;

//         // Respond with the access token information in the format expected by OpenAI
//         console.log('Token exchange successful. Responding with access token information.');
//         // after successfull exchange redirect to the gpt callback url  with the code
//         return { access_token, token_type, scope };
      

//     } catch (error) {
//         console.error('Error exchanging code for token:', error);
//         throw new Error('Failed to exchange code for token');
//     }
// };

export { redirectToGitHubAuthorization, handleGitHubCallback, exchangeCodeForToken };