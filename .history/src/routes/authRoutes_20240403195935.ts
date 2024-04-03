import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User';
import jwt from 'jsonwebtoken';

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
router.get('/github', (req, res) => {
        console.log('Start of /github function');
        // const state = generateRandomString();
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
        console.log('End of /github function');
});

// GitHub callback route - handles the callback and redirects to GPT
router.get('/github/callback', async (req, res) => {
        console.log('Start of /github/callback function');
        const { code, state } = req.query;
        const GPT_CALLBACK_URL = process.env.GPT_CALLBACK_URL;

        if (!GPT_CALLBACK_URL) {
                console.error('Missing GPT callback URL');
                res.status(500).send('Missing GPT callback URL');
                return;
        }

        // /token api's response should be sent before redirecting to GPT callback URL

        // Redirect to GPT callback URL with the code for OpenAI to handle token exchange
        console.log('Redirecting to GPT callback URL:', `${GPT_CALLBACK_URL}?state=${state}&code=${code}&auth_state=true`);
        res.redirect(`${GPT_CALLBACK_URL}?state=${state}&code=${code}&auth_state=true`);
        console.log('End of /github/callback function');
});

// Token exchange route - exchanges code for token
// router.post('/token', async (req, res) => {
//     console.log('Start of /token function');
//     const { code } = req.body;

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
//         res.json({
//             access_token,
//             token_type,
//             scope
//         });
//     } catch (error) {
//         console.error('Error exchanging code for token:', error);
//         res.status(500).send('Failed to exchange code for token');
//     }
//     console.log('End of /token function');
// });

// function generateRandomString(length = 16) {
//     console.log('Start of generateRandomString function');
//     const randomString = [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
//     console.log('Generated random string:', randomString);
//     console.log('End of generateRandomString function');
//     return randomString;
// }

export default router;
