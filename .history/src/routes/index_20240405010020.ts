// import authRoutes from './authRoutes';
import express from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User'; // Adjust this import according to your file structure

