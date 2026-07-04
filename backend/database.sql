-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  department VARCHAR(100),
  salary DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for employees
INSERT INTO employees (name, email, department, salary) VALUES
('Ajay Kumar', 'ajay@swayog.com', 'Engineering', 50000),
('Suresh Mehta', 'suresh@swayog.com', 'Support', 35000),
('Ramesh Yadav', 'ramesh@swayog.com', 'Installation', 40000),
('Priya Singh', 'priya@swayog.com', 'HR', 38000),
('Vikram Patel', 'vikram@swayog.com', 'Finance', 45000)
ON CONFLICT (email) DO NOTHING;

-- Sample data for customers
INSERT INTO customers (name, email, phone, address) VALUES
('Rajesh Sharma', 'rajesh@example.com', '+91 98201 11111', '45 Kothrud, Pune'),
('Anita Patel', 'anita@example.com', '+91 98202 22222', '12 Andheri West, Mumbai'),
('Vikram Singh', 'vikram@example.com', '+91 98203 33333', '78 Civil Lines, Nagpur'),
('Sneha Desai', 'sneha@example.com', '+91 98204 44444', '32 Wakad, Pune')
ON CONFLICT (email) DO NOTHING;
