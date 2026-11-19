# Cloud Deployment Guide - Swayog Employee App

## Overview
This guide covers deploying the Swayog Employee App to cloud infrastructure with proper database synchronization and production configuration.

## Prerequisites
- Neon PostgreSQL database account
- Vercel account (for deployment)
- Git repository
- Node.js 18+ installed locally

## Cloud Infrastructure Components

### 1. Database (Neon PostgreSQL)
- **Provider**: Neon (Serverless PostgreSQL)
- **Status**: ✅ Configured
- **Connection**: Already set up in `backend/.env`
- **Features**: Auto-scaling, connection pooling, SSL

### 2. Frontend Hosting (Vercel)
- **Provider**: Vercel
- **Framework**: Vite + React
- **Status**: ✅ Configured with `vercel.json`

### 3. Backend API (Vercel Serverless)
- **Provider**: Vercel Functions
- **Runtime**: Node.js
- **Status**: ✅ Configured with serverless bundling

### 4. Redis (Optional - for caching)
- **Provider**: Upstash or Redis Cloud
- **Status**: ⚠️ Disabled by default (can be enabled)
- **Purpose**: Session management, rate limiting, caching

## Deployment Steps

### Step 1: Prepare Environment Variables

#### For Vercel Deployment
Set these environment variables in your Vercel project settings:

```bash
# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:npg_4NYF3wHeqkOm@ep-red-poetry-apyaxvb1-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://neondb_owner:npg_4NYF3wHeqkOm@ep-red-poetry-apyaxvb1.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require

# Server Configuration
NODE_ENV=production
PORT=4000
TRUST_PROXY=true

# JWT Secrets (Generate secure random strings)
JWT_ACCESS_SECRET=your-super-secure-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars-different
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# CORS (Update with your actual domain)
CORS_ORIGIN=https://swayog-dashboard.vercel.app

# Redis (Optional - set to cloud Redis URL if using)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false
REDIS_KEY_PREFIX=swayog

# Rate Limiting
AUTH_LOGIN_RATE_LIMIT_MAX=20
AUTH_LOGIN_RATE_LIMIT_WINDOW_MS=900000
AUTH_REGISTER_RATE_LIMIT_MAX=10
AUTH_REGISTER_RATE_LIMIT_WINDOW_MS=900000
AUTH_REFRESH_RATE_LIMIT_MAX=30
AUTH_REFRESH_RATE_LIMIT_WINDOW_MS=300000
AUTH_LOGOUT_RATE_LIMIT_MAX=60
AUTH_LOGOUT_RATE_LIMIT_WINDOW_MS=300000
AUTH_ME_RATE_LIMIT_MAX=120
AUTH_ME_RATE_LIMIT_WINDOW_MS=600000

# Account Lockout
AUTH_LOCKOUT_ENABLED=true
AUTH_LOCKOUT_MAX_ATTEMPTS=5
AUTH_LOCKOUT_DURATION_MS=900000

# Super Admin
SEED_SUPER_ADMIN_NAME=Harshal Tapre
SEED_SUPER_ADMIN_EMAIL=harshaltapre27@gmail.com
SEED_SUPER_ADMIN_PASSWORD=Harshal.27

# Waaree API (Optional - if using Waaree integration)
WAAREE_API_BASE_URL=https://digital.waaree.com
WAAREE_API_TOKEN=your-waaree-token
WAAREE_API_SECRET=your-waaree-secret
WAAREE_PLANT_ID=your-plant-id
WAAREE_SOLAX_TOKEN_ID=your-solax-token-id
WAAREE_SOLAX_INVERTER_SN=your-inverter-sn

# Mock Database
MOCK_DATABASE=false
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts to configure your project
# Set environment variables when prompted or in Vercel dashboard later
```

#### Option B: Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install && npm install --prefix backend`
5. Add environment variables in project settings
6. Deploy

### Step 3: Database Migration

#### Run Prisma Migrations on Neon
```bash
# From backend directory
cd backend

# Generate Prisma Client
npx prisma generate

# Push schema to Neon database
npx prisma db push

# Or run migrations if you have migration files
npx prisma migrate deploy
```

#### Seed Initial Data (Optional)
```bash
# Seed super admin and initial data
npx prisma db seed
```

### Step 4: Verify Deployment

#### Check Database Connection
```bash
# Test database connection
cd backend
npx prisma db pull
```

#### Test API Endpoints
```bash
# Health check
curl https://your-app.vercel.app/api/v1/health

# Test login
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "harshaltapre27@gmail.com",
    "password": "Harshal.27"
  }'
```

#### Check Frontend
- Open your Vercel deployment URL
- Test login functionality
- Verify database operations work

## Cloud Sync Configuration

### Database Sync Status
The application is configured to sync with Neon PostgreSQL cloud database:

**Current Configuration:**
- **Database**: Neon PostgreSQL
- **Connection Pooling**: Enabled (pgbouncer)
- **SSL**: Required
- **Region**: us-east-1
- **Status**: ✅ Active and connected

