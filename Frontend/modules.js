/**
 * Modules Page JavaScript
 * Handles module listing, filtering, search, and quiz functionality
 */

(function() {
    'use strict';

    // State
    let allModules = [];
    let filteredModules = [];
    let currentCategory = 'all';
    let currentModuleId = null;
    let currentQuizAttemptId = null;
    let isAuthenticated = false;

    // DOM Elements
    const modulesGrid = document.getElementById('modulesGrid');
    const loadingSkeleton = document.getElementById('loadingSkeleton');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const moduleModal = document.getElementById('moduleModal');
    const modalClose = document.getElementById('modalClose');
    const moduleDetailContent = document.getElementById('moduleDetailContent');
    const quizModal = document.getElementById('quizModal');
    const quizModalClose = document.getElementById('quizModalClose');
    const quizContent = document.getElementById('quizContent');

    /**
     * Initialize the modules page
     */
    async function init() {
        // Check authentication
        checkAuth();

        // Setup event listeners
        setupEventListeners();

        // Load modules
        await loadModules();

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
        // Search input
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }

        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', handleFilterClick);
        });

        // Modal close handlers
        if (modalClose) modalClose.addEventListener('click', closeModuleModal);
        if (moduleModal) moduleModal.addEventListener('click', (e) => {
            if (e.target === moduleModal) closeModuleModal();
        });
        if (quizModalClose) quizModalClose.addEventListener('click', closeQuizModal);
        if (quizModal) quizModal.addEventListener('click', (e) => {
            if (e.target === quizModal) closeQuizModal();
        });

        // Logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (moduleModal && moduleModal.style.display !== 'none') {
                    closeModuleModal();
                }
                if (quizModal && quizModal.style.display !== 'none') {
                    closeQuizModal();
                }
            }
        });
    }

    /**
     * Load modules from API
     */
    async function loadModules() {
        try {
            showLoading();

            const response = await API.modules.getAll({ limit: 50 });
            
            if (response.success && response.data && response.data.modules) {
                allModules = response.data.modules;
                filteredModules = allModules;
                renderModules();
            } else {
                showEmptyState();
            }
        } catch (error) {
            console.error('Error loading modules:', error);
            showError('Nie udało się załadować modułów. Spróbuj odświeżyć stronę.');
        } finally {
            hideLoading();
        }
    }

    /**
     * Render modules in the grid
     */
    function renderModules() {
        if (!modulesGrid) return;

        modulesGrid.innerHTML = '';

        if (filteredModules.length === 0) {
            showEmptyState();
            return;
        }

        hideEmptyState();
        modulesGrid.style.display = 'grid';

        filteredModules.forEach(module => {
            const moduleCard = createModuleCard(module);
            modulesGrid.appendChild(moduleCard);
        });
    }

    /**
     * Create a module card element
     */
    function createModuleCard(module) {
        const card = document.createElement('div');
        card.className = 'card module-card';
        card.setAttribute('data-module-id', module.id);

        // Get difficulty badge color
        const difficultyColor = getDifficultyColor(module.level);
        const difficultyText = getDifficultyText(module.level);

        // Get category icon
        const categoryIcon = getCategoryIcon(module.category);

        card.innerHTML = `
            <div class="module-card-icon">
                ${categoryIcon}
            </div>
            
            <h3 class="module-card-title">${escapeHtml(module.title)}</h3>
            
            <p class="module-card-description">${escapeHtml(module.description || 'Brak opisu')}</p>
            
            <div class="module-card-meta">
                <span class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    ${module.points || 0} pkt
                </span>
                <span class="badge badge-${difficultyColor}">${difficultyText}</span>
            </div>

            ${module.progress ? `
                <div class="module-card-progress">
                    <div class="progress-label">
                        <span>Postęp</span>
                        <span>${module.progress.percentComplete || 0}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${module.progress.percentComplete || 0}%"></div>
                    </div>
                </div>
            ` : ''}

            <button class="btn btn-primary btn-full" onclick="window.ModulesPage.openModuleDetail('${module.id}')">
                ${module.progress ? 'Kontynuuj' : 'Zobacz szczegóły'}
            </button>
        `;

        return card;
    }

    /**
     * Open module detail modal
     */
    async function openModuleDetail(moduleId) {
        try {
            currentModuleId = moduleId;
            
            // Show modal
            if (moduleModal) {
                moduleModal.style.display = 'flex';
                moduleModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            // Show loading
            if (moduleDetailContent) {
                moduleDetailContent.innerHTML = '<div class="text-center" style="padding: 2rem;"><div class="skeleton skeleton-text"></div></div>';
            }

            // Fetch module details
            const response = await API.modules.getById(moduleId);
            
            if (response.success && response.data) {
                renderModuleDetail(response.data);
            }
        } catch (error) {
            console.error('Error loading module details:', error);
            if (moduleDetailContent) {
                moduleDetailContent.innerHTML = '<div class="text-center text-error" style="padding: 2rem;">Nie udało się załadować szczegółów modułu.</div>';
            }
        }
    }

    /**
     * Render module detail in modal
     */
    function renderModuleDetail(module) {
        if (!moduleDetailContent) return;

        const difficultyText = getDifficultyText(module.level);
        const difficultyColor = getDifficultyColor(module.level);

        let content = `
            <div class="module-detail">
                <h2 class="module-detail-title">${escapeHtml(module.title)}</h2>
                
                <div class="module-detail-meta">
                    <span class="badge badge-${difficultyColor}">${difficultyText}</span>
                    <span class="meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        ${module.points || 0} punktów
                    </span>
                </div>

                <p class="module-detail-description">${escapeHtml(module.description || 'Brak opisu')}</p>

                ${isAuthenticated ? `
                    <button class="btn btn-primary" onclick="window.ModulesPage.startModule('${module.id}')">
                        ${module.progress ? 'Kontynuuj moduł' : 'Rozpocznij moduł'}
                    </button>
                ` : `
                    <a href="login.html" class="btn btn-primary">Zaloguj się, aby rozpocząć</a>
                `}

                <div class="module-detail-section">
                    <h3>Zawartość modułu</h3>
                    <div id="moduleCourses" class="module-courses-list">
                        <div class="text-center text-gray" style="padding: 1rem;">Ładowanie...</div>
                    </div>
                </div>

                ${module.quizzes && module.quizzes.length > 0 ? `
                    <div class="module-detail-section">
                        <h3>Quizy</h3>
                        <div class="module-quizzes-list">
                            ${module.quizzes.map(quiz => `
                                <div class="quiz-item">
                                    <div>
                                        <h4>${escapeHtml(quiz.title)}</h4>
                                        <p style="color: #888; font-size: 0.9rem;">${quiz.questions ? quiz.questions.length : 0} pytań</p>
                                    </div>
                                    ${isAuthenticated ? `
                                        <button class="btn btn-secondary btn-small" onclick="window.ModulesPage.openQuiz('${quiz.id}')">
                                            Rozpocznij quiz
                                        </button>
                                    ` : `
                                        <a href="login.html" class="btn btn-secondary btn-small">Zaloguj się</a>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        moduleDetailContent.innerHTML = content;

        // Load courses if authenticated
        if (isAuthenticated) {
            loadModuleCourses(module.id);
        }
    }

    /**
     * Load courses for a module
     */
    async function loadModuleCourses(moduleId) {
        const coursesContainer = document.getElementById('moduleCourses');
        if (!coursesContainer) return;

        try {
            const response = await API.modules.getContent(moduleId);
            
            if (response.success && response.data && response.data.length > 0) {
                coursesContainer.innerHTML = response.data.map((course, index) => `
                    <div class="course-item">
                        <div class="course-number">${index + 1}</div>
                        <div class="course-info">
                            <h4>${escapeHtml(course.title)}</h4>
                            ${course.description ? `<p>${escapeHtml(course.description)}</p>` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                coursesContainer.innerHTML = '<div class="text-center text-gray" style="padding: 1rem;">Brak dostępnych kursów</div>';
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            coursesContainer.innerHTML = '<div class="text-center text-error" style="padding: 1rem;">Nie udało się załadować kursów</div>';
        }
    }

    /**
     * Start a module
     */
    async function startModule(moduleId) {
        if (!isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await API.modules.start(moduleId);
            
            if (response.success) {
                showSuccess('Moduł został rozpoczęty! Rozpocznij naukę.');
                
                // Reload modules to update progress
                await loadModules();
                
                // Close modal
                closeModuleModal();
            }
        } catch (error) {
            console.error('Error starting module:', error);
            showError('Nie udało się rozpocząć modułu. Spróbuj ponownie.');
        }
    }

    /**
     * Open quiz modal
     */
    async function openQuiz(quizId) {
        if (!isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // Show modal
            if (quizModal) {
                quizModal.style.display = 'flex';
                quizModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            // Show loading
            if (quizContent) {
                quizContent.innerHTML = '<div class="text-center" style="padding: 2rem;"><div class="skeleton skeleton-text"></div></div>';
            }

            // Start quiz and get quiz data
            const [quizResponse, attemptResponse] = await Promise.all([
                API.quiz.getById(quizId),
                API.quiz.start(quizId)
            ]);
            
            if (quizResponse.success && attemptResponse.success) {
                currentQuizAttemptId = attemptResponse.data.id;
                renderQuiz(quizResponse.data);
            }
        } catch (error) {
            console.error('Error loading quiz:', error);
            if (quizContent) {
                quizContent.innerHTML = '<div class="text-center text-error" style="padding: 2rem;">Nie udało się załadować quizu.</div>';
            }
        }
    }

    /**
     * Render quiz in modal
     */
    function renderQuiz(quiz) {
        if (!quizContent) return;

        const questions = quiz.questions || [];

        quizContent.innerHTML = `
            <div class="quiz-container">
                <h2 class="quiz-title">${escapeHtml(quiz.title)}</h2>
                <p class="quiz-description">${escapeHtml(quiz.description || '')}</p>
                
                <form id="quizForm" class="quiz-form">
                    ${questions.map((question, qIndex) => `
                        <div class="quiz-question" data-question-id="${question.id}">
                            <h4 class="quiz-question-title">${qIndex + 1}. ${escapeHtml(question.question)}</h4>
                            <div class="quiz-options">
                                ${question.options ? question.options.map((option, oIndex) => `
                                    <label class="quiz-option">
                                        <input type="radio" name="question_${qIndex}" value="${oIndex}" required>
                                        <span>${escapeHtml(option)}</span>
                                    </label>
                                `).join('') : ''}
                            </div>
                        </div>
                    `).join('')}

                    <div class="quiz-actions">
                        <button type="submit" class="btn btn-primary">Wyślij odpowiedzi</button>
                        <button type="button" class="btn btn-secondary" onclick="window.ModulesPage.closeQuizModal()">Anuluj</button>
                    </div>
                </form>
            </div>
        `;

        // Setup form submission
        const quizForm = document.getElementById('quizForm');
        if (quizForm) {
            quizForm.addEventListener('submit', (e) => submitQuiz(e, quiz.id, questions));
        }
    }

    /**
     * Submit quiz
     */
    async function submitQuiz(e, quizId, questions) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const answers = {};

        // Collect answers
        questions.forEach((question, index) => {
            const answer = formData.get(`question_${index}`);
            if (answer !== null) {
                answers[question.id] = parseInt(answer);
            }
        });

        try {
            const response = await API.quiz.submit(quizId, currentQuizAttemptId, answers);
            
            if (response.success && response.data) {
                showQuizResults(response.data);
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            showError('Nie udało się wysłać odpowiedzi. Spróbuj ponownie.');
        }
    }

    /**
     * Show quiz results
     */
    function showQuizResults(results) {
        if (!quizContent) return;

        const passed = results.passed;
        const score = results.score || 0;

        quizContent.innerHTML = `
            <div class="quiz-results">
                <div class="quiz-results-icon ${passed ? 'success' : 'error'}">
                    ${passed ? `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    ` : `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    `}
                </div>
                
                <h2 class="quiz-results-title">${passed ? 'Gratulacje!' : 'Nie udało się'}</h2>
                <p class="quiz-results-score">Twój wynik: <strong>${score}%</strong></p>
                <p class="quiz-results-message">
                    ${passed 
                        ? 'Zaliczyłeś quiz! Świetna robota!' 
                        : 'Nie osiągnąłeś wymaganego wyniku. Spróbuj ponownie!'}
                </p>

                <div class="quiz-results-actions">
                    <button class="btn btn-primary" onclick="window.ModulesPage.closeQuizModal()">Zamknij</button>
                </div>
            </div>
        `;
    }

    /**
     * Close module modal
     */
    function closeModuleModal() {
        if (moduleModal) {
            moduleModal.classList.remove('active');
            setTimeout(() => {
                moduleModal.style.display = 'none';
            }, 300); // Wait for fade animation
            document.body.style.overflow = '';
        }
        currentModuleId = null;
    }

    /**
     * Close quiz modal
     */
    function closeQuizModal() {
        if (quizModal) {
            quizModal.classList.remove('active');
            setTimeout(() => {
                quizModal.style.display = 'none';
            }, 300); // Wait for fade animation
            document.body.style.overflow = '';
        }
        currentQuizAttemptId = null;
    }

    /**
     * Handle search input
     */
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (!searchTerm) {
            filteredModules = filterByCategory(allModules, currentCategory);
        } else {
            const categoryFiltered = filterByCategory(allModules, currentCategory);
            filteredModules = categoryFiltered.filter(module => 
                module.title.toLowerCase().includes(searchTerm) ||
                (module.description && module.description.toLowerCase().includes(searchTerm))
            );
        }

        renderModules();
    }

    /**
     * Handle filter button click
     */
    function handleFilterClick(e) {
        const btn = e.currentTarget;
        const category = btn.getAttribute('data-category');

        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update current category
        currentCategory = category;

        // Filter modules
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        filteredModules = filterByCategory(allModules, category);

        if (searchTerm) {
            filteredModules = filteredModules.filter(module => 
                module.title.toLowerCase().includes(searchTerm) ||
                (module.description && module.description.toLowerCase().includes(searchTerm))
            );
        }

        renderModules();
    }

    /**
     * Filter modules by category
     */
    function filterByCategory(modules, category) {
        if (category === 'all') {
            return modules;
        }

        return modules.filter(module => {
            const level = (module.level || '').toLowerCase();
            return level === category;
        });
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
     * Show loading state
     */
    function showLoading() {
        if (loadingSkeleton) loadingSkeleton.style.display = 'grid';
        if (modulesGrid) modulesGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }

    /**
     * Hide loading state
     */
    function hideLoading() {
        if (loadingSkeleton) loadingSkeleton.style.display = 'none';
    }

    /**
     * Show empty state
     */
    function showEmptyState() {
        if (emptyState) emptyState.style.display = 'block';
        if (modulesGrid) modulesGrid.style.display = 'none';
    }

    /**
     * Hide empty state
     */
    function hideEmptyState() {
        if (emptyState) emptyState.style.display = 'none';
    }

    /**
     * Show success message
     */
    function showSuccess(message) {
        alert(message); // Simple alert for now
    }

    /**
     * Show error message
     */
    function showError(message) {
        alert(message); // Simple alert for now
    }

    /**
     * Get difficulty color
     */
    function getDifficultyColor(level) {
        const levelMap = {
            'beginner': 'success',
            'intermediate': 'warning',
            'advanced': 'error'
        };
        return levelMap[(level || '').toLowerCase()] || 'primary';
    }

    /**
     * Get difficulty text
     */
    function getDifficultyText(level) {
        const textMap = {
            'beginner': 'Początkujący',
            'intermediate': 'Średniozaawansowany',
            'advanced': 'Zaawansowany'
        };
        return textMap[(level || '').toLowerCase()] || level || 'Brak';
    }

    /**
     * Get category icon
     */
    function getCategoryIcon(category) {
        // Default book icon
        return `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
        `;
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
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Export functions to window for onclick handlers
    window.ModulesPage = {
        openModuleDetail,
        startModule,
        openQuiz,
        closeQuizModal
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
