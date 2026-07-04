# Dashboard Swayog - Database Setup Guide

## Prerequisites
- Node.js and npm installed
- PostgreSQL installed and running

## Setup Steps

### 1. **Database Setup**

#### Option A: Using pgAdmin (GUI)
1. Open pgAdmin and create a new database named `dashboard_swayog`
2. Connect to the database
3. Open the Query Tool and run the SQL commands from `backend/database.sql`

#### Option B: Using Command Line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dashboard_swayog;

# Connect to the database
\c dashboard_swayog

# Run the SQL script
\i 'path/to/backend/database.sql'
```

#### Verify Connection Parameters
Make sure your PostgreSQL is running with these credentials:
- **Host**: localhost
- **Port**: 5432 (default)
- **Username**: postgresSQL
- **Password**: 12345678
- **Database**: dashboard_swayog

### 2. **Backend Setup**

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Verify .env file (should already be configured)
# Check backend/.env for correct database credentials

# Start backend server
npm run dev
```

The backend should start on `http://localhost:5000`

### 3. **Frontend Setup**

```bash
# In the main project folder
npm install

# Start frontend (Vite dev server)
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. **Run Both Simultaneously (Optional)**

```bash
# First install concurrently if not already done
npm install --save-dev concurrently

# Then run both frontend and backend together
npm run dev:full
```

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get specific employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get specific customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Health Check
- `GET /api/health` - Server health status

## Environment Variables

### Backend (.env)
```
DB_USER=postgresSQL
DB_PASSWORD=12345678
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard_swayog
PORT=5000
NODE_ENV=development
```

## Using the API in Frontend Components

Import the API client in your components:

```typescript
import { employeesAPI, customersAPI } from '@/lib/backend-api';

// Fetch employees
const employees = await employeesAPI.fetchAll();

// Fetch single employee
const employee = await employeesAPI.fetchById(1);

// Create employee
const newEmployee = await employeesAPI.create({
  name: 'John Doe',
  email: 'john@example.com',
  department: 'Engineering',
  salary: 50000
});

// Update employee
const updated = await employeesAPI.update(1, {
  name: 'Jane Doe',
  department: 'Management'
});

// Delete employee
await employeesAPI.delete(1);
```

## Troubleshooting

### Backend Won't Connect to Database
- Verify PostgreSQL is running
- Check .env credentials match your PostgreSQL setup
- Ensure database `dashboard_swayog` exists
- Check port 5432 is not blocked

### CORS Error
- Make sure frontend is running on `http://localhost:5173`
- Backend CORS is configured to allow this origin

### Port Already in Use
- Backend: Kill process on port 5000 or change PORT in .env
- Frontend: Kill process on port 5173 or Vite will use next available port

### Tables Not Found
- Run the SQL script from `backend/database.sql`
- Verify you're connected to the correct database

## Next Steps

1. Update your component files to use the API client
2. Implement React Query for better data management
3. Add authentication if needed
4. Create more API routes as needed
5. Add input validation and error handling
