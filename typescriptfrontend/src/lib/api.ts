import axios from 'axios';
import { getBaseUrl } from './config';

const api = axios.create();

// Cloud-First Interceptor: Injects the dynamic URL and Token at runtime
api.interceptors.request.use((config) => {
    const url = getBaseUrl();
    config.baseURL = url;

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => Promise.reject(error));

/**
 * Service Layer: Fully preserved with dynamic routing
 */
export const UserService = {
    getProfile: () => api.get('/users/me'),
    register: (data: any) => api.post('/register', data),
    updateProfile: (data: any) => api.put('/users/update', data),
    getConsultants: () => api.get('/users/consultants'),
    changePassword: (data: any) => api.post('/users/change-password', data)
};

export const PatientService = {
    register: (data: any) => api.post('/patients/register', data),
    getAll: () => api.get('/patients'),
    getOne: (id: number) => api.get(`/patients/${id}`),
};

export const DashboardService = {
    getStats: () => api.get('/dashboard/stats'),
    getPendingReports: () => api.get('/reports/pending'),
};

export const ReportService = {
    getOne: (id: number) => api.get(`/reports/${id}`),
    uploadSlide: (formData: FormData) => api.post('/upload', formData)
};

export default api;