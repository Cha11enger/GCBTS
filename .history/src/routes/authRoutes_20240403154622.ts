// src/routes/authRoutes.ts
import express from 'express';
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
router.get('/github', (req, res) => {
    console.log('Entering /github route');
    const state = req.query.state || 'no_state_provided';
    const url = `http://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&state=${encodeURIComponent(state.toString())}&scope=user:email,repo`;    
    res.redirect
    console.log('Exiting /github route');
}
);

// GitHub OAuth callback 

// it should be based on the openai documentation 
// OAuth
// Actions allow OAuth sign in for each user. This is the best way to provide personalized experiences and make the most powerful actions available to users. A simple example of the OAuth flow with actions will look like the following:

// To start, select "Authentication" in the GPT editor UI, and select "OAuth".
// You will be prompted to enter the OAuth client ID, client secret, authorization URL, token URL, and scope.
// The client ID and secret can be simple text strings but should follow OAuth best practices.
// We store an encrypted version of the client secret, while the client ID is available to end users.
// OAuth requests will include the following information: request={'grant_type': 'authorization_code', 'client_id': 'YOUR_CLIENT_ID', 'client_secret': 'YOUR_CLIENT_SECRET', 'code': 'abc123', 'redirect_uri': 'https://chat.openai.com/aip/g-some_gpt_id/oauth/callback'}
// In order for someone to use an action with OAuth, they will need to send a message that invokes the action and then the user will be presented with a "Sign in to [domain]" button in the ChatGPT UI.
// The authorization_url endpoint should return a response that looks like: { "access_token": "example_token", "token_type": "bearer", "refresh_token": "example_token", "expires_in": 59 }
// During the user sign in process, ChatGPT makes a request to your authorization_url using the specified authorization_content_type, we expect to get back an access token and optionally a refresh token which we use to periodically fetch a new access token.
// Each time a user makes a request to the action, the user’s token will be passed in the Authorization header: (“Authorization”: “[Bearer/Basic][user’s token]”).
// We require that OAuth applications make use of the state parameter for security reasons.