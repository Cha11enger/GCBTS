import express from 'express';
import { redirectToGitHubAuthorization, handleGitHubCallback, exchangeCodeForToken } from './authRoutes';

const router = express.Router();

router.use('auth/github', redirectToGitHubAuthorization);
router.use('/github/callback', handleGitHubCallback);
router.use('/token', exchangeCodeForToken);

export default router;
