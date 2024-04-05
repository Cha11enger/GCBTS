import express from 'express';
import {redirectToGitHubAuth, handleGitHubCallback, exchangeCodeForToken } from './authRoutes';

const app = express();

// Add routes from authRoutes.ts
app.use

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});