import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { json } from 'body-parser';
import dotenv from 'dotenv';

import { authRoutes } from './routes/authRoutes';
import { employeeRoutes } from './routes/employeeRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/validation';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ──────────────────────────────────────────────────────────────────────────────
// Security & Middleware
// ──────────────────────────────────────────────────────────────────────────────

// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parser middleware
app.use(json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// General API rate limiter
app.use('/api/', apiLimiter);

// ──────────────────────────────────────────────────────────────────────────────
// Health Check Endpoint
// ──────────────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────────────────────────────────────

// Authentication routes
app.use('/api/auth', authRoutes);

// Employee routes
app.use('/api/employees', employeeRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// ──────────────────────────────────────────────────────────────────────────────
// Error Handling & 404
// ──────────────────────────────────────────────────────────────────────────────

// 404 handler (before general error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ──────────────────────────────────────────────────────────────────────────────
// Server Startup
// ──────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;