// src/lib/api.ts
import axios from 'axios';

// --- CONFIGURATION ---
// REPLACE THIS with your actual ngrok URL (e.g., https://a1b2-c3d4.ngrok-free.app)
export const API_BASE_URL = 'https://your-unique-id.ngrok-free.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Essential for ngrok free tier
    },
});

// --- HELPER FUNCTIONS ---

// Helper to get full URL for images/PDFs
export const getFileUrl = (path: string) => {
    if (!path) return '';
    // If the path already has http, return it. Otherwise, prepend the base URL.
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path}`;
};

export const PatientService = {
    // Search for patients
    search: (query: string) => api.get(`/patients/search?query=${query}`),

    // Create a new patient
    create: (data: any) => api.post('/patients/create', data),

    // Get single patient details
    get: (id: number) => api.get(`/patients/${id}`),

    // Get reports for a patient
    getReports: (id: number) => api.get(`/reports/${id}`),

    // Upload a sample image
    uploadSample: (patientId: number, file: File) => {
        const formData = new FormData();
        formData.append('patient_id', patientId.toString());
        formData.append('file', file);

        return api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};

export default api;