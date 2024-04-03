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
  const state = generateRandomString();
  const scope = 'user:email,repo';
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
});

// GitHub callback route - handles the callback and redirects to GPT
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;
  // Redirect to GPT callback URL with the code for OpenAI to handle token exchange
  res.redirect(`${GPT_CALLBACK_URL}?state=${state}&code=${code}&auth_state=true`);
});

// Token exchange route - exchanges code for token
router.post('/token', async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange code for access token with GitHub
    const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token`, {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_CALLBACK_URL
    }, { headers: { Accept: 'application/json' } });

    const { access_token, token_type, scope } = tokenResponse.data;

    // Respond with the access token information in the format expected by OpenAI
    res.json({
      access_token,
      token_type,
      scope
    });
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Failed to exchange code for token');
  }
});

function generateRandomString(length = 16) {
  return [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

export default router;