### Real-time Sync Features
The application includes:
- **Prisma ORM**: Handles database queries with automatic connection pooling
- **Connection Retry Logic**: Automatic retries on connection failures
- **Fallback Mode**: Mock database fallback in development (disabled in production)
- **Background Schedulers**: 
  - Growatt telemetry sync (30-minute intervals)
  - Waaree telemetry sync (30-minute intervals)

### Monitoring Database Sync

#### Check Connection Status
```bash
# View server logs in Vercel Dashboard
# Look for: "[Startup] Database connection successfully established."
```

#### Monitor Sync Operations
```sql
-- Check recent audit logs for sync operations
SELECT action, metadata, "createdAt" 
FROM "AuditLog" 
WHERE action LIKE '%SYNC%' 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

## Redis Configuration (Optional)

### Enable Redis for Production
For better performance and session management, enable Redis:

1. **Create Redis Instance**
   - Sign up for [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com/try-free/)
   - Create a new Redis database
   - Get the connection URL

2. **Update Environment Variables**
   ```bash
   REDIS_URL=rediss://default:password@host:port
   REDIS_ENABLED=true
   ```

3. **Redeploy Application**
   - Push changes to trigger redeployment
   - Redis will automatically connect

### Redis Benefits
- Session management
- Rate limiting
- Query result caching
- Background job queue

## Troubleshooting

### Database Connection Issues

#### Symptom: "Database connection failure"
**Solutions:**
1. Verify `DATABASE_URL` is correct in Vercel environment variables
2. Check Neon database status in Neon dashboard
3. Ensure SSL is enabled (`sslmode=require`)
4. Verify connection pooling is enabled (`pgbouncer=true`)

#### Symptom: "Connection timeout"
**Solutions:**
1. Check network connectivity
2. Verify Neon database region matches your deployment region
3. Increase timeout values in Prisma configuration

### CORS Issues

#### Symptom: "CORS policy error"
**Solutions:**
1. Update `CORS_ORIGIN` to include your actual domain
2. Ensure no trailing slashes in domain URLs
3. Separate multiple domains with commas

### Build Issues

#### Symptom: "Build failed"
**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are installed
3. Verify `vercel-build` script is correct
4. Check for TypeScript errors

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to Git
- Use Vercel's environment variable management
- Rotate secrets regularly
- Use different secrets for different environments

### 2. Database Security
- Enable SSL connections
- Use connection pooling
- Implement proper indexing
- Regular backups (Neon handles this automatically)

### 3. API Security
- Keep JWT secrets secure and long
- Implement rate limiting
- Use HTTPS only
- Enable CORS only for trusted domains

### 4. Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Track failed login attempts
- Set up alerts for critical errors

## Performance Optimization

### Database Optimization
```sql
-- Ensure indexes exist (already in schema)
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_isActive ON "User"("isActive");
CREATE INDEX IF NOT EXISTS idx_auditlog_action ON "AuditLog"(action);
```

### Caching Strategy
- Enable Redis for session management
- Cache frequently accessed data
- Use CDN for static assets
- Implement API response caching

### CDN Configuration
- Vercel automatically provides CDN
- Static assets are cached at edge
- API responses can be cached with proper headers

## Scaling Considerations

### Horizontal Scaling
- Vercel automatically scales serverless functions
- Neon database scales automatically
- Consider Redis for session management across instances

### Vertical Scaling
- Monitor resource usage in Vercel dashboard
- Upgrade Vercel plan if needed
- Optimize database queries

## Backup and Recovery

### Database Backups
- Neon provides automatic daily backups
- Point-in-time recovery available
- Manual backups can be created via Neon dashboard

### Application Backups
- Git repository serves as backup
- Environment variables stored in Vercel
- Regular deployments create rollback points

## Maintenance

### Regular Tasks
- Monitor error logs weekly
- Review database performance monthly
- Update dependencies regularly
- Rotate secrets quarterly

### Updates and Upgrades
```bash
# Update dependencies
npm update

# Test locally before deploying
npm run dev

# Deploy to Vercel
vercel --prod
```

## Support and Resources

### Documentation
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Troubleshooting Resources
- Vercel deployment logs
- Neon database logs
- Application error logs
- Audit logs in database

## Success Criteria

- ✅ Database connects successfully to Neon
- ✅ Application deploys to Vercel without errors
- ✅ API endpoints respond correctly
- ✅ Frontend loads and functions properly
- ✅ Database operations work in production
- ✅ Real-time sync features operational
- ✅ Error monitoring in place
- ✅ Security best practices implemented

## Next Steps

1. **Deploy to Vercel**: Follow the deployment steps above
2. **Configure Monitoring**: Set up error tracking and logging
3. **Enable Redis**: Optional but recommended for production
4. **Test Thoroughly**: Verify all functionality works in production
5. **Monitor Performance**: Keep an eye on performance metrics
6. **Regular Maintenance**: Follow the maintenance schedule

---

**Last Updated**: 2026-07-11
**Version**: 1.0.0
**Status**: Ready for Production Deployment
