// src/routes/authRoutes.ts
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User';

