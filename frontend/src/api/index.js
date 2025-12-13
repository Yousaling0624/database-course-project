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
export const getCustomers = () => request.get('/customers');
export const createCustomer = (data) => request.post('/customers', data);
export const updateCustomer = (id, data) => request.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => request.delete(`/customers/${id}`);

// Suppliers
export const getSuppliers = () => request.get('/suppliers');
export const createSupplier = (data) => request.post('/suppliers', data);
export const updateSupplier = (id, data) => request.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => request.delete(`/suppliers/${id}`);

// Inbound
export const getInbounds = () => request.get('/inbounds');
export const createInbound = (data) => request.post('/inbounds', data);

// Sales
export const getSales = () => request.get('/sales');
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

