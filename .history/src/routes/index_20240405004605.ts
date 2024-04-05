// src/routes/index.ts
import express from 'express';
import { githubOauth} from './authRoutes';
import { Application } from 'express';

const router: Router = express.Router();

router.get('/auth/github', githubOauth);
// router.get('/auth/github/callback', handleGitHubCallback);
// router.use('auth/token', exchangeCodeForToken);
// router.post('/auth/token', async (req, res) => {
//     const { code } = req.body; // Make sure to validate the presence of 'code'
//     try {
//         const tokenInfo = await exchangeCodeForToken(code, res); // Pass the response object as the second argument
//         res.json(tokenInfo);
//     } catch (error: any) {
//         res.status(500).send(error.message);
//     }
// });
// router.post('/token', exchangeCodeForToken);

export default router;
