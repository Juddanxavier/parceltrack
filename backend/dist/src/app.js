/** @format */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import winston from 'winston';
import * as Sentry from '@sentry/node';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Load environment variables
dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});
// Initialize Sentry
if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
}
// Winston logger setup
const logger = winston.createLogger({
    level: 'info',
    format: process.env.NODE_ENV === 'production'
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : winston.format.combine(winston.format.colorize(), winston.format.timestamp(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })),
    transports: [new winston.transports.Console()],
});
const app = express();
// CORS must be first
app.use(cors({
    origin: [
        'http://localhost:5173', // Your frontend
        'https://your-frontend.com',
        'https://hoppscotch.io',
    ],
    credentials: true,
}));
// Harden API
app.disable('x-powered-by');
app.use(hpp());
// Parse cookies
app.use(cookieParser());
// Parse JSON bodies
const betterAuthHandler = toNodeHandler(auth);
function expressCompatibleBetterAuth(req, res, next) {
    Promise.resolve(betterAuthHandler(req, res))
        .then(() => {
        if (!res.headersSent)
            next();
    })
        .catch(next);
}
// app.all('/api/auth', expressCompatibleBetterAuth);
// app.all('/api/auth/*', expressCompatibleBetterAuth);
app.all('/api/auth/{*any}', expressCompatibleBetterAuth);
// app.all('/api/auth/*', expressCompatibleBetterAuth);
app.use(express.json());
app.use(helmet({
    contentSecurityPolicy: false, // Set to true and configure CSP in production
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: true,
    referrerPolicy: { policy: 'no-referrer' },
}));
// Sentry integration (v9.x+)
if (process.env.SENTRY_DSN) {
    if (typeof Sentry.setupExpressErrorHandler === 'function') {
        Sentry.setupExpressErrorHandler(app);
    }
}
// Rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
}));
import adminRoutes from './routes/admin';
// Health check route
app.get('/api/health', (req, res) => {
    logger.info('Health check endpoint hit');
    res.json({ status: 'ok' });
});
app.post('/api/echo', (req, res) => {
    const schema = z.object({
        message: z.string().min(1),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Invalid input', details: result.error.errors });
        return;
    }
    res.json({ echo: result.data.message });
});
// Debug route to check current user
app.get('/api/debug/me', async (req, res) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });
        if (!session) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true },
        });
        res.json({
            session: session,
            user: user,
            userId: session.user.id
        });
    }
    catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Admin routes
app.use('/api/admin', adminRoutes);
// Global error handler (never leak stack traces)
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err });
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
    }
    res.status(500).json({ error: 'Internal Server Error' });
});
export default app;
