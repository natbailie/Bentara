import axios from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const getFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}/${path}`;
};

export const UserService = {
    register: (data: any) => api.post('/register', data),
    getProfile: (username: string) => api.get(`/users/${username}`),
    updateProfile: (username: string, data: any) => api.put(`/users/${username}`, data),
    getConsultants: () => api.get('/users/consultants'), // NEW
};

export const PatientService = {
    create: (data: any) => api.post('/patients/create', data),
    search: (query: string) => api.get(`/patients/search?query=${query}`),
    getOne: (id: number) => api.get(`/patients/${id}`),
    getReports: (id: number) => api.get(`/patient-reports/${id}`),
    signOff: (id: number, reviewerName: string) => api.put(`/reports/${id}/signoff`, { reviewer: reviewerName })
};

export const ResearchService = {
    upload: (formData: FormData) => api.post('/research/upload', formData),
    getAll: () => api.get('/research/images'),
    saveAnnotations: (id: number, annotations: string, status: string) =>
        api.put(`/research/annotate/${id}`, { annotations, status })
};

export const DashboardService = {
    getStats: () => api.get('/dashboard/stats'),
    getPendingReports: () => api.get('/reports/pending')
};

export default api;