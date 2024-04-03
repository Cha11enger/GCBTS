import express from 'express';
import { exchangeCodeForToken } from './authRoutes';

const router = express.Router();

router.post('/token', async (req, res) => {
    try {
        const token = await exchangeCodeForToken(req.body.code);
        // Handle the token response accordingly
        res.status(200).json({ token });
    } catch (error) {
        // Handle any errors that occur during the token exchange
        res.status(500).json({ error: 'Token exchange failed' });
    }
});

export default router;