/**
 * Centralized API Communication Module
 * Handles all API requests with automatic cookie and JWT support
 */

// API Configuration
const API_CONFIG = {
    baseURL: window.location.origin, // Same origin for CORS
    timeout: 10000, // 10 seconds
    credentials: 'include' // Always include cookies for HTTP-Only cookie support
};

/**
 * Main API request function
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    // Default options
    const defaultOptions = {
        credentials: API_CONFIG.credentials,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    // Merge options
    const fetchOptions = { ...defaultOptions, ...options };

    // Add Authorization header if token exists in localStorage (fallback)
    const token = localStorage.getItem('authToken');
    if (token && !fetchOptions.headers['Authorization']) {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse JSON response
        const data = await response.json();

        // Handle error responses
        if (!response.ok) {
            throw new APIError(
                data.message || 'Wystąpił błąd podczas komunikacji z serwerem',
                response.status,
                data
            );
        }

        return data;

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new APIError('Przekroczono limit czasu żądania', 408);
        }

        if (error instanceof APIError) {
            throw error;
        }

        // Network or other errors
        console.error('API Request Error:', error);
        throw new APIError(
            'Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.',
            0
        );
    }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, statusCode, data = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.data = data;
    }
}

/**
 * API Methods
 */
const API = {
    /**
     * Authentication APIs
     */
    auth: {
        /**
         * Login user
         * @param {string} username - Username or email
         * @param {string} password - Password
         * @param {boolean} remember - Remember me option
         * @returns {Promise<object>} User data
         */
        login: async (username, password, remember = false) => {
            const data = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password, remember })
            });

            // Store token in localStorage as backup (optional)
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }

            // Store user data
            if (data.data && data.data.user) {
                localStorage.setItem('user', JSON.stringify(data.data.user));
            }

            return data;
        },

        /**
         * Logout user
         * @returns {Promise<object>} Response
         */
        logout: async () => {
            const data = await apiRequest('/api/auth/logout', {
                method: 'POST'
            });

            // Clear stored data
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            return data;
        },

        /**
         * Register new user
         * @param {object} userData - User registration data
         * @returns {Promise<object>} Response
         */
        register: async (userData) => {
            return await apiRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        /**
         * Verify current session
         * @returns {Promise<object>} User data if authenticated
         */
        verify: async () => {
            try {
                const data = await apiRequest('/api/auth/verify', {
                    method: 'GET'
                });

                // Update stored user data
                if (data.data && data.data.user) {
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                }

                return data;
            } catch (error) {
                // Clear stored data on verification failure
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                throw error;
            }
        },

        /**
         * Get current user
         * @returns {Promise<object>} User data
         */
        getMe: async () => {
            return await apiRequest('/api/auth/me', {
                method: 'GET'
            });
        },

        /**
         * Refresh token
         * @returns {Promise<object>} Response
         */
        refreshToken: async () => {
            return await apiRequest('/api/auth/refresh-token', {
                method: 'POST'
            });
        },

        /**
         * Request password reset
         * @param {string} email - User email
         * @returns {Promise<object>} Response
         */
        forgotPassword: async (email) => {
            return await apiRequest('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        },

        /**
         * Reset password with token
         * @param {string} token - Reset token
         * @param {string} password - New password
         * @returns {Promise<object>} Response
         */
        resetPassword: async (token, password) => {
            return await apiRequest(`/api/auth/reset-password/${token}`, {
                method: 'POST',
                body: JSON.stringify({ password })
            });
        }
    },

    /**
     * Helper function to get current user from localStorage
     * @returns {object|null} User object or null
     */
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
                return null;
            }
        }
        return null;
    },

    /**
     * Helper function to check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('user');
    },

    /**
     * Modules APIs
     */
    modules: {
        /**
         * Get all modules
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Modules list
         */
        getAll: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/modules?${queryParams}`, {
                method: 'GET'
            });
        },

        /**
         * Get module by ID
         * @param {string} id - Module ID
         * @returns {Promise<object>} Module data
         */
        getById: async (id) => {
            return await apiRequest(`/api/modules/${id}`, {
                method: 'GET'
            });
        },

        /**
         * Start module
         * @param {string} id - Module ID
         * @returns {Promise<object>} Progress data
         */
        start: async (id) => {
            return await apiRequest(`/api/modules/${id}/start`, {
                method: 'POST'
            });
        },

        /**
         * Get module content
         * @param {string} id - Module ID
         * @returns {Promise<object>} Module content
         */
        getContent: async (id) => {
            return await apiRequest(`/api/modules/${id}/content`, {
                method: 'GET'
            });
        },

        /**
         * Complete module
         * @param {string} id - Module ID
         * @returns {Promise<object>} Response
         */
        complete: async (id) => {
            return await apiRequest(`/api/modules/${id}/complete`, {
                method: 'POST'
            });
        }
    },

    /**
     * Quiz APIs
     */
    quiz: {
        /**
         * Get all quizzes
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Quizzes list
         */
        getAll: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/modules/quizzes?${queryParams}`, {
                method: 'GET'
            });
        },

        /**
         * Get quiz by ID
         * @param {string} id - Quiz ID
         * @returns {Promise<object>} Quiz data
         */
        getById: async (id) => {
            return await apiRequest(`/api/modules/quizzes/${id}`, {
                method: 'GET'
            });
        },

        /**
         * Start quiz
         * @param {string} id - Quiz ID
         * @returns {Promise<object>} Attempt data
         */
        start: async (id) => {
            return await apiRequest(`/api/modules/quizzes/${id}/start`, {
                method: 'POST'
            });
        },

        /**
         * Submit quiz
         * @param {string} id - Quiz ID
         * @param {string} attemptId - Attempt ID
         * @param {object} answers - Quiz answers
         * @returns {Promise<object>} Results data
         */
        submit: async (id, attemptId, answers) => {
            return await apiRequest(`/api/modules/quizzes/${id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ attemptId, answers })
            });
        },

        /**
         * Get quiz results
         * @param {string} id - Quiz ID
         * @returns {Promise<object>} Results data
         */
        getResults: async (id) => {
            return await apiRequest(`/api/modules/quizzes/${id}/results`, {
                method: 'GET'
            });
        }
    },

    /**
     * Progress APIs
     */
    progress: {
        /**
         * Get user progress
         * @returns {Promise<object>} Progress data
         */
        get: async () => {
            return await apiRequest('/api/progress', {
                method: 'GET'
            });
        },

        /**
         * Get progress statistics
         * @returns {Promise<object>} Statistics data
         */
        getStatistics: async () => {
            return await apiRequest('/api/progress/statistics', {
                method: 'GET'
            });
        },

        /**
         * Get progress chart data
         * @param {string} period - Time period (week, month, year)
         * @returns {Promise<object>} Chart data
         */
        getChartData: async (period = 'week') => {
            return await apiRequest(`/api/progress/chart/${period}`, {
                method: 'GET'
            });
        },

        /**
         * Get goals
         * @returns {Promise<object>} Goals list
         */
        getGoals: async () => {
            return await apiRequest('/api/progress/goals', {
                method: 'GET'
            });
        },

        /**
         * Create goal
         * @param {object} goalData - Goal data
         * @returns {Promise<object>} Created goal
         */
        createGoal: async (goalData) => {
            return await apiRequest('/api/progress/goals', {
                method: 'POST',
                body: JSON.stringify(goalData)
            });
        },

        /**
         * Update goal
         * @param {string} id - Goal ID
         * @param {object} goalData - Updated goal data
         * @returns {Promise<object>} Updated goal
         */
        updateGoal: async (id, goalData) => {
            return await apiRequest(`/api/progress/goals/${id}`, {
                method: 'PUT',
                body: JSON.stringify(goalData)
            });
        },

        /**
         * Delete goal
         * @param {string} id - Goal ID
         * @returns {Promise<object>} Response
         */
        deleteGoal: async (id) => {
            return await apiRequest(`/api/progress/goals/${id}`, {
                method: 'DELETE'
            });
        }
    },

    /**
     * Ranking APIs
     */
    ranking: {
        /**
         * Get global ranking
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Ranking data
         */
        getGlobal: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/ranking/global?${queryParams}`, {
                method: 'GET'
            });
        },

        /**
         * Get monthly ranking
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Ranking data
         */
        getMonthly: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/ranking/monthly?${queryParams}`, {
                method: 'GET'
            });
        },

        /**
         * Get user rank
         * @returns {Promise<object>} User rank data
         */
        getUserRank: async () => {
            return await apiRequest('/api/ranking/user', {
                method: 'GET'
            });
        }
    },

    /**
     * Achievements APIs
     */
    achievements: {
        /**
         * Get all achievements
         * @returns {Promise<object>} Achievements list
         */
        getAll: async () => {
            return await apiRequest('/api/achievements', {
                method: 'GET'
            });
        },

        /**
         * Get achievement by ID
         * @param {string} id - Achievement ID
         * @returns {Promise<object>} Achievement data
         */
        getById: async (id) => {
            return await apiRequest(`/api/achievements/${id}`, {
                method: 'GET'
            });
        }
    },

    /**
     * Users APIs
     */
    users: {
        /**
         * Get user profile
         * @returns {Promise<object>} Profile data
         */
        getProfile: async () => {
            return await apiRequest('/api/users/profile', {
                method: 'GET'
            });
        },

        /**
         * Update user profile
         * @param {object} profileData - Profile data
         * @returns {Promise<object>} Updated profile
         */
        updateProfile: async (profileData) => {
            return await apiRequest('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        },

        /**
         * Change password
         * @param {object} passwordData - Password data
         * @returns {Promise<object>} Response
         */
        changePassword: async (passwordData) => {
            return await apiRequest('/api/users/password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });
        },

        /**
         * Get active sessions
         * @returns {Promise<object>} Sessions list
         */
        getSessions: async () => {
            return await apiRequest('/api/users/sessions', {
                method: 'GET'
            });
        },

        /**
         * Delete session
         * @param {string} sessionId - Session ID
         * @returns {Promise<object>} Response
         */
        deleteSession: async (sessionId) => {
            return await apiRequest(`/api/users/sessions/${sessionId}`, {
                method: 'DELETE'
            });
        }
    },

    /**
     * Chat APIs
     */
    chat: {
        /**
         * Get messages
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Messages list
         */
        getMessages: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/chat/messages?${queryParams}`, {
                method: 'GET'
            });
        },

        /**
         * Send message
         * @param {object} messageData - Message data
         * @returns {Promise<object>} Created message
         */
        sendMessage: async (messageData) => {
            return await apiRequest('/api/chat/messages', {
                method: 'POST',
                body: JSON.stringify(messageData)
            });
        },

        /**
         * Delete message
         * @param {string} messageId - Message ID
         * @returns {Promise<object>} Response
         */
        deleteMessage: async (messageId) => {
            return await apiRequest(`/api/chat/messages/${messageId}`, {
                method: 'DELETE'
            });
        }
    },

    /**
     * Shop APIs
     */
    shop: {
        /**
         * Get products
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Products list
         */
        getProducts: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/shop/products?${queryParams}`, {
                method: 'GET'
            });
        },

        /**
         * Add to cart
         * @param {object} cartData - Cart data
         * @returns {Promise<object>} Response
         */
        addToCart: async (cartData) => {
            return await apiRequest('/api/shop/cart/add', {
                method: 'POST',
                body: JSON.stringify(cartData)
            });
        },

        /**
         * Checkout
         * @param {object} orderData - Order data
         * @returns {Promise<object>} Created order
         */
        checkout: async (orderData) => {
            return await apiRequest('/api/shop/checkout', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
        },

        /**
         * Get orders
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Orders list
         */
        getOrders: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/shop/orders?${queryParams}`, {
                method: 'GET'
            });
        }
    },

    /**
     * Admin APIs
     */
    admin: {
        /**
         * Get analytics
         * @returns {Promise<object>} Analytics data
         */
        getAnalytics: async () => {
            return await apiRequest('/api/admin/analytics', {
                method: 'GET'
            });
        },

        /**
         * Get all users
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Users list
         */
        getUsers: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/admin/users?${queryParams}`, {
                method: 'GET'
            });
        },

        /**
         * Get user by ID
         * @param {string} userId - User ID
         * @returns {Promise<object>} User data
         */
        getUser: async (userId) => {
            return await apiRequest(`/api/admin/users/${userId}`, {
                method: 'GET'
            });
        },

        /**
         * Create user
         * @param {object} userData - User data
         * @returns {Promise<object>} Created user
         */
        createUser: async (userData) => {
            return await apiRequest('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        /**
         * Update user
         * @param {string} userId - User ID
         * @param {object} userData - User data
         * @returns {Promise<object>} Updated user
         */
        updateUser: async (userId, userData) => {
            return await apiRequest(`/api/admin/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        },

        /**
         * Delete user
         * @param {string} userId - User ID
         * @returns {Promise<object>} Response
         */
        deleteUser: async (userId) => {
            return await apiRequest(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
        },

        /**
         * Delete module
         * @param {string} moduleId - Module ID
         * @returns {Promise<object>} Response
         */
        deleteModule: async (moduleId) => {
            return await apiRequest(`/api/admin/modules/${moduleId}`, {
                method: 'DELETE'
            });
        },

        /**
         * Get orders
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Orders list
         */
        getOrders: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/admin/orders?${queryParams}`, {
                method: 'GET'
            });
        },

        /**
         * Update order status
         * @param {string} orderId - Order ID
         * @param {object} statusData - Status data
         * @returns {Promise<object>} Updated order
         */
        updateOrderStatus: async (orderId, statusData) => {
            return await apiRequest(`/api/admin/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify(statusData)
            });
        },

        /**
         * Get audit logs
         * @param {object} params - Query parameters
         * @returns {Promise<object>} Audit logs list
         */
        getAuditLogs: async (params = {}) => {
            const queryParams = new URLSearchParams(params);
            return await apiRequest(`/api/admin/audit-logs?${queryParams}`, {
                method: 'GET'
            });
        }
    }
};

// Export API for use in other scripts
window.API = API;
window.APIError = APIError;
