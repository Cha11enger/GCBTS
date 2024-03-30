import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import User from '../models/User';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = express.Router();

// Trigger GitHub OAuth flow
router.get('/github', (req: Request, res: Response) => {
  const state = encodeURIComponent(JSON.stringify({ state: req.query.state || 'no_state_provided' }));
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&state=${state}&scope=user:email,repo`;

  console.log('Initiating OAuth with state:', state);
  res.redirect(url);
});

// Handle GitHub OAuth callback, now simplified to just save user data and redirect
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Error: Code and state are required.");
  }

  try {
    // Directly call your /auth/token endpoint internally to exchange the code for a token
    const tokenResponse = await axios.post(`${process.env.SERVER_BASE_URL}/auth/token`, {
      code,
      state,
    }, { headers: { 'Content-Type': 'application/json' } });

    const { access_token } = tokenResponse.data;

    // Use the access token to fetch user data
    const userDataResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` }
    });
    const userData = userDataResponse.data;

    // Save or update user data in your database
    let user = await User.findOne({ githubId: userData.id.toString() });
    if (!user) {
      user = new User({
        githubId: userData.id.toString(),
        accessToken: access_token,
        displayName: userData.name || '',
        username: userData.login,
        profileUrl: userData.html_url,
        avatarUrl: userData.avatar_url,
      });
    } else {
      user.accessToken = access_token;
    }

    // Ensure that process.env.JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT secret is not defined.');
    }

    const jwtToken = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Redirect with the JWT token
    // res.redirect(`${process.env.GPT_CALLBACK_URL}?token=${jwtToken}`);
    const openaiCallbackUrl = process.env.GPT_CALLBACK_URL || '';
    res.redirect(`${openaiCallbackUrl}?auth_success=true&stat`);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.status(500).send("Internal Server Error");
  }
});

// New endpoint to exchange the GitHub code for an access token
router.post('/auth/token', async (req: Request, res: Response) => {
  const { code, state } = req.body;

  try {
    const params = new URLSearchParams();
    if (process.env.GITHUB_CLIENT_ID) {
        params.append('client_id', process.env.GITHUB_CLIENT_ID);
    }
    if (process.env.GITHUB_CLIENT_SECRET) {
        params.append('client_secret', process.env.GITHUB_CLIENT_SECRET);
    }
    params.append('code', code);
    params.append('redirect_uri', process.env.GITHUB_CALLBACK_URL || '');
    params.append('state', state);

    const response = await axios.post('https://github.com/login/oauth/access_token', params, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const accessTokenData = response.data;
    if (accessTokenData.error) {
      console.error('Access token error:', accessTokenData.error);
      return res.status(400).json({ error: "Failed to obtain access token" });
    }

    // Return the access token JSON response
    res.json({ access_token: accessTokenData.access_token, token_type: accessTokenData.token_type, scope: accessTokenData.scope });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
