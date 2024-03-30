import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AccessTokenData, GitHubUserData } from '../types/github';

dotenv.config();

const router = express.Router();

// Trigger GitHub OAuth flow
router.get('/github', (req, res) => {
    // Optionally include a redirect path in the state parameter
    // const redirectUri = req.query.redirect_uri || '/';
    const state = req.query.state || 'no_state_provided';
    console.log('State:', state);
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&state=${state}&scope=user:email,repo`;
    
    res.redirect(url);
    // return res.status(200).send({ url });
});

// Handle GitHub OAuth callback
router.get('/github/callback', async (req: Request, res: Response) => {
    const { code, state } = req.query;
    if (!code || !state) {
        return res.status(400).send("Error: Code and state are required.");
    }

    try {
        // Exchange the code for an access token
        const accessTokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                            client_id: process.env.GITHUB_CLIENT_ID,
                            client_secret: process.env.GITHUB_CLIENT_SECRET,
                            code: code,
                            state: state,
                            redirect_uri: process.env.GITHUB_CALLBACK_URL,
                        }),
        });
        
        const accessTokenData: AccessTokenData = accessTokenResponse.data;

        if (!accessTokenData.access_token) {
            return res.status(400).send("Error: Invalid GitHub token.");
        }

        // Fetch user info from GitHub
        const userDataResponse = await axios.get('https://api.github.com/user', {
          headers: { 'Authorization': `token ${accessTokenData.access_token}` }
        });
        const userData: GitHubUserData = userDataResponse.data;

        // Save or update user in the database
        let user = await User.findOne({ githubId: userData.id.toString() });
        if (!user) {
            user = new User({
                githubId: userData.id.toString(),
                accessToken: accessTokenData.access_token,
                displayName: userData.name || '',
                username: userData.login,
                profileUrl: userData.html_url,
                avatarUrl: userData.avatar_url,
            });
        } else {
            user.accessToken = accessTokenData.access_token;
        }
        await user.save();
        console.log('User saved:', user);

        // Parse the state to get the original redirect URI
        // const parsedState = JSON.parse(decodeURIComponent(state as string));
        // const redirectUri = parsedState.redirectUri || '/';

        // Issue a JWT
        const jwtToken = jwt.sign({ accessToken: accessTokenData.access_token }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        // Redirect to the original page with a success message
        // Instead of redirecting with the token in the URL, consider using HTTP-only cookies or session storage
        // res.redirect(`${redirectUri}?auth_success=true&message=Authentication successful`);
        // res.redirect(`${process.env.GPT_CALLBACK_URL}?auth_success=true&message=Authentication successful`);
        // res.redirect to GPT_CALLBACK_URL with auth success true , message and code and state
        console.log('Redirecting to GPT_CALLBACK_URL:', process.env.GPT_CALLBACK_URL);
        console.log('Code:', code, 'State:', state);
        res.redirect(`${process.env.GPT_CALLBACK_URL}?auth_success=true&code=${code}&state=${state}`);
    } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        res.status(500).send("Internal Server Error");
    }
});

export default router;
