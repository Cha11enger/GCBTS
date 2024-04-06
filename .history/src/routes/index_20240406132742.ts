import express from 'express';
import {redirectToGitHubAuth, handleGitHubCallback, exchangeCodeForToken } from './authRoutes';

const router = express.Router();

router.get('/oauth/authorize', redirectToGitHubAuth);
router.post('/oauth/authorize', redirectToGitHubAuth);
router.get('/oauth/authorize/callback', handleGitHubCallback);
router.get('/oauth/exchange', exchangeCodeForToken);

export default router;
// Path: src/routes/authRoutes.ts

