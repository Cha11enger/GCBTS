import express from 'express';
import {authRoutes from './authRoutes';}

const app = express();

// Add routes from authRoutes.ts
app.use('/auth', authRoutes);

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});