// Create a new file: src/middlewares/verifyToken.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.query.token as string || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).send('A token is required for authentication');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = decoded;
    } catch (error) {
        return res.status(401).send('Invalid Token');
    }
    next();
};
