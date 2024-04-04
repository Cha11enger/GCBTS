// src/routes/index.ts
import express from 'express';
import { redirectToGitHubAuthorization, handleGitHubCallback, } from './authRoutes';

const router = express.Router();

router.get('/auth/github', redirectToGitHubAuthorization);
router.get('/auth/github/callback', handleGitHubCallback);
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

export default router;