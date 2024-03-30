import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AccessTokenData, GitHubUserData } from '../types/github';

dotenv.config();

const router = express.Router();

router.get('/github', (req, res) => {
    const state = encodeURIComponent(JSON.stringify({ state: req.query.state || 'no_state_provided' }));
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&state=${state}&scope=user:email,repo`;
    
    console.log('Initiating OAuth with state:', state);
    res.redirect(url);
});

router.get('/github/callback', async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).send("Error: Code and state are required.");
    }

    // State verification logic here if you stored it earlier

    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.GITHUB_CLIENT_ID!);
        params.append('client_secret', process.env.GITHUB_CLIENT_SECRET!);
        params.append('code', code as string);
        params.append('redirect_uri', process.env.GITHUB_CALLBACK_URL!);
        params.append('state', state as string);

        const accessTokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token', 
            params, 
            { headers: { Accept: 'application/json' } }
        );

        const accessTokenData: AccessTokenData = accessTokenResponse.data;

        if (accessTokenData.error || !accessTokenData.access_token) {
            console.error('Error obtaining access token:', accessTokenData.error);
            return res.status(400).send("Error: Invalid GitHub token.");
        }

        const userDataResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessTokenData.access_token}` }
        });
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

        // Issue a JWT
        const jwtToken = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        // Redirect to the original page with a success message
        // Instead of redirecting with the token in the URL, consider using HTTP-only cookies or session storage
        // res.redirect(`${redirectUri}?auth_success=true&message=Authentication successful`);
        // res.redirect(`${process.env.GPT_CALLBACK_URL}?auth_success=true&message=Authentication successful`);
        // res.redirect to GPT_CALLBACK_URL with auth success true , message and code and state
        console.log('Redirecting to GPT_CALLBACK_URL:', process.env.GPT_CALLBACK_URL);
        console.log('Code:', code, 'State:', state);
        res.redirect(`${process.env.GPT_CALLBACK_URL}?auth_success=true&code=${code}&state=${state}&token=${jwtToken}`);
    } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        res.status(500).send("Internal Server Error");
    }
});

export default router;
