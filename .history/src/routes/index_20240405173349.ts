import express from 'express';
import {redirectToGitHubAuth, handleGitHubCallback, exchangeCodeForToken } from './authRoutes';

const app = express();

// Add routes from authRoutes.ts
app.use