# SWAYOG Backend (Phase 1)

Express + Prisma + PostgreSQL backend foundation for Solar OS platform.

## Implemented in this phase
- Auth endpoints:
  - POST /api/v1/auth/register (customer self-signup only)
  - POST /api/v1/auth/login (email or loginId)
  - POST /api/v1/auth/refresh
  - POST /api/v1/auth/logout
  - GET /api/v1/auth/me
- Internal user creation endpoint:
  - POST /api/v1/users/internal (super_admin/admin only)
   - GET /api/v1/users/internal (super_admin/admin only)
- Roles:
  - SUPER_ADMIN, ADMIN, EMPLOYEE, PARTNER, CUSTOMER
- Prisma models:
  - User, RefreshToken, AuditLog

## Setup
1. Copy .env.example to .env and update values.
2. Install dependencies:
   - npm install
3. Generate Prisma client:
   - npm run prisma:generate
4. Create migration:
   - npm run prisma:migrate -- --name init_auth
5. Seed super admin:
   - npm run prisma:seed
6. Run dev server:
   - npm run dev

## Docker Compose (Backend + PostgreSQL + Redis)
From workspace root:
1. Build and start services:
   - docker compose up --build -d
2. Check app health:
   - http://localhost:4000/api/v1/health
3. Stop stack:
   - docker compose down

Compose provisions:
- backend API on port 4000
- PostgreSQL on port 5432
- Redis on port 6379

The backend container automatically runs Prisma migrate deploy before start.

## View Database Data
- Run Prisma Studio to inspect all tables (users, refresh tokens, audit logs, customers, profiles):
   - npm run prisma:studio
- From workspace root, you can also use:
   - npm run db:studio
- Using Dockerized Postgres from host (example with psql):
   - psql postgresql://postgres:postgres@localhost:5432/swayog_db

## Frontend Sync
- Frontend reads API URL in this order:
   1. VITE_AUTH_API_BASE_URL
   2. VITE_API_BASE_URL
   3. Default fallback on localhost: http://localhost:4000
- This allows local login/register to work without manual env setup during development.

## Notes
- JWT secrets must be at least 32 chars.
- loginId is auto-generated per role prefix (example: EMP-AB12CD).
- Customer self-signup is restricted to CUSTOMER role by design.
- Frontend login now requires real backend auth API; demo credentials fallback has been removed.
- Seed credentials from `.env` are applied for super admin by `npm run prisma:seed`.
- Refresh-token revocation uses Redis cache with DB fallback when Redis is unavailable.
- Login endpoints include rate limiting and account lockout policy (5 failures -> 15 minutes).
