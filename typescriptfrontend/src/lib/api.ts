// src/lib/api.ts
import axios from 'axios';

// Ensure this matches your Python backend URL
export const API_BASE_URL = ' http://127.0.0.1:4040';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;