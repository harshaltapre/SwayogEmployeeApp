const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all service requests
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_requests ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch service requests' });
  }
});

// Create a service request
router.post('/', async (req, res) => {
  try {
    const { customerId, title, description } = req.body;
    const result = await pool.query(
      'INSERT INTO service_requests (customer_id, title, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [customerId, title, description, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create service request' });
  }
});

// Update service request scheduling
router.patch('/:id', async (req, res) => {
  try {
    const { scheduledDate, scheduledTime, status } = req.body;
    const result = await pool.query(
      'UPDATE service_requests SET scheduled_date = $1, scheduled_time = $2, status = $3 WHERE id = $4 RETURNING *',
      [scheduledDate, scheduledTime, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update service request' });
  }
});

module.exports = router;
