# Swayog Energy Dashboard

The Swayog Energy Dashboard is a web application for managing solar operations, customers, employees, projects, and service workflows. It is built with React, TypeScript, and Vite, with an Express API and Prisma-backed PostgreSQL database.

## Current capabilities

- Admin and employee dashboards, including employee management and configurable sidebar-section permissions.
- Finance workspace for customer receivables, invoices and collections, vendor payables, expenses, partner commissions, zone reporting, and company P&L.
- Customer onboarding from initial enquiry through review, site visit, quotation, customer decision, and approval/conversion.
- Marketing lead, campaign, and follow-up management, including Excel lead import/export and lead addresses.
- Site visits with survey submission, survey review, and supporting image uploads.
- Customer, partner, project, task, attendance, inventory, and service workflows.
- Authentication and role-based API access.

## Technology

- Frontend: React 18, TypeScript, Vite, Tailwind CSS.
- Backend: Node.js, Express, TypeScript.
- Data: PostgreSQL and Prisma.
- Optional integrations include Redis and Cloudflare R2; configure them only when needed.

## Local development

Prerequisites: Node.js, npm, and a PostgreSQL database.

1. Install root and backend dependencies:

   ```sh
   npm install
   npm install --prefix backend
   ```

2. Create `backend/.env` using [backend/.env.example](./backend/.env.example) as a reference. Set at least `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`. Use distinct random JWT secrets of at least 32 characters. Configure any integration settings you use.

3. Generate the Prisma client and apply the database migrations:

   ```sh
   npm run prisma:generate --prefix backend
   npm run prisma:migrate:deploy --prefix backend
   ```

   For local schema development, use `npm run prisma:migrate --prefix backend` instead; Prisma will create a migration interactively based on schema changes.

4. Optionally seed the super-admin account. Set `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD` in `backend/.env` first:

   ```sh
   npm run prisma:seed --prefix backend
   ```

5. Start both frontend and backend:

   ```sh
   npm run dev
   ```

   The frontend is served at `http://localhost:3000`; the API listens on `http://localhost:4000`. Vite proxies `/api` and `/uploads` requests to the backend.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the frontend and backend in development mode. |
| `npm run dev:frontend` | Start only the Vite frontend. |
| `npm run backend:dev` | Start only the backend. |
| `npm run typecheck` | Type-check the frontend. |
| `npm run typecheck --prefix backend` | Type-check the backend. |
| `npm run build` | Bundle the backend for Vercel and build the frontend. |
| `npm run db:studio` | Open Prisma Studio for the configured database. |

Backend-specific scripts are available through `npm run <script> --prefix backend`, including `typecheck`, `build`, and the Prisma commands above.

## API and implementation references

- [Backend setup and API notes](./backend/README.md)
- [API endpoints documentation](./API_ENDPOINTS_DOCUMENTATION.md)
- [Android release distribution setup](./QUICK_SETUP_GUIDE.md)
- [Database schema documentation](./DATABASE_SCHEMA_DOCUMENTATION.md)
- [Documentation index](./Doc/README.md)
