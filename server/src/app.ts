import cookieParser from 'cookie-parser';
import express, { Application } from 'express';
import morgan from 'morgan';
import { env } from './config/env.config';
import { morganStream } from './config/logger.config';
import { PLATFORM_CONSTANTS } from './constants';
import { globalErrorHandler } from './middlewares/globalErrorHandler.middleware';
import { notFoundHandler } from './middlewares/notFoundHandler.middleware';
import { corsMiddleware, globalRateLimiter, helmetMiddleware } from './middlewares/security.middleware';

// Module 1-8 Routes
import albumRoute from './routes/album.route';
import authRoute from './routes/auth.route';
import calendarEventRoute from './routes/calendarEvent.route';
import chatRoute from './routes/chat.route';
import healthRoute from './routes/health.route';
import lifeExperienceRoute from './routes/lifeExperience.route';
import mediaRoute from './routes/media.route';
import profileRoute from './routes/profile.route';
import timelineEventRoute from './routes/timelineEvent.route';
import userRoute from './routes/user.route';

// Module 9: Social Engine Routes
import activityRoute from './routes/activity.route';
import commentRoute from './routes/comment.route';
import notificationRoute from './routes/notification.route';
import reactionRoute from './routes/reaction.route';
import reportRoute from './routes/report.route';
import socialRoute from './routes/social.route';
import storyRoute from './routes/story.route';

// Module Shared Music
import musicRoute from './routes/music.route';

// Module X: Stealth Calculator Gateway
import stealthRoute from './routes/stealth.route';

// Module Enterprise Admin Portal
import adminRoute from './routes/admin.route';

// Public Invite Route
import publicInviteRoute from './routes/publicInvite.route';

const app: Application = express();

// Security Middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(globalRateLimiter);

// Core Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// HTTP Request Logger
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined', { stream: morganStream }));

const API = PLATFORM_CONSTANTS.API_PREFIX;

// Mount Module 1-8 API Routes
app.use(API, healthRoute);
app.use(`${API}/auth`, authRoute);
app.use(`${API}/users`, userRoute);
app.use(`${API}/profile`, profileRoute);
app.use(`${API}/media`, mediaRoute);
app.use(`${API}/albums`, albumRoute);
app.use(`${API}/timeline`, timelineEventRoute);
app.use(`${API}/calendar`, calendarEventRoute);
app.use(`${API}/chat`, chatRoute);
app.use(`${API}/life-experience`, lifeExperienceRoute);

// Mount Module 9: Social Engine API Routes
app.use(`${API}/social`, socialRoute);
app.use(`${API}/stories`, storyRoute);
app.use(`${API}/reactions`, reactionRoute);
app.use(`${API}/comments`, commentRoute);
app.use(`${API}/feed`, activityRoute);
app.use(`${API}/notifications`, notificationRoute);
app.use(`${API}/reports`, reportRoute);

// Mount Shared Music API Routes
app.use(`${API}/music`, musicRoute);

// Mount Module X: Stealth Calculator Gateway API Routes
app.use(`${API}/stealth`, stealthRoute);

// Mount Enterprise Admin Portal API Routes
app.use(`${API}/admin`, adminRoute);

// Mount Public Invite Validation Routes
app.use(`${API}/invites`, publicInviteRoute);

// Welcome Root Route
app.get('/', (_req, res) => {
  res.json({
    message: `Welcome to ${PLATFORM_CONSTANTS.APP_NAME} API Engine`,
    healthCheck: `${API}/health`,
    relationshipStart: PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE,
  });
});

// 404 Route Not Found Middleware
app.use(notFoundHandler);

// Global Error Handler Middleware
app.use(globalErrorHandler);

export default app;
