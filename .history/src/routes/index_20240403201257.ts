import express from 'express';
import { redirectToGitHubAuthorization, handleGitHubCallback, exchangeCodeForToken } from './authRoutes';

const router = express.Router();

router.use('/github', githubRoute);
router.use('/github/callback', handleGitHubCallback);
router.use('/token', exchangeCodeForToken);

export default router;
