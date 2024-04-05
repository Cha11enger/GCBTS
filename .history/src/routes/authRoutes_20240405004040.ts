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


// 