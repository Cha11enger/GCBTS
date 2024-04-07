import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User';
import { Session } from 'express-session';

// src/routes/authRoutes.ts

const router = express.Router();

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
  GPT_CALLBACK_URL
} = process.env;

const redirectToGitHubAuth = (req: express.Request, res: express.Response) => {
  console.log('Start of redirectToGitHubAuth');
  const state = req.query.state || 'no_state_provided';
  const scope = 'read:user,user:email';
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL || '')}&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
  console.log('Redirecting to GitHub for authorization: ' + url);
  console.log('End of redirectToGitHubAuth');
};

const handleGitHubCallback = async (req: express.Request, res: express.Response) => {
  console.log('Start of handleGitHubCallback');
  const { code, state } = req.query;
  console.log('Code:', code);
  console.log('State:', state);

  if (!code) {
    console.log('Authorization code is required');
    return res.status(400).send('Authorization code is required');
  }

  try {
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GPT_CALLBACK_URL,
    }, {
      headers: { Accept: 'application/json' },
    });

    const { access_token } = tokenResponse.data;
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    const { login, id, avatar_url, html_url } = userResponse.data;

    // assign User to express-sessions session object
    req.session.user = { githubId: id, _id: id };
    console.log('User assigned to session', req.session.user);

    const user = await User.findOneAndUpdate({ githubId: id }, {
      username: login,
      githubId: id,
      profileUrl: html_url,
      avatarUrl: avatar_url,
      accessToken: access_token,
    }, { upsert: true, new: true });

    res.redirect(`${GPT_CALLBACK_URL}?code=${code}&state=${state}`);
    console.log('End of handleGitHubCallback');
  } catch (error) {
    console.log('Authentication failed');
    res.status(500).send('Authentication failed');
  }
};

const exchangeCodeForToken = async (req: express.Request, res: express.Response) => {
  console.log('Start of exchangeCodeForToken');

  console.log('Session:', req.session.user);

  if (!req.session.user) {
    console.log('Unauthorized: No session found.');
    return res.status(401).send('Unauthorized: No session found.');
  }

  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      console.log('Unauthorized: No user found.');
      return res.status(401).send('Unauthorized: No user found.');
    }

    res.json({
      accessToken: user.accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    });

    console.log('End of exchangeCodeForToken');
  } catch (error) {
    console.log('Failed to exchange code for token');
    res.status(500).send('Failed to exchange code for token');
  }
};

export { redirectToGitHubAuth, handleGitHubCallback, exchangeCodeForToken };
