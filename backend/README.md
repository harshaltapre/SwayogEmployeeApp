 # Swayog Dashboard Backend

The backend is an Express API written in TypeScript. Prisma manages the PostgreSQL schema and migrations. API routes are versioned under `/api/v1`.

## Features

- Authentication, refresh-token management, role-based access, and internal user management.
- Customer onboarding, including request tracking, site visits, quotations, survey submissions and reviews, survey image uploads, and conversion approval.
- Finance APIs for receivables, invoices, expenses, vendor payables, partner commissions, AMC records, zone reporting, and company P&L.
- Supporting APIs for the dashboard's customer, employee, task, attendance, inventory, and service workflows.
- Optional integrations for Redis and Cloudflare R2 object storage.

## Finance API

The finance endpoints are mounted at `/api/v1/financials` and `/api/v1/invoices`. They require an access token and resolve the caller's finance authority from the active database user on every request.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/financials/me` | Return the caller's finance level, permissions, Service Coordinator state, and approval limits. |
| `GET` | `/financials/summary` | Return invoice-based revenue, collections, outstanding amounts, collection rate, and estimated pipeline. |
| `GET` | `/financials/customer-ledger` | Return customer receivables and unbilled contract amounts. |
| `GET` | `/financials/vendor-payables` | Return supplier purchases, partner commissions, payroll totals, and expenses. |
| `GET` | `/financials/zones` | Return zone revenue and growth against the preceding period. |
| `GET` | `/financials/pnl` | Return monthly P&L for finance managers, heads, and admins. |
| `GET` | `/financials/amc` | Return active AMC records for finance staff or Service Coordinators. |
| `GET` | `/financials/payouts` | Return partner payout status, scoped to the partner when applicable. |
| `GET` | `/financials/expenses` | List recorded expenses. |
| `POST` | `/financials/expenses` | Record an operational or project expense. |
| `POST` | `/financials/commissions/:customerId/confirm` | Confirm a commission payout with a proof upload. |
| `GET` | `/invoices` | List invoices with customer, partner, Service Coordinator, or finance-scoped access. |
| `POST` | `/invoices` | Create an invoice, optionally with a JPG, PNG, or PDF proof. |
| `PATCH` | `/invoices/:id` | Update invoice details or payment status. |
| `DELETE` | `/invoices/:id` | Delete an invoice with finance invoice-delete permission. |

Finance executives create and update invoices, while managers and heads can delete invoices, view company P&L, and approve payouts within authorization limits. The default Finance Manager approval limit is ₹100,000; set `FINANCE_MANAGER_APPROVAL_LIMIT_INR` to change it. Approvers cannot approve a transaction they created or a payment to themselves. Service Coordinators are limited to AMC invoices and AMC operational records.

## Customer onboarding API

All onboarding routes are mounted at `/api/v1/onboarding` and require an access token. Request bodies and query parameters are validated.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/stats` | Onboarding dashboard counts. |
| `GET` | `/requests` | List and filter onboarding requests. |
| `POST` | `/requests` | Create an onboarding request. |
| `GET` | `/requests/:id` | Get a request and its details. |
| `PATCH` | `/requests/:id` | Update request details. |
| `PATCH` | `/requests/:id/stage` | Advance or update the workflow stage. |
| `POST` | `/requests/:id/approve-conversion` | Approve conversion into a customer. |
| `POST` | `/site-visits` | Schedule or create a site visit. |
| `PATCH` | `/site-visits/:id` | Update site-visit details. |
| `POST` | `/site-visits/:id/submit-survey` | Submit a site survey. |
| `POST` | `/site-visits/:id/review` | Review a submitted survey. |
| `POST` | `/site-visits/:id/images` | Upload a survey image (`multipart/form-data`, field `image`). |
| `GET` | `/site-visits/:id/images` | List images for a site visit. |
| `POST` | `/quotations` | Create a quotation. |
| `PATCH` | `/quotations/:id` | Update a quotation. |

Super admins and admins can approve conversion. Admins, sub-admins, and super admins manage requests, visits, quotations, and survey reviews; Project Coordinators can also create site visits. Employees can view requests and submit surveys or survey images for site visits. Marketing Executive employees can create onboarding requests.

The admin frontend provides an onboarding overview and request list with search and stage filters. Its workflow stages include initial review, site-visit scheduling and completion, quotation preparation and review, customer decision, approval/conversion, and rejection/cancellation.

## Local setup

Prerequisites: Node.js, npm, and a PostgreSQL database.

1. From the repository root, create `backend/.env` using [`.env.example`](./.env.example) as a reference. Configure `DATABASE_URL`, `DIRECT_URL`, and distinct `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values (at least 32 characters each). Add integration settings as needed.
2. Install backend dependencies from the repository root:

   ```sh
   npm install --prefix backend
   ```

3. Generate the Prisma client and apply committed migrations:

   ```sh
   npm run prisma:generate --prefix backend
   npm run prisma:migrate:deploy --prefix backend
   ```

   When developing the schema locally, `npm run prisma:migrate --prefix backend` creates and applies a development migration.

4. To seed a super-admin account, configure `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD` in `backend/.env`, then run:

   ```sh
   npm run prisma:seed --prefix backend
   ```

5. Start the API alone with:

   ```sh
   npm run backend:dev
   ```

   Or start the frontend and backend together from the repository root with `npm run dev`. The API listens on port `4000` by default.

## Docker Compose

From the repository root:

```sh
docker compose up --build -d
```

Check the health endpoint at `http://localhost:4000/api/v1/health`, then stop the stack with:

```sh
docker compose down
```

Compose provisions the backend, PostgreSQL, and Redis. The backend container applies Prisma migrations before starting. On Render, pending migrations are attempted before startup; on Vercel, migrations are opt-in with `RUN_PRISMA_MIGRATE=1` rather than running on every build.

## Database tools

Open Prisma Studio from the repository root:

```sh
npm run db:studio
```

Or run it directly in the backend package with `npm run prisma:studio --prefix backend`.

## Frontend API configuration

The frontend reads its API base URL in this order:

1. `VITE_AUTH_API_BASE_URL`
2. `VITE_API_BASE_URL`
3. The local development fallback, `http://localhost:4000`

During local development, Vite proxies `/api` and `/uploads` to the backend on port `4000`.

## API reference

The main route reference is [API_ENDPOINTS_DOCUMENTATION.md](../API_ENDPOINTS_DOCUMENTATION.md).
It documents paths relative to `/api/v1` unless a section specifies a different
base path. The backend also exposes a health check at
`GET /api/v1/health`.

For Android APK distribution, see the root
[release setup guide](../QUICK_SETUP_GUIDE.md). R2 settings used by the backend
are listed in [`.env.example`](./.env.example).
