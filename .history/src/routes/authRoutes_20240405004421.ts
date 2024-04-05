// src/routes/authRoutes.ts
import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User'; // Adjust the path as necessary
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';

const router = express.Router();

const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL,
    GPT_CALLBACK_URL
} = process.env;

// github auth using passport js
const githubOauth = passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID || '',
    clientSecret: GITHUB_CLIENT_SECRET || '',
    callbackURL: GITHUB_CALLBACK_URL || ''
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        const { id, username, profileUrl, avatarUrl } = profile;
        const user = await User.findOneAndUpdate({ githubId: id }, {
            username,
            githubId: id,
            profileUrl,
            avatarUrl,
            accessToken
        }, { upsert: true, new: true });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

export()

