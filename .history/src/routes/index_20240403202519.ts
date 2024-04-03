// src/routes/index.ts
import express from 'express';
import { redirectToGitHubAuthorization, handleGitHubCallback, exchangeCodeForToken } from './authRoutes';

const router = express.Router();

router.get('/auth/github', redirectToGitHubAuthorization);
router.get('/auth/github/callback', handleGitHubCallback);
router.use('auth/token', exchangeCodeForToken);

export default router;
