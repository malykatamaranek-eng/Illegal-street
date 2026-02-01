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
    }
};

// Export API for use in other scripts
window.API = API;
window.APIError = APIError;
