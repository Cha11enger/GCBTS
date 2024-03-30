import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import axios, { AxiosResponse } from 'axios';
import { AccessTokenData, GitHubUserData } from '../types/github';

dotenv.config();

const router = express.Router();

// Trigger GitHub OAuth flow
router.get('/github', (req, res) => {
    const state = req.query.state || 'no_state_provided';
    console.log('Initiating OAuth with state:', state);
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&state=${state}&scope=user:email,repo`;
    
    res.redirect(url);
});

// Handle GitHub OAuth callback
router.get('/github/callback', async (req: Request, res: Response) => {
    const { code, state } = req.query;
    console.log('GitHub OAuth callback:', code, state);
    if (!code || !state) {
        return res.status(400).send("Error: Code and state are required.");
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.GITHUB_CLIENT_ID!);
        params.append('client_secret', process.env.GITHUB_CLIENT_SECRET!);
        params.append('code', code as string);
        params.append('redirect_uri', process.env.GITHUB_CALLBACK_URL!);
        params.append('state', state as string);

        const accessTokenResponse: AxiosResponse<AccessTokenData> = await axios.post(
            'https://github.com/login/oauth/access_token',
            params,
            {
                headers: {
                    Accept: 'application/json',
                },
            }
        );

        const accessTokenData: AccessTokenData = accessTokenResponse.data;

        if (!accessTokenData.access_token) {
            return res.status(400).send("Error: Invalid GitHub token.");
        }

        const userDataResponse: AxiosResponse<GitHubUserData> = await axios.get(
            'https://api.github.com/user',
            { headers: { Authorization: `token ${accessTokenData.access_token}` } }
        );
        
        const userData: GitHubUserData = userDataResponse.data;

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

        // Optional: Issue a JWT
        // const jwtToken = jwt.sign({ accessToken: accessTokenData.access_token }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        // Redirect to GPT_CALLBACK_URL with success message, code, and state
        console.log('Redirecting to GPT_CALLBACK_URL:', process.env.GPT_CALLBACK_URL);
        co
        res.redirect(`${process.env.GPT_CALLBACK_URL}?auth_success=true&code=${code}&state=${state}`);
    } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        res.status(500).send("Internal Server Error");
    }
});

export default router;
