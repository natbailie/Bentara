import axios from 'axios';

/**
 * 1. Strict API URL Logic
 * Fallback to localhost has been removed to prevent connection errors in production.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

if (typeof window !== 'undefined') {
    if (!API_BASE_URL) {
        console.error("FATAL CONFIG ERROR: NEXT_PUBLIC_API_URL is undefined. The app cannot connect to the backend.");
    } else {
        console.log("Bentara API Instance strictly locked to:", API_BASE_URL);
    }
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 2. Auth Interceptor: Automatically attaches Bearer token from localStorage
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

export const getFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};

export const UserService = {
    register: (data: any) => api.post('/register', data),
    // Updated to use the profile endpoint required for dashboard access
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