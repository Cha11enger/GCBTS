import express from 'express';
import { redirectToGitHubAuthorization, handleGitHubCallback, tokenRoute } from './authRoutes';

const router = express.Router();

router.use('/github', githubRoute);
router.use('/github/callback', handleGitHubCallback);
router.use('/token', tokenRoute);

export default router;
