import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import User from '../models/User';
import jwt, { Secret } from 'jsonwebtoken';

dotenv.config();

// Ensure JWT_SECRET is defined. If not, throw an error early.
const jwtSecret: jwt.Secret = process.env.JWT_SECRET || 'default_jwt_secret';

const router = express.Router();

router.get('/github', (req: Request, res: Response) => {
    const state = req.query.state || 'no_state_provided';
    const clientId = process.env.GITHUB_CLIENT_ID ?? 'default_client_id'; // Provide a default value or handle the undefined case
    const redirectUri = process.env.GITHUB_CALLBACK_URL ?? 'default_redirect_uri';
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=user:email,repo`;

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

        try {
          // Example of signing a JWT with the asserted secret
          const jwtToken = jwt.sign({ userId: user._id.toString() }, jwtSecret, { expiresIn: '1h' });
          // Use jwtToken as needed
          console.log('JWT Token:', jwtToken);
          res.redirect(`${process.env.GPT_CALLBACK_URL}?auth_success=true&state=${state}&code=${code}`);
        }
        catch (error) {
          console.error('Error signing JWT:', error);
          res.status(500).send("Internal Server Error");
        }
        
          
        // const openaiCallbackUrl = process.env.GPT_CALLBACK_URL || '';
        // console.log('Redirecting to OpenAI Callback URL with token:', openaiCallbackUrl);
        // res.redirect(`${openaiCallbackUrl}?auth_success=true&state=${state}&code=${code}&jwt=${jwtToken}`);
        // } catch (error) {
        //   // Improved error handling
        //   if (axios.isAxiosError(error)) {
        //     // Now we know `error` is an AxiosError, so we can safely access `error.response`
        //     console.error('GitHub OAuth callback error:', error.response?.data || error.message);
        //   } else {
        //     console.error('Unexpected error:', error);
        //   }
        //   res.status(500).send("Internal Server Error");
        
  

router.post('/token', async (req: Request, res: Response) => {
  const { code, state } = req.body;
  console.log('Exchanging code for token:', code, 'with state:', state);
  try {
      const params = new URLSearchParams();
      const clientId = process.env.GITHUB_CLIENT_ID ?? 'default_client_id'; // Provide a default value or handle the undefined case
      const clientSecret = process.env.GITHUB_CLIENT_SECRET ?? 'default_client_secret';
      const redirectUri = process.env.GITHUB_CALLBACK_URL ?? 'default_redirect_uri';

      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('code', code);
      params.append('redirect_uri', redirectUri);
      params.append('state', state);

      const response = await axios.post('https://github.com/login/oauth/access_token', params.toString(), {
          headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
          },
      });

      // Same as before for handling the response
  } catch (error) {
      if (axios.isAxiosError(error)) {
          console.error('Token exchange error:', error.response?.data || error.message);
          res.status(500).json({ error: "Internal Server Error" });
      } else {
          console.error('Unexpected error:', error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  }
});

export default router;
