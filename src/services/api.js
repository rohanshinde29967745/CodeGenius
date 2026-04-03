// API Service for CodeGenius
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
export const API_SERVER = process.env.REACT_APP_SERVER_URL || "http://localhost:4000";

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

export const getLeaderboard = async (period = "all_time", limit = 50, scope = "global") => {
    const response = await fetch(`${API_BASE}/leaderboard?period=${period}&limit=${limit}&scope=${scope}`, {
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

export const changePassword = async (userId, currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE}/auth/change-password/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response.json();
};

export const deleteAccount = async (userId, password) => {
    const response = await fetch(`${API_BASE}/auth/account/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password }),
    });
    return response.json();
};

export const saveUserSettings = async (userId, settings) => {
    const response = await fetch(`${API_BASE}/auth/settings/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ settings }),
    });
    return response.json();
};

export const getUserSettings = async (userId) => {
    const response = await fetch(`${API_BASE}/auth/settings/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

// ========================
// COLLABORATION APIs
// ========================

export const sendCollaborationRequest = async (data) => {
    const response = await fetch(`${API_BASE}/collaborations`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    return response.json();
};

export const getReceivedCollaborations = async (userId) => {
    const response = await fetch(`${API_BASE}/collaborations/received/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getSentCollaborations = async (userId) => {
    const response = await fetch(`${API_BASE}/collaborations/sent/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const acceptCollaboration = async (requestId, userId) => {
    const response = await fetch(`${API_BASE}/collaborations/${requestId}/accept`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
    });
    return response.json();
};

export const ignoreCollaboration = async (requestId, userId) => {
    const response = await fetch(`${API_BASE}/collaborations/${requestId}/ignore`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
    });
    return response.json();
};

// ========================
// CONNECTIONS APIs
// ========================

export const getAllUsers = async (search = "") => {
    try {
        const response = await fetch(`${API_BASE}/connections/users?search=${encodeURIComponent(search)}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            console.error("getAllUsers API error:", response.status);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("getAllUsers fetch error:", error);
        return [];
    }
};

export const sendConnectionRequest = async (receiverId) => {
    const response = await fetch(`${API_BASE}/connections/request`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ receiverId }),
    });
    return response.json();
};

export const acceptConnectionRequest = async (connectionId) => {
    const response = await fetch(`${API_BASE}/connections/accept`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ connectionId }),
    });
    return response.json();
};

export const getPendingConnections = async () => {
    try {
        const response = await fetch(`${API_BASE}/connections/requests`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("getPendingConnections error:", error);
        return [];
    }
};

export const getFriends = async () => {
    try {
        const response = await fetch(`${API_BASE}/connections/friends`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("getFriends error:", error);
        return [];
    }
};

export const getUserProfile = async (userId) => {
    try {
        const response = await fetch(`${API_BASE}/connections/profile/${userId}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            return { error: "Failed to fetch profile" };
        }
        return await response.json();
    } catch (error) {
        console.error("getUserProfile error:", error);
        return { error: "Failed to fetch profile" };
    }
};

// ========================
// SAVED ITEMS APIs
// ========================

export const saveProblem = async (userId, problemData) => {
    const response = await fetch(`${API_BASE}/saved/problems`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, ...problemData }),
    });
    return response.json();
};

export const unsaveProblem = async (userId, problemId) => {
    const response = await fetch(`${API_BASE}/saved/problems/${userId}/${problemId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getSavedProblems = async (userId) => {
    const response = await fetch(`${API_BASE}/saved/problems/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const checkProblemSaved = async (userId, problemId) => {
    const response = await fetch(`${API_BASE}/saved/problems/check/${userId}/${problemId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const saveProject = async (userId, projectId) => {
    const response = await fetch(`${API_BASE}/saved/projects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, projectId }),
    });
    return response.json();
};

export const unsaveProject = async (userId, projectId) => {
    const response = await fetch(`${API_BASE}/saved/projects/${userId}/${projectId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getSavedProjects = async (userId) => {
    const response = await fetch(`${API_BASE}/saved/projects/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const checkProjectSaved = async (userId, projectId) => {
    const response = await fetch(`${API_BASE}/saved/projects/check/${userId}/${projectId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

// ========================
// NOTIFICATIONS APIs
// ========================

export const getNotifications = async (userId, limit = 50) => {
    const response = await fetch(`${API_BASE}/notifications/${userId}?limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getUnreadNotificationCount = async (userId) => {
    const response = await fetch(`${API_BASE}/notifications/${userId}/unread-count`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const markNotificationAsRead = async (notificationId) => {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const markAllNotificationsAsRead = async (userId) => {
    const response = await fetch(`${API_BASE}/notifications/${userId}/read-all`, {
        method: "PUT",
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const deleteNotification = async (notificationId) => {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return response.json();
};

// ========================
// INSIGHTS APIs
// ========================

export const getInsightsSummary = async (userId) => {
    const response = await fetch(`${API_BASE}/insights/summary/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getInsightsHeatmap = async (userId) => {
    const response = await fetch(`${API_BASE}/insights/heatmap/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getInsightsProgress = async (userId, range = "30d") => {
    const response = await fetch(`${API_BASE}/insights/progress/${userId}?range=${range}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getInsightsSkills = async (userId) => {
    const response = await fetch(`${API_BASE}/insights/skills/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getInsightsTimeAnalytics = async (userId) => {
    const response = await fetch(`${API_BASE}/insights/time-analytics/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getInsightsAIReport = async (userId) => {
    const response = await fetch(`${API_BASE}/insights/ai-report/${userId}`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};

// ========================
// CONTEST APIs
// ========================

export const getContestBadges = async (userId) => {
    const response = await fetch(`${API_BASE}/contests/user/${userId}/badges`, {
        headers: getAuthHeaders(),
    });
    return response.json();
};
