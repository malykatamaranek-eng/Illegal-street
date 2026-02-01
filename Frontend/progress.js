/**
 * Progress Page JavaScript
 * Handles user progress display, charts, goals, and achievements
 */

(function() {
    'use strict';

    // State
    let progressData = null;
    let statisticsData = null;
    let currentPeriod = 'week';
    let activityChart = null;
    let isAuthenticated = false;

    // DOM Elements
    const loadingState = document.getElementById('loadingState');
    const progressContainer = document.getElementById('progressContainer');
    const notAuthenticatedState = document.getElementById('notAuthenticatedState');
    const activityChartCanvas = document.getElementById('activityChart');
    const modulesProgressList = document.getElementById('modulesProgressList');
    const goalsList = document.getElementById('goalsList');
    const emptyGoalsState = document.getElementById('emptyGoalsState');
    const achievementsList = document.getElementById('achievementsList');
    const goalModal = document.getElementById('goalModal');
    const goalModalClose = document.getElementById('goalModalClose');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');
    const goalForm = document.getElementById('goalForm');

    /**
     * Initialize the progress page
     */
    async function init() {
        // Check authentication
        checkAuth();

        if (!isAuthenticated) {
            showNotAuthenticated();
            return;
        }

        // Setup event listeners
        setupEventListeners();

        // Load all progress data
        await loadAllData();

        // Setup mobile menu
        setupMobileMenu();
    }

    /**
     * Check if user is authenticated
     */
    function checkAuth() {
        const user = API.getCurrentUser();
        isAuthenticated = !!user;

        // Update UI based on auth status
        const navUserSection = document.getElementById('navUserSection');
        const authButtons = document.getElementById('authButtons');
        const logoutSection = document.getElementById('logoutSection');

        if (isAuthenticated && user) {
            // Show user info
            if (navUserSection) {
                navUserSection.style.display = 'block';
                const navUsername = document.getElementById('navUsername');
                const navAvatar = document.getElementById('navAvatar');
                if (navUsername) navUsername.textContent = user.username || user.email || 'User';
                if (navAvatar) navAvatar.src = user.avatar || 'assets/default-avatar.png';
            }

            // Show logout button
            if (authButtons) authButtons.style.display = 'none';
            if (logoutSection) logoutSection.style.display = 'block';
        } else {
            // Show login button
            if (navUserSection) navUserSection.style.display = 'none';
            if (authButtons) authButtons.style.display = 'block';
            if (logoutSection) logoutSection.style.display = 'none';
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Chart period buttons
        const periodButtons = document.querySelectorAll('.chart-period-buttons button');
        periodButtons.forEach(btn => {
            btn.addEventListener('click', handlePeriodChange);
        });

        // Goal modal
        if (addGoalBtn) addGoalBtn.addEventListener('click', openGoalModal);
        if (goalModalClose) goalModalClose.addEventListener('click', closeGoalModal);
        if (cancelGoalBtn) cancelGoalBtn.addEventListener('click', closeGoalModal);
        if (goalModal) {
            goalModal.addEventListener('click', (e) => {
                if (e.target === goalModal) closeGoalModal();
            });
        }

        // Goal form
        if (goalForm) goalForm.addEventListener('submit', handleGoalSubmit);

        // Logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (goalModal && !goalModal.classList.contains('hidden')) {
                    closeGoalModal();
                }
            }
        });
    }

    /**
     * Load all progress data
     */
    async function loadAllData() {
        try {
            showLoading();

            // Load data in parallel
            const [progress, statistics] = await Promise.all([
                loadProgress(),
                loadStatistics()
            ]);

            progressData = progress;
            statisticsData = statistics;

            // Render all sections
            renderStatistics();
            await loadChartData(currentPeriod);
            renderModulesProgress();
            await loadGoals();
            renderAchievements();

            showProgress();
        } catch (error) {
            console.error('Error loading progress data:', error);
            showError('Nie udało się załadować postępów. Spróbuj odświeżyć stronę.');
        } finally {
            hideLoading();
        }
    }

    /**
     * Load user progress
     */
    async function loadProgress() {
        try {
            const response = await apiRequest('/api/progress', { method: 'GET' });
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Error loading progress:', error);
            return null;
        }
    }

    /**
     * Load progress statistics
     */
    async function loadStatistics() {
        try {
            const response = await apiRequest('/api/progress/statistics', { method: 'GET' });
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Error loading statistics:', error);
            return null;
        }
    }

    /**
     * Render statistics cards
     */
    function renderStatistics() {
        if (!statisticsData) return;

        // Update stat cards
        updateStatValue('totalModules', statisticsData.totalModules || 0);
        updateStatValue('completedModules', statisticsData.completedModules || 0);
        updateStatValue('inProgressModules', statisticsData.inProgressModules || 0);
        updateStatValue('totalPoints', statisticsData.totalPoints || 0);
        updateStatValue('userLevel', statisticsData.level || 1);
        updateStatValue('currentStreak', statisticsData.currentStreak || 0);
    }

    /**
     * Update stat card value
     */
    function updateStatValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Load chart data for specified period
     */
    async function loadChartData(period) {
        try {
            const response = await apiRequest(`/api/progress/chart/${period}`, { method: 'GET' });
            
            if (response.success && response.data) {
                renderChart(response.data, period);
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    }

    /**
     * Render activity chart
     */
    function renderChart(data, period) {
        if (!activityChartCanvas) return;

        const ctx = activityChartCanvas.getContext('2d');

        // Destroy existing chart
        if (activityChart) {
            activityChart.destroy();
        }

        // Prepare chart data
        const labels = data.labels || [];
        const values = data.values || [];

        // Create new chart
        activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Punkty zdobyte',
                    data: values,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ff6b6b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#ff6b6b',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#888',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#888',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Handle period change
     */
    async function handlePeriodChange(e) {
        const btn = e.currentTarget;
        const period = btn.getAttribute('data-period');

        // Update active button
        document.querySelectorAll('.chart-period-buttons button').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Update current period
        currentPeriod = period;

        // Load new chart data
        await loadChartData(period);
    }

    /**
     * Render modules progress
     */
    function renderModulesProgress() {
        if (!modulesProgressList) return;

        modulesProgressList.innerHTML = '';

        if (!progressData || !progressData.modules || progressData.modules.length === 0) {
            modulesProgressList.innerHTML = `
                <div class="text-center text-gray" style="padding: 2rem;">
                    Brak rozpoczętych modułów
                </div>
            `;
            return;
        }

        progressData.modules.forEach(module => {
            const progressItem = createModuleProgressItem(module);
            modulesProgressList.appendChild(progressItem);
        });
    }

    /**
     * Create module progress item
     */
    function createModuleProgressItem(module) {
        const div = document.createElement('div');
        div.className = 'module-progress-item';

        const percentComplete = module.percentComplete || 0;
        const status = getModuleStatus(module);

        div.innerHTML = `
            <div class="module-progress-header">
                <div class="module-progress-info">
                    <h4>${escapeHtml(module.title || 'Moduł')}</h4>
                    <span class="badge badge-${status.color}">${status.text}</span>
                </div>
                <div class="module-progress-percent">${percentComplete}%</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentComplete}%"></div>
            </div>
            <div class="module-progress-meta">
                <span>Ukończone: ${module.completedLessons || 0}/${module.totalLessons || 0}</span>
                ${module.lastAccessed ? `<span>Ostatnio: ${formatDate(module.lastAccessed)}</span>` : ''}
            </div>
        `;

        return div;
    }

    /**
     * Get module status
     */
    function getModuleStatus(module) {
        if (module.status === 'completed') {
            return { text: 'Ukończony', color: 'success' };
        } else if (module.status === 'in_progress') {
            return { text: 'W trakcie', color: 'warning' };
        } else {
            return { text: 'Rozpoczęty', color: 'primary' };
        }
    }

    /**
     * Load goals
     */
    async function loadGoals() {
        try {
            const response = await apiRequest('/api/progress/goals', { method: 'GET' });
            
            if (response.success && response.data) {
                renderGoals(response.data);
            } else {
                showEmptyGoals();
            }
        } catch (error) {
            console.error('Error loading goals:', error);
            showEmptyGoals();
        }
    }

    /**
     * Render goals
     */
    function renderGoals(goals) {
        if (!goalsList) return;

        if (!goals || goals.length === 0) {
            showEmptyGoals();
            return;
        }

        hideEmptyGoals();
        goalsList.innerHTML = '';

        goals.forEach(goal => {
            const goalItem = createGoalItem(goal);
            goalsList.appendChild(goalItem);
        });
    }

    /**
     * Create goal item
     */
    function createGoalItem(goal) {
        const div = document.createElement('div');
        div.className = 'goal-item';

        const progress = calculateGoalProgress(goal);
        const isCompleted = goal.status === 'completed' || progress >= 100;
        const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted;

        div.innerHTML = `
            <div class="goal-header">
                <div>
                    <h4>${escapeHtml(goal.title)}</h4>
                    ${goal.description ? `<p class="goal-description">${escapeHtml(goal.description)}</p>` : ''}
                </div>
                <div class="goal-actions">
                    ${!isCompleted ? `
                        <button class="btn btn-secondary btn-small" onclick="window.ProgressPage.completeGoal('${goal.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-small" onclick="window.ProgressPage.deleteGoal('${goal.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            ${goal.targetValue ? `
                <div class="goal-progress">
                    <div class="progress-label">
                        <span>Postęp</span>
                        <span>${goal.currentValue || 0}/${goal.targetValue}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            ` : ''}
            
            <div class="goal-meta">
                ${isCompleted ? `
                    <span class="badge badge-success">Ukończony</span>
                ` : isOverdue ? `
                    <span class="badge badge-error">Przekroczony termin</span>
                ` : `
                    <span class="badge badge-primary">Aktywny</span>
                `}
                ${goal.deadline ? `<span>Termin: ${formatDate(goal.deadline)}</span>` : ''}
            </div>
        `;

        return div;
    }

    /**
     * Calculate goal progress percentage
     */
    function calculateGoalProgress(goal) {
        if (!goal.targetValue) return 0;
        const current = goal.currentValue || 0;
        const target = goal.targetValue;
        return Math.min(Math.round((current / target) * 100), 100);
    }

    /**
     * Open goal modal
     */
    function openGoalModal() {
        if (goalModal) {
            goalModal.classList.remove('hidden');
            setTimeout(() => {
                goalModal.classList.add('active');
            }, 10);
            document.body.style.overflow = 'hidden';
        }

        // Reset form
        if (goalForm) {
            goalForm.reset();
        }
    }

    /**
     * Close goal modal
     */
    function closeGoalModal() {
        if (goalModal) {
            goalModal.classList.remove('active');
            setTimeout(() => {
                goalModal.classList.add('hidden');
            }, 300);
            document.body.style.overflow = '';
        }
    }

    /**
     * Handle goal form submission
     */
    async function handleGoalSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const goalData = {
            title: formData.get('title'),
            description: formData.get('description') || undefined,
            targetValue: formData.get('targetValue') ? parseInt(formData.get('targetValue')) : undefined,
            deadline: formData.get('deadline') || undefined
        };

        try {
            const response = await apiRequest('/api/progress/goals', {
                method: 'POST',
                body: JSON.stringify(goalData)
            });

            if (response.success) {
                showSuccess('Cel został dodany!');
                closeGoalModal();
                await loadGoals();
            }
        } catch (error) {
            console.error('Error creating goal:', error);
            showError('Nie udało się dodać celu. Spróbuj ponownie.');
        }
    }

    /**
     * Complete a goal
     */
    async function completeGoal(goalId) {
        try {
            const response = await apiRequest(`/api/progress/goals/${goalId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'completed' })
            });

            if (response.success) {
                showSuccess('Gratulacje! Cel osiągnięty!');
                await loadGoals();
            }
        } catch (error) {
            console.error('Error completing goal:', error);
            showError('Nie udało się zaktualizować celu.');
        }
    }

    /**
     * Delete a goal
     */
    async function deleteGoal(goalId) {
        if (!confirm('Czy na pewno chcesz usunąć ten cel?')) {
            return;
        }

        try {
            const response = await apiRequest(`/api/progress/goals/${goalId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                showSuccess('Cel został usunięty');
                await loadGoals();
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            showError('Nie udało się usunąć celu.');
        }
    }

    /**
     * Render achievements
     */
    function renderAchievements() {
        if (!achievementsList) return;

        // Sample achievements (these would come from the backend in a real app)
        const achievements = [
            { 
                id: 1, 
                title: 'Pierwsze kroki', 
                description: 'Ukończ pierwszy moduł',
                icon: '🎯',
                earned: statisticsData && statisticsData.completedModules > 0,
                earnedDate: statisticsData && statisticsData.completedModules > 0 ? new Date() : null
            },
            { 
                id: 2, 
                title: 'Regularność', 
                description: 'Ucz się przez 7 dni z rzędu',
                icon: '🔥',
                earned: statisticsData && statisticsData.currentStreak >= 7,
                earnedDate: statisticsData && statisticsData.currentStreak >= 7 ? new Date() : null
            },
            { 
                id: 3, 
                title: 'Mistrz punktów', 
                description: 'Zdobądź 1000 punktów',
                icon: '⭐',
                earned: statisticsData && statisticsData.totalPoints >= 1000,
                earnedDate: statisticsData && statisticsData.totalPoints >= 1000 ? new Date() : null
            },
            { 
                id: 4, 
                title: 'Ekspert', 
                description: 'Ukończ 10 modułów',
                icon: '🏆',
                earned: statisticsData && statisticsData.completedModules >= 10,
                earnedDate: statisticsData && statisticsData.completedModules >= 10 ? new Date() : null
            },
            { 
                id: 5, 
                title: 'Poziom 5', 
                description: 'Osiągnij 5 poziom',
                icon: '🎖️',
                earned: statisticsData && statisticsData.level >= 5,
                earnedDate: statisticsData && statisticsData.level >= 5 ? new Date() : null
            },
            { 
                id: 6, 
                title: 'Quiz Master', 
                description: 'Zdobądź 100% w quizie',
                icon: '🧠',
                earned: false,
                earnedDate: null
            }
        ];

        achievementsList.innerHTML = '';

        achievements.forEach(achievement => {
            const achievementCard = createAchievementCard(achievement);
            achievementsList.appendChild(achievementCard);
        });
    }

    /**
     * Create achievement card
     */
    function createAchievementCard(achievement) {
        const div = document.createElement('div');
        div.className = `achievement-card ${achievement.earned ? 'earned' : 'locked'}`;

        div.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <h4>${escapeHtml(achievement.title)}</h4>
                <p>${escapeHtml(achievement.description)}</p>
                ${achievement.earned && achievement.earnedDate ? `
                    <span class="achievement-date">Zdobyte: ${formatDate(achievement.earnedDate)}</span>
                ` : achievement.earned ? `
                    <span class="achievement-date">Zdobyte</span>
                ` : `
                    <span class="achievement-locked">🔒 Zablokowane</span>
                `}
            </div>
        `;

        return div;
    }

    /**
     * Show/hide states
     */
    function showLoading() {
        if (loadingState) loadingState.classList.remove('hidden');
        if (progressContainer) progressContainer.classList.add('hidden');
        if (notAuthenticatedState) notAuthenticatedState.classList.add('hidden');
    }

    function hideLoading() {
        if (loadingState) loadingState.classList.add('hidden');
    }

    function showProgress() {
        if (progressContainer) progressContainer.classList.remove('hidden');
    }

    function showNotAuthenticated() {
        hideLoading();
        if (notAuthenticatedState) notAuthenticatedState.classList.remove('hidden');
    }

    function showEmptyGoals() {
        if (goalsList) goalsList.classList.add('hidden');
        if (emptyGoalsState) emptyGoalsState.classList.remove('hidden');
    }

    function hideEmptyGoals() {
        if (goalsList) goalsList.classList.remove('hidden');
        if (emptyGoalsState) emptyGoalsState.classList.add('hidden');
    }

    /**
     * Handle logout
     */
    async function handleLogout() {
        try {
            if (window.API && window.API.auth && window.API.auth.logout) {
                await window.API.auth.logout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    /**
     * Setup mobile menu
     */
    function setupMobileMenu() {
        const navToggle = document.getElementById('navToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (navToggle && sidebar) {
            navToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
            });
        }
    }

    /**
     * Show success message
     */
    function showSuccess(message) {
        showToast(message, 'success');
    }

    /**
     * Show error message
     */
    function showError(message) {
        showToast(message, 'error');
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    /**
     * Format date
     */
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('pl-PL', options);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * API request helper (uses the apiRequest from api.js)
     */
    async function apiRequest(endpoint, options = {}) {
        const url = `${window.location.origin}${endpoint}`;
        
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const fetchOptions = { ...defaultOptions, ...options };

        const token = localStorage.getItem('authToken');
        if (token && !fetchOptions.headers['Authorization']) {
            fetchOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, fetchOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Export functions to window for onclick handlers
    window.ProgressPage = {
        completeGoal,
        deleteGoal
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
