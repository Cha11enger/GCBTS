// src/routes/index.ts
import express from 'express';
import { redirectToGitHubAuthorization, handleGitHubCallback, exchangeCodeForToken } from './authRoutes';

const router = express.Router();

router.get('/auth/github', redirectToGitHubAuthorization);
router.get('/auth/github/callback', handleGitHubCallback);
// router.use('auth/token', exchangeCodeForToken);
router.post('/auth/token', async (req, res) => {
    const { code } = req.body; // Make sure to validate the presence of 'code'
    try {
        const tokenInfo = await exchangeCodeForToken(code);
        res.json(tokenInfo);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

export default router;
