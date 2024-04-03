// import express, { Request, Response } from 'express';
// import dotenv from 'dotenv';
// import axios from 'axios';
// import jwt from 'jsonwebtoken';
// import User from '../models/User';

// dotenv.config();

// const router = express.Router();

// // Ensure that your .env variables are set correctly
// const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
// const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
// const SERVER_BASE_URL = process.env.SERVER_BASE_URL || '';
// const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || '';
// const GPT_CALLBACK_URL = process.env.GPT_CALLBACK_URL || '';
// const JWT_SECRET = process.env.JWT_SECRET || 'your_default_jwt_secret_here';

// router.get('/github', (req: Request, res: Response) => {
//     const state = req.query.state || 'no_state_provided';
//     const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&state=${encodeURIComponent(state)}&scope=user:email,repo`;
//     console.log('Initiating OAuth with state:', state);
//     res.redirect(url);
// });

// router.get('/github/callback', async (req: Request, res: Response) => {
//     const { code, state } = req.query;
//     console.log('GitHub OAuth callback with code:', code, 'and state:', state);
//     if (!code || !state) {
//         return res.status(400).send("Error: Code and state are required.");
//     }

//     try {
//         const response = await axios.post(`${SERVER_BASE_URL}/auth/token`, { code, state }, { headers: { 'Content-Type': 'application/json' } });
        
//         const { access_token, token_type, scope } = response.data;

//         // Fetch user info from GitHub using the access token
//         const userInfoResponse = await axios.get('https://api.github.com/user', { headers: { Authorization: `token ${access_token}` } });
//         const user = userInfoResponse.data;

//         // Save or update user in your database
//         const userData = {
//             githubId: user.id,
//             accessToken: access_token,
//             displayName: user.name || '',
//             username: user.login,
//             profileUrl: user.html_url,
//             avatarUrl: user.avatar_url,
//         };

//         await User.findOneAndUpdate({ githubId: user.id }, userData, { upsert: true, new: true });

//         // Generate JWT for user
//         const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

//         // Redirect to the GPT-3 callback URL
//         res.redirect(`${GPT_CALLBACK_URL}?auth_success=true&state=${state}&jwt=${jwtToken}`);
//     } catch (error) {
//         console.error('GitHub OAuth callback error:', error);
//         res.status(500).send("Internal Server Error");
//     }
// });

// router.post('/auth/token', async (req: Request, res: Response) => {
//     const { code, state } = req.body;
//     console.log('Exchanging code for token:', code, 'with state:', state);

//     try {
//         const params = new URLSearchParams({
//             client_id: GITHUB_CLIENT_ID,
//             client_secret: GITHUB_CLIENT_SECRET,
//             code,
//             redirect_uri: GITHUB_CALLBACK_URL,
//             state,
//         });

//         const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', params.toString(), { headers: { Accept: 'application/json' } });
        
//         if (tokenResponse.data.error) {
//             return res.status(400).json({ error: "Failed to obtain access token" });
//         }

//         // Return the access token JSON response
//         res.json({
//             access_token: tokenResponse.data.access_token,
//             token_type: tokenResponse.data.token_type,
//             scope: tokenResponse.data.scope,
//             expires_in: 3600 // Assuming a default expiry time, adjust as needed
//         });
//     } catch (error) {
//         console.error('Token exchange error:', error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// export default router;
