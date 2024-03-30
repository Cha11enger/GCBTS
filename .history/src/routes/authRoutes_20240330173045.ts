import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import User from '../models/User';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = express.Router();

// Ensure your Express app can parse JSON request bodies
router.use(express.json());

router.get('/github', (req: Request, res: Response) => {
    const state = req.query.state || 'no_state_provided';
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&state=${state}&scope=user:email,repo`;

    console.log('Initiating OAuth with state:', state);
    res.redirect(url);
});

router.get('/github/callback', async (req: Request, res: Response) => {
    const { code, state } = req.query;
    console.log('GitHub OAuth callback with code:', code, 'and state:', state);
    if (!code || !state) {
        return res.status(400).send("Error: Code and state are required.");
    }

    try {
        const tokenResponse = await axios.post(`${process.env.SERVER_BASE_URL}/auth/token`, JSON.stringify({
            code,
            state,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

        const { access_token } = tokenResponse.data;

        const userDataResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const userData = userDataResponse.data;

        let user = await User.findOneAndUpdate({ githubId: userData.id.toString() }, {
            githubId: userData.id.toString(),
            accessToken: access_token,
            displayName: userData.name || '',
            username: userData.login,
            profileUrl: userData.html_url,
            avatarUrl: userData.avatar_url,
        }, { new: true, upsert: true });

        const jwtToken = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const openaiCallbackUrl = process.env.GPT_CALLBACK_URL || '';
        console.log('Redirecting to OpenAI Callback URL with token:', openaiCallbackUrl);
        res.redirect(`${openaiCallbackUrl}?auth_success=true&state=${state}&code=${code}&jwt=${jwtToken}`);
    } catch (error) {
        console.error('GitHub OAuth callback error:', error.response?.data || error.message);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/auth/token', async (req: Request, res: Response) => {
    const { code, state } = req.body;
    console.log('Exchanging code for token:', code, 'with state:', state);
    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.GITHUB_CLIENT_ID);
        params.append('client_secret', process.env.GITHUB_CLIENT_SECRET);
        params.append('code', code);
        params.append('redirect_uri', process.env.GITHUB_CALLBACK_URL);
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

        res.json({ access_token: accessTokenData.access_token, token_type: accessTokenData.token_type, scope: accessTokenData.scope });
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
