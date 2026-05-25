import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fuel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fuel_token');
      localStorage.removeItem('fuel_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) => api.put('/auth/change-password', { currentPassword, newPassword }),
  getUsers: () => api.get('/auth/users'),
  createUser: (data: Record<string, unknown>) => api.post('/auth/users', data),
  updateUser: (id: string, data: Record<string, unknown>) => api.put(`/auth/users/${id}`, data),
};

// ── Dashboard ─────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getLiveFeed: () => api.get('/dashboard/live-feed'),
};

// ── Customers ─────────────────────────────────────
export const customersApi = {
  list: (params?: Record<string, unknown>) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/customers', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getStatement: (id: string, params?: Record<string, unknown>) => api.get(`/customers/${id}/statement`, { params }),
  getTransactions: (id: string) => api.get(`/customers/${id}/transactions`),
  getBalance: (id: string) => api.get(`/customers/${id}/balance`),
};

// ── Products ──────────────────────────────────────
export const productsApi = {
  list: () => api.get('/products'),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
};

// ── Sales ─────────────────────────────────────────
export const salesApi = {
  list: (params?: Record<string, unknown>) => api.get('/sales', { params }),
  get: (id: string) => api.get(`/sales/${id}`),
  create: (data: Record<string, unknown>) => api.post('/sales', data),
  void: (id: string, reason: string) => api.delete(`/sales/${id}`, { data: { reason } }),
};

// ── Payments ──────────────────────────────────────
export const paymentsApi = {
  list: (params?: Record<string, unknown>) => api.get('/payments', { params }),
  get: (id: string) => api.get(`/payments/${id}`),
  create: (data: Record<string, unknown>) => api.post('/payments', data),
  getUnmatched: () => api.get('/payments/unmatched'),
  match: (id: string, customerId: string) => api.put(`/payments/${id}/match`, { customer_id: customerId }),
  allocate: (id: string, saleId: string, amount: number) => api.post(`/payments/${id}/allocate`, { sale_id: saleId, amount_allocated: amount }),
  stkPush: (data: Record<string, unknown>) => api.post('/payments/stk-push', data),
};

// ── Stock ─────────────────────────────────────────
export const stockApi = {
  getCurrent: () => api.get('/stock'),
  recordDelivery: (data: Record<string, unknown>) => api.post('/stock/delivery', data),
  getDeliveries: (params?: Record<string, unknown>) => api.get('/stock/deliveries', { params }),
};

// ── Reports ───────────────────────────────────────
export const reportsApi = {
  daily: (date: string) => api.get('/reports/daily', { params: { date } }),
  aging: () => api.get('/reports/aging'),
  summary: (from: string, to: string) => api.get('/reports/summary', { params: { from, to } }),
};

// ── Settings ──────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Record<string, string>) => api.put('/settings', data),
  getBankAccounts: () => api.get('/settings/bank-accounts'),
  createBankAccount: (data: Record<string, unknown>) => api.post('/settings/bank-accounts', data),
  updateBankAccount: (id: string, data: Record<string, unknown>) => api.put(`/settings/bank-accounts/${id}`, data),
};

export default api;
