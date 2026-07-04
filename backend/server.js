const express = require('express');
const cors = require('cors');
require('dotenv').config();

const employeesRouter = require('./routes/employees');
const customersRouter = require('./routes/customers');
const serviceRequestsRouter = require('./routes/serviceRequests');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/employees', employeesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/service-requests', serviceRequestsRouter);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
