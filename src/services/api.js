// API Service for CodeGenius
const API_BASE = "http://localhost:4000/api";

// Helper function to get auth token
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

// Get current user from localStorage
export const getCurrentUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

// ========================
// USER APIs
// ========================

export const getUserStats = async (userId) => {
    const response = await fetch(`${API_BASE}/users/stats/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getUserActivity = async (userId, limit = 10) => {
    const response = await fetch(`${API_BASE}/users/activity/${userId}?limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getUserBadges = async (userId) => {
    const response = await fetch(`${API_BASE}/users/badges/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getUserSkills = async (userId) => {
    const response = await fetch(`${API_BASE}/users/skills/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const updateUserProfile = async (userId, profileData) => {
    const response = await fetch(`${API_BASE}/users/profile/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
    });
    return response.json();
};

// ========================
// LEADERBOARD APIs
// ========================

export const getLeaderboard = async (period = "all_time", limit = 50) => {
    const response = await fetch(`${API_BASE}/leaderboard?period=${period}&limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getUserRank = async (userId) => {
    const response = await fetch(`${API_BASE}/leaderboard/rank/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

// ========================
// ADMIN APIs
// ========================

export const getAdminStats = async () => {
    const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getAdminActivity = async (limit = 10) => {
    const response = await fetch(`${API_BASE}/admin/activity?limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getPopularProblems = async (limit = 5) => {
    const response = await fetch(`${API_BASE}/admin/popular-problems?limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

// ========================
// PROJECT APIs
// ========================

export const getProjects = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}/projects?${params}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getUserProjects = async (userId) => {
    const response = await fetch(`${API_BASE}/projects/user/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const createProject = async (projectData) => {
    const token = localStorage.getItem("token");
    const isFormData = projectData instanceof FormData;

    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers,
        body: isFormData ? projectData : JSON.stringify(projectData),
    });
    return response.json();
};

export const likeProject = async (projectId, userId) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
    });
    return response.json();
};

// ========================
// AUTH APIs
// ========================

export const login = async (email, password, role) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
    });
    return response.json();
};

export const register = async (fullName, email, password, role) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
    });
    return response.json();
};

export const logout = async (userId) => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
    });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return response.json();
};

export const getProfile = async (userId) => {
    const response = await fetch(`${API_BASE}/auth/profile/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};
