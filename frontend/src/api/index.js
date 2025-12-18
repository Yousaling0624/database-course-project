import request from './request';

// Auth
export const login = (data) => request.post('/login', data);

// Dashboard
export const getStats = () => request.get('/dashboard/stats');

// Users
export const getUsers = () => request.get('/users');
export const createUser = (data) => request.post('/users', data);
export const updateUser = (id, data) => request.put(`/users/${id}`, data);
export const deleteUser = (id) => request.delete(`/users/${id}`);

// Medicines
export const getMedicines = (search) => request.get('/medicines', { params: { search } });
export const createMedicine = (data) => request.post('/medicines', data);
export const updateMedicine = (id, data) => request.put(`/medicines/${id}`, data);
export const deleteMedicine = (id) => request.delete(`/medicines/${id}`);

// Customers
export const getCustomers = (keyword) => request.get('/customers', { params: { keyword } });
export const createCustomer = (data) => request.post('/customers', data);
export const updateCustomer = (id, data) => request.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => request.delete(`/customers/${id}`);

// Suppliers
export const getSuppliers = (keyword) => request.get('/suppliers', { params: { keyword } });
export const createSupplier = (data) => request.post('/suppliers', data);
export const updateSupplier = (id, data) => request.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => request.delete(`/suppliers/${id}`);

// Inbound
export const getInbounds = (keyword) => request.get('/inbounds', { params: { keyword } });
export const createInbound = (data) => request.post('/inbounds', data);

// Sales
export const getSales = (keyword, type) => request.get('/sales', { params: { keyword, type } });
export const createSale = (data) => request.post('/sales', data);

// Reports
export const getInboundReport = (startDate, endDate) => request.get('/reports/inbound', { params: { start_date: startDate, end_date: endDate } });
export const getInventoryReport = () => request.get('/reports/inventory');
export const getSalesReport = (startDate, endDate) => request.get('/reports/sales', { params: { start_date: startDate, end_date: endDate } });
export const getFinancialReport = (type) => request.get('/reports/financial', { params: { type } });

// Returns
export const createSalesReturn = (data) => request.post('/returns/sales', data);
export const createPurchaseReturn = (data) => request.post('/returns/purchase', data);

// Stock Adjustment
export const adjustStock = (data) => request.post('/stock/adjust', data);

// System Maintenance
export const backupDatabase = () => request.get('/system/backup');
export const restoreDatabase = (data) => request.post('/system/restore', data);

// Fuzzy Search
export const searchUsers = (keyword) => request.get('/search/users', { params: { keyword } });
export const searchCustomers = (keyword) => request.get('/search/customers', { params: { keyword } });
export const searchSuppliers = (keyword) => request.get('/search/suppliers', { params: { keyword } });

// Database Configuration
export const getDatabaseStatus = () => request.get('/system/database/status');
export const getDatabaseConfig = () => request.get('/system/database');
export const updateDatabaseConfig = (data) => request.post('/system/database', data, { timeout: 30000 });
export const testDatabaseConfig = (data) => request.post('/system/database/test', data, { timeout: 30000 });
export const resetSampleData = () => request.post('/system/reset-sample-data', {}, { timeout: 60000 });

// Analysis
export const getTopSellingAnalysis = (startDate, endDate, sortBy = 'total_sold', orderBy = 'DESC', limit = 100) => request.get('/analysis/top-selling', { params: { start_date: startDate, end_date: endDate, sort_by: sortBy, order_by: orderBy, limit } });
export const getSalesTrendAnalysis = (startDate, endDate) => request.get('/analysis/trend', { params: { start_date: startDate, end_date: endDate } });
