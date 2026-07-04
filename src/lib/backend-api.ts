/**
 * Backend API Client - Real Database Calls
 * Replace mock data with actual API calls to the Express backend
 */

const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const API_BASE_URL = isLocalhost ? 'http://localhost:4000/api' : '/api';

// ─── Employees API ────────────────────────────────────────────────────────────

export const employeesAPI = {
  fetchAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      return await response.json();
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  fetchById: async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`);
      if (!response.ok) throw new Error('Failed to fetch employee');
      return await response.json();
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create employee');
      return await response.json();
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  update: async (id: number, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update employee');
      return await response.json();
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete employee');
      return await response.json();
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },
};

// ─── Customers API ────────────────────────────────────────────────────────────

export const customersAPI = {
  fetchAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  fetchById: async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      return await response.json();
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  update: async (id: number, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update customer');
      return await response.json();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete customer');
      return await response.json();
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },
};

// ─── Service Requests API ─────────────────────────────────────────────────────

export const serviceRequestsAPI = {
  fetchAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/service-requests`);
      if (!response.ok) throw new Error('Failed to fetch service requests');
      return await response.json();
    } catch (error) {
      console.error('Error fetching service requests:', error);
      throw error;
    }
  },

  create: async (data: { customerId: number; title: string; description: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create service request');
      return await response.json();
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  },

  update: async (id: number, data: { scheduledDate?: string; scheduledTime?: string; status?: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update service request');
      return await response.json();
    } catch (error) {
      console.error('Error updating service request:', error);
      throw error;
    }
  },
};

// ─── Health Check ────────────────────────────────────────────────────────────

export const checkBackendConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};
