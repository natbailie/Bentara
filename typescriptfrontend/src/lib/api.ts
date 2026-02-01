import axios from 'axios';

// 1. Dynamic API URL: Prefers the Vercel env var, falls back to local for your Mac
// IMPORTANT: Use the HTTPS URL from Hugging Face in your Vercel settings!
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// DEBUG LOG: Look for this in your browser console (Inspect > Console)
if (typeof window !== 'undefined') {
    console.log("Bentara API Initialized. Target URL ->", API_BASE_URL);
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 2. Auth Interceptor: Automatically attaches Bearer token if it exists
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => Promise.reject(error));

// Helper for image/file URLs
export const getFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};

export const UserService = {
    // Axios post automatically handles JSON.stringify
    register: (data: any) => api.post('/register', data),
    getProfile: (username: string) => api.get(`/users/${username}`),
    getConsultants: () => api.get('/users/consultants'),
};

// ... add other services as needed

export default api;