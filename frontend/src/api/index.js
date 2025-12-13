import request from './request';

export const login = (data) => request.post('/login', data);
export const getMedicines = (search) => request.get('/medicines', { params: { search } });
export const createMedicine = (data) => request.post('/medicines', data);
export const getStats = () => request.get('/dashboard/stats');
export const createSale = (data) => request.post('/sales', data);
