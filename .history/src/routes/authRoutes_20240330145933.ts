import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import axios, { AxiosResponse } from 'axios';
import { AccessTokenData, GitHubUserData } from '../types/github';

dotenv.config();

const router = express.Router();

router.get('/github', (req: Request, res: Response) => {
    const state = req.query.state || 'no_state_provided';
    console.log('Initiating OAuth with state:', state);
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&state=${encodeURIComponent(state)}&scope=user:email,repo`;
    res.redirect(url);
});

router.get('/github/callback', async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).send("Error: Code and state are required.");
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.GITHUB_CLIENT_ID);
        params.append('client_secret', process.env.GITHUB_CLIENT_SECRET);
        params.append('code', code.toString());
        params.append('redirect_uri', process.env.GITHUB_CALLBACK_URL);
        params.append('state', state.toString());

        const accessTokenResponse: AxiosResponse<AccessTokenData> = await axios.post('https://github.com/login/oauth/access_token', params.toString(), { headers: { Accept: 'application/json' } });
        const accessTokenData: AccessTokenData = accessTokenResponse.data;

        if (accessTokenData.error || !accessTokenData.access_token) {
            console.error('Error obtaining access token:', accessTokenData.error);
            return res.status(400).send("Error: Invalid GitHub token.");
        }

        const userDataResponse: AxiosResponse<GitHubUserData> = await axios.get('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessTokenData.access_token}` } });
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

        const jwtToken = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const openaiCallbackUrl = process.env.GPT_CALLBACK_URL;
        console.log('Redirecting to OpenAI Callback URL:', openaiCallbackUrl);
        res.redirect(`${openaiCallbackUrl}?auth_success=true&code=${code}&state=${state}&jwt=${jwtToken}`);
    } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        res.status(500).send("Internal Server Error");
    }
});

export default router;
