import axios from 'axios';

/**
 * HARD-LOCKED API URL
 * We are bypassing process.env to ensure the browser cannot
 * fall back to localhost.
 */
export const API_BASE_URL = 'https://natbailie-bentara-backend.hf.space';

// This will confirm the lock in your browser console (F12)
if (typeof window !== 'undefined') {
    console.log("CRITICAL: Bentara API Instance is hard-locked to:", API_BASE_URL);
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Auth Interceptor: Automatically attaches Bearer token from localStorage
 */
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

/**
 * Helper to build full URLs for images/static files
 */
export const getFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};

export const UserService = {
    register: (data: any) => api.post('/register', data),
    // Point to /users/me which is the standard profile check
    getProfile: () => api.get('/users/me'),
    updateProfile: (data: any) => api.put('/users/update', data),
    getConsultants: () => api.get('/users/consultants'),
    changePassword: (data: any) => api.post('/users/change-password', data)
};

export const PatientService = {
    register: (data: any) => api.post('/patients/register', data),
    getAll: () => api.get('/patients'),
    getOne: (id: number) => api.get(`/patients/${id}`),
};

export const ResearchService = {
    upload: (formData: FormData) => api.post('/research/upload', formData),
    getGallery: (type?: string) => {
        const url = type ? `/research/gallery?sample_type=${encodeURIComponent(type)}` : '/research/gallery';
        return api.get(url);
    }
};

export const DashboardService = {
    getStats: () => api.get('/dashboard/stats'),
    getPendingReports: () => api.get('/reports/pending'),
    signOff: (id: number) => api.post(`/reports/${id}/signoff`)
};

export const ReportService = {
    getOne: (id: number) => api.get(`/reports/${id}`),
    uploadSlide: (formData: FormData) => api.post('/upload', formData)
};

export default api;