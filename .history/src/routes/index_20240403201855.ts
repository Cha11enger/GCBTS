// s
import express from 'express';
import { redirectToGitHubAuthorization, handleGitHubCallback, exchangeCodeForToken } from './authRoutes';

const router = express.Router();

router.use('auth/github', redirectToGitHubAuthorization);
router.use('auth/github/callback', handleGitHubCallback);
router.use('auth/token', exchangeCodeForToken);

export default router;
