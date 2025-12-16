import axios from 'axios';

const API_URL = 'http://rent-manager-api-blond.vercel.app/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me')
};

// Property API
export const propertyAPI = {
  getAll: () => api.get('/properties'),
  getOne: (id) => api.get(`/properties/${id}`),
  create: (propertyData) => api.post('/properties', propertyData),
  update: (id, propertyData) => api.put(`/properties/${id}`, propertyData),
  assignTenant: (propertyId, tenantId) => api.post(`/properties/${propertyId}/assign-tenant`, { tenantId }),
  delete: (id) => api.delete(`/properties/${id}`)
};

// Tenant API
export const tenantAPI = {
  getAll: () => api.get('/tenants'),
  getOne: (id) => api.get(`/tenants/${id}`),
  create: (tenantData) => api.post('/tenants', tenantData),
  update: (id, tenantData) => api.put(`/tenants/${id}`, tenantData),
  assignProperty: (tenantId, propertyId) => api.post(`/tenants/${tenantId}/assign-property`, { propertyId }),
  delete: (id) => api.delete(`/tenants/${id}`)
};

// Rent API
export const rentAPI = {
  getAll: () => api.get('/rent'),
  getOne: (id) => api.get(`/rent/${id}`),
  assignTenantToProperty: (propertyId, tenantId) => api.post('/rent', { propertyId, tenantId }),
  create: (rentData) => api.post('/rent', rentData),
  regenerate: (propertyId, tenantId) => api.post('/rent/regenerate', { propertyId, tenantId }),
  update: (id, rentData) => api.put(`/rent/${id}`, rentData),
  markAsPaid: (id, paidAmount, paymentMethod, paidDate) => api.patch(`/rent/${id}/pay`, { paidAmount, paymentMethod, paidDate }),
  delete: (id) => api.delete(`/rent/${id}`),
  getStatistics: () => api.get('/rent/statistics')
};

export default api;
