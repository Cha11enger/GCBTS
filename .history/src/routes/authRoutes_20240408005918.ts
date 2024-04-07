// src/routes/authRoutes.ts
import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User'; // Adjust the path as necessary

const router = express.Router();

const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL,
    GPT_CALLBACK_URL
} = process.env;

// state encoded string generate
// const generateState = (length: number) => {
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let result = '';
//     const charactersLength = characters.length;
//     for (let i = 0; i < length; i++) {
//         result += characters.charAt(Math.floor(Math.random() * charactersLength));
//     }
//     return result;
// };

// Redirects the user to GitHub's authorization page
const redirectToGitHubAuth = (req: Request, res: Response) => {
    console.log('Starting redirectToGitHubAuth');
    // const state = req.query // State can be used for CSRF protection
    // const state = generateState(10);
    const state = req.query.state || 'no_state_provided'; // State can be used for CSRF protection
    // const code = req.query.code;
    console.log('State:', state);
    // custom code
    // const code = 'example_code'; // Simulated for demonstration
    const scope = 'read:user,user:email'; // Minimal scope for user identification
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL || '')}&scope=${encodeURIComponent(scope)}&state=${state}`;
    res.redirect(url);
    console.log('Redirecting to:', url);
    console.log('Ending redirectToGitHubAuth');
};

// Handles the callback from GitHub after user authorization in post request

const handleGitHubCallback = async (req: Request, res: Response) => {
    console.log('Starting handleGitHubCallback');
    // const { code } = req.query;
    const { code, state } = req.query;
    console.log('Code:', code),
        console.log('State:', state);
    const openaiCallbackUrl = GPT_CALLBACK_URL;

    if (!code) {
        console.error('Authorization code is required');
        return res.status(400).send('Authorization code is required');
    }

    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: GITHUB_CALLBACK_URL,
        }, {
            headers: { Accept: 'application/json' },
        });

        const { access_token } = tokenResponse.data;

        // Fetch the user's profile information from GitHub
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${access_token}` },
        });

        const { login, id, avatar_url, html_url } = userResponse.data;

        // Save or update the user's information in the database
        await User.findOneAndUpdate({ githubId: id }, {
            username: login,
            githubId: id,
            profileUrl: html_url,
            avatarUrl: avatar_url,
            accessToken: access_token, // Storing access token is optional and should be handled securely
        }, { upsert: true, new: true });

        // Redirect or respond after successful authentication
        // For example, redirect to a 'success' page or back to the application
        // res.redirect('/auth/success'); // Adjust as needed
        console.log('Redirecting to:', openaiCallbackUrl);
        console.log('Code:', code);
        // res.redirect(`${openaiCallbackUrl}?code=${code}&state=${state}`);
        res.redirect(`${process.env.SERVER_BASE_URL}/auth/exchange?code=${code}&state=${state}`);
    } catch (error) {
        console.error('Authentication failed:', error);
        res.status(500).send('Authentication failed');
    }
    console.log('Ending handleGitHubCallback');
};

// src/routes/authRoutes.ts

// src/routes/authRoutes.ts
const exchangeCodeForToken = async (req: Request, res: Response) => {
    console.log('Starting exchangeCodeForToken');
  
    if (!req.session.user) {
      return res.status(401).send({ error: 'Unauthorized: No session found.' });
    }
  
    try {
      const user = await User.findById(req.session.user.id);
  
      if (!user) {
        return res.status(404).send({ error: 'User not found.' });
      }
  
      res.json({ 
        accessToken: user.accessToken,
        tokenType: "bearer",
        expiresIn: 3600 // Adjust based on your token management
      });
    } catch (error) {
      console.error('Failed to retrieve user:', error);
      res.status(500).send({ error: 'Internal server error.' });
    }
  };
  
  

// Assuming githubId is somehow provided in the request. You'll need to adjust this based on your actual application logic.
// async function exchangeCodeForToken(req: Request, res: Response) {
//     console.log('Starting exchangeCodeForToken');
//     const githubId = req.body.githubId; // Example, adjust according to how you get this identifier

//     if (!githubId) {
//         console.error('GitHub ID is required.');
//         return res.status(400).send('GitHub ID is required for token exchange.');
//     }

//     try {
//         const user = await User.findOne({ githubId: githubId });
//         if (!user) {
//             console.error('User not found.');
//             return res.status(404).send('User not found.');
//         }

//         // Respond with the token information
//         res.json({
//             access_token: user.accessToken,
//             token_type: user.tokenType || 'bearer', // Assuming you've stored this information
//             expires_in: user.expiresIn || 3600, // Assuming you've stored this information
//             // Add refresh_token if you're handling token refresh
//         });
//     } catch (error) {
//         console.error('Failed to fetch user access token:', error);
//         res.status(500).send('Failed to fetch user access token.');
//     }
// }


// exchange token with the code from the client
// async function exchangeCodeForToken(req: Request, res: Response) {
//     console.log('Starting exchangeCodeForToken');
//     const { code } = req.body;
//     console.log('Code:', code);

//     if (!code) {
//         console.error('Authorization code is required');
//         return res.status(400).send('Authorization code is required');
//     }

//     try {
//         // Exchange the authorization code for an access token
//         const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
//             client_id: GITHUB_CLIENT_ID,
//             client_secret: GITHUB_CLIENT_SECRET,
//             code,
//             redirect_uri: GITHUB_CALLBACK_URL,
//         }, {
//             headers: { Accept: 'application/json' },
//         });

//         const { access_token, token_type } = tokenResponse.data;

//         // Fetch the user's profile information from GitHub
//         const userResponse = await axios.get('https://api.github.com/user', {
//             headers: { Authorization: `token ${access_token}` },
//         });

//         const { login, id, avatar_url, html_url } = userResponse.data;

//         // Save or update the user's information in the database
//         await User.findOneAndUpdate({ githubId: id }, {
//             username: login,
//             githubId: id,
//             profileUrl: html_url,
//             avatarUrl: avatar_url,
//             accessToken: access_token, // Storing access token is optional and should be handled securely
//         }, { upsert: true, new: true });

//         // Respond after successful authentication
//         res.json({
//                         access_token: access_token,
//                         token_type: token_type,
//                         refresh_token: "example_refresh_token", // Simulated for demonstration
//                         expires_in: 3600, // Simulated value (1 hour)
//                     });
//     }
//     catch (error) {
//         console.error('Authentication failed:', error);
//         res.status(500).send('Authentication failed');
//     }
//     console.log('Ending exchangeCodeForToken');
// }

export { redirectToGitHubAuth, handleGitHubCallback, exchangeCodeForToken };


