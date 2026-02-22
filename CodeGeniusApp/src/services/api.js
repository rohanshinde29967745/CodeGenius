import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
// For local development, use your computer's IP address (not localhost)
// Get your IP by running: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_BASE_URL = 'http://192.168.1.106:4000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            SecureStore.deleteItemAsync('token');
            SecureStore.deleteItemAsync('user');
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    register: (userData) =>
        api.post('/auth/register', userData),

    getProfile: () =>
        api.get('/users/me'),
};

// Leaderboard API
export const leaderboardAPI = {
    getLeaderboard: (period = 'all') =>
        api.get(`/leaderboard?period=${period}`),
};

// Problems API
export const problemsAPI = {
    getProblems: (category = '', difficulty = '') =>
        api.get(`/problem-generate?category=${category}&difficulty=${difficulty}`),

    getProblem: (id) =>
        api.get(`/problem-generate/${id}`),

    checkSolution: (problemId, code, language) =>
        api.post('/problem-check', { problemId, code, language }),
};

// Code Analysis API
export const analyzeAPI = {
    analyzeCode: (code, language) =>
        api.post('/analyze', { code, language }),

    convertCode: (code, fromLanguage, toLanguage) =>
        api.post('/convert', { code, fromLanguage, toLanguage }),
};

// Admin API
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getActivity: (limit = 5) => api.get(`/admin/activity?limit=${limit}`),
    getPopularProblems: (limit = 3) => api.get(`/admin/popular-problems?limit=${limit}`),
    exportData: () => api.get('/admin/export'),
};

export default api;
