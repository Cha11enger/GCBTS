// src/routes/authRoutes.ts
import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User';
import { Session } from 'express-session';

const router = express.Router();

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
  GPT_CALLBACK_URL
} = process.env;

const redirectToGitHubAuth = (req: Request, res: Response) => {
  const state = req.query.state || 'no_state_provided';
  const scope = 'read:user,user:email';
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL || '')}&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
};

const handleGitHubCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code is required');
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

    const { access_token } = tokenResponse.data;
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    const { login, id, avatar_url, html_url } = userResponse.data;
    const user = await User.findOneAndUpdate({ githubId: id }, {
      username: login,
      githubId: id,
      profileUrl: html_url,
      avatarUrl: avatar_url,
      accessToken: access_token,
    }, { upsert: true, new: true });

    req.session.user = user;

    res.redirect(`${GPT_CALLBACK_URL}?code=${code}&state=${state}`);
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
};

const exchangeCodeForToken = async (req: express.Request, res: express.Response) => {
  console.log('starting exchangeCodeForToken');

  if (!req.session.user) {
    return res.status(401).send('Unauthorized: No session found.');
  }

  try {
     const user = await User.findById(req.session.user._id);
      if (!user) {
        return res.status(401).send('Unauthorized : No user found.');
      }

      res.json  ({
        accessToken: user.accessToken,
        tokenType: 'Bearer',
        example
        expiresIn: 3600,

      });
  }




export { redirectToGitHubAuth, handleGitHubCallback, exchangeCodeForToken };


