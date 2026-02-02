/**
 * Quiz Page JavaScript
 * Handles quiz listing, filtering, search, and quiz-taking functionality
 */

(function() {
    'use strict';

    // Global state
    let currentUser = null;
    let allQuizzes = [];
    let currentQuizAttemptId = null;

    // DOM Elements
    const quizList = document.getElementById('quizList');
    const emptyState = document.getElementById('emptyState');
    const quizSearchInput = document.getElementById('quizSearchInput');
    const quizCategoryFilter = document.getElementById('quizCategoryFilter');
    const quizDifficultyFilter = document.getElementById('quizDifficultyFilter');
    const quizModal = document.getElementById('quizModal');
    const quizModalClose = document.getElementById('quizModalClose');
    const quizContent = document.getElementById('quizContent');
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.getElementById('sidebar');
    const navMenu = document.querySelector('.nav-menu');
    const logoutBtn = document.getElementById('logoutBtn');

    /**
     * Initialize page
     */
    async function init() {
        try {
            // Check authentication
            currentUser = await checkAuth();
            
            if (!currentUser) {
                window.location.href = 'login.html';
                return;
            }

            updateNavigation(currentUser);
            setupEventListeners();
            await loadQuizzes();
            await loadUserStats();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    /**
     * Check user authentication
     */
    async function checkAuth() {
        try {
            const response = await API.users.getProfile();
            if (response.success) {
                return response.data;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Update navigation with user info
     */
    function updateNavigation(user) {
        const navUserSection = document.getElementById('navUserSection');
        const authButtons = document.getElementById('authButtons');
        const logoutSection = document.getElementById('logoutSection');
        const navUsername = document.getElementById('navUsername');
        const navAvatar = document.getElementById('navAvatar');

        if (user) {
            if (navUserSection) navUserSection.style.display = 'flex';
            if (authButtons) authButtons.style.display = 'none';
            if (logoutSection) logoutSection.style.display = 'block';
            if (navUsername) navUsername.textContent = user.username || user.email;
            if (navAvatar && user.avatar) navAvatar.src = user.avatar;
        } else {
            if (navUserSection) navUserSection.style.display = 'none';
            if (authButtons) authButtons.style.display = 'block';
            if (logoutSection) logoutSection.style.display = 'none';
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Mobile navigation toggle
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                sidebar?.classList.toggle('active');
                navMenu?.classList.toggle('active');
            });
        }

        // Search and filters
        if (quizSearchInput) {
            quizSearchInput.addEventListener('input', debounce(filterQuizzes, 300));
        }
        if (quizCategoryFilter) {
            quizCategoryFilter.addEventListener('change', filterQuizzes);
        }
        if (quizDifficultyFilter) {
            quizDifficultyFilter.addEventListener('change', filterQuizzes);
        }

        // Modal close handlers
        if (quizModalClose) quizModalClose.addEventListener('click', closeQuizModal);
        if (quizModal) {
            quizModal.addEventListener('click', (e) => {
                if (e.target === quizModal) closeQuizModal();
            });
        }

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (quizModal && !quizModal.classList.contains('hidden')) {
                    closeQuizModal();
                }
            }
        });
    }

    /**
     * Load all quizzes
     */
    async function loadQuizzes() {
        try {
            const response = await API.quiz.getAll();
            
            if (response.success && response.data) {
                allQuizzes = response.data;
                renderQuizzes(allQuizzes);
            } else {
                showEmptyState();
            }
        } catch (error) {
            console.error('Error loading quizzes:', error);
            showError('Nie udało się załadować quizów');
        }
    }

    /**
     * Load user statistics
     */
    async function loadUserStats() {
        try {
            // This would call an API endpoint for quiz statistics
            // For now, we'll use placeholder data
            document.getElementById('completedQuizzes').textContent = '0';
            document.getElementById('averageScore').textContent = '0%';
            document.getElementById('perfectScores').textContent = '0';
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    /**
     * Render quizzes
     */
    function renderQuizzes(quizzes) {
        if (!quizList) return;

        if (quizzes.length === 0) {
            showEmptyState();
            return;
        }

        hideEmptyState();
        quizList.innerHTML = quizzes.map(quiz => createQuizCard(quiz)).join('');

        // Attach click handlers
        quizList.querySelectorAll('.btn-start-quiz').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quizId = e.target.getAttribute('data-quiz-id');
                if (quizId) openQuiz(quizId);
            });
        });
    }

    /**
     * Create quiz card HTML
     */
    function createQuizCard(quiz) {
        const questionCount = quiz.questions?.length || 0;
        const difficulty = quiz.difficulty || 'medium';
        const category = quiz.category || 'Ogólne';

        return `
            <div class="quiz-card">
                <div class="quiz-card-header">
                    <h3 class="quiz-card-title">${escapeHtml(quiz.title)}</h3>
                    <span class="quiz-card-badge badge">${escapeHtml(category)}</span>
                </div>
                <p class="quiz-card-description">${escapeHtml(quiz.description || 'Brak opisu')}</p>
                <div class="quiz-card-meta">
                    <div class="quiz-card-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <span>${questionCount} ${questionCount === 1 ? 'pytanie' : 'pytania'}</span>
                    </div>
                    <div class="quiz-card-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${quiz.timeLimit || 30} min</span>
                    </div>
                    <div class="quiz-card-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>${getDifficultyLabel(difficulty)}</span>
                    </div>
                </div>
                <div class="quiz-card-actions">
                    <button class="btn btn-primary btn-start-quiz" data-quiz-id="${quiz.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Rozpocznij quiz
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Filter quizzes based on search and filters
     */
    function filterQuizzes() {
        const searchTerm = quizSearchInput?.value.toLowerCase() || '';
        const category = quizCategoryFilter?.value || '';
        const difficulty = quizDifficultyFilter?.value || '';

        const filtered = allQuizzes.filter(quiz => {
            const matchesSearch = !searchTerm || 
                quiz.title.toLowerCase().includes(searchTerm) ||
                (quiz.description && quiz.description.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !category || quiz.category === category;
            const matchesDifficulty = !difficulty || quiz.difficulty === difficulty;

            return matchesSearch && matchesCategory && matchesDifficulty;
        });

        renderQuizzes(filtered);
    }

    /**
     * Open quiz modal
     */
    async function openQuiz(quizId) {
        try {
            // Show modal with loading state
            if (quizModal) {
                quizModal.classList.remove('hidden');
                setTimeout(() => {
                    quizModal.classList.add('active');
                }, 10);
            }

            if (quizContent) {
                quizContent.innerHTML = '<div class="quiz-loading"><div class="spinner"></div><p>Ładowanie quizu...</p></div>';
            }

            // Start quiz and get quiz data
            const [quizResponse, attemptResponse] = await Promise.all([
                API.quiz.getById(quizId),
                API.quiz.start(quizId)
            ]);

            if (quizResponse.success && attemptResponse.success) {
                currentQuizAttemptId = attemptResponse.data.attemptId;
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
                                ${question.options.map((option, oIndex) => `
                                    <label class="quiz-option">
                                        <input type="radio" name="question-${question.id}" value="${oIndex}" required>
                                        <span>${escapeHtml(option)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}

                    <div class="quiz-actions">
                        <button type="button" class="btn btn-secondary" onclick="window.QuizPage.closeQuizModal()">Anuluj</button>
                        <button type="submit" class="btn btn-primary">Zakończ quiz</button>
                    </div>
                </form>
            </div>
        `;

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

        try {
            // Collect answers
            const answers = questions.map(question => {
                const selected = document.querySelector(`input[name="question-${question.id}"]:checked`);
                return {
                    questionId: question.id,
                    selectedOption: selected ? parseInt(selected.value) : null
                };
            });

            // Check if all questions are answered
            const unanswered = answers.filter(a => a.selectedOption === null);
            if (unanswered.length > 0) {
                showError('Proszę odpowiedzieć na wszystkie pytania');
                return;
            }

            // Submit to API
            const response = await API.quiz.submit(quizId, {
                attemptId: currentQuizAttemptId,
                answers: answers
            });

            if (response.success) {
                showQuizResults(response.data);
            } else {
                showError('Nie udało się wysłać odpowiedzi');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            showError('Wystąpił błąd podczas wysyłania odpowiedzi');
        }
    }

    /**
     * Show quiz results
     */
    function showQuizResults(results) {
        if (!quizContent) return;

        const score = results.score || 0;
        const percentage = results.percentage || 0;
        const passed = results.passed || false;
        const correctAnswers = results.correctAnswers || 0;
        const totalQuestions = results.totalQuestions || 0;

        quizContent.innerHTML = `
            <div class="quiz-results">
                <div class="quiz-results-icon ${passed ? 'success' : 'fail'}">
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
                <h3 class="quiz-results-title ${passed ? 'success' : 'fail'}">
                    ${passed ? 'Gratulacje!' : 'Spróbuj ponownie'}
                </h3>
                <div class="quiz-results-score">${percentage}%</div>
                <p class="quiz-results-message">
                    ${passed ? 'Zaliczyłeś quiz!' : 'Nie udało się zaliczyć quizu'}
                </p>

                <div class="quiz-results-stats">
                    <div class="quiz-results-stat">
                        <div class="stat-label">Poprawne</div>
                        <div class="stat-value correct">${correctAnswers}</div>
                    </div>
                    <div class="quiz-results-stat">
                        <div class="stat-label">Niepoprawne</div>
                        <div class="stat-value incorrect">${totalQuestions - correctAnswers}</div>
                    </div>
                    <div class="quiz-results-stat">
                        <div class="stat-label">Razem</div>
                        <div class="stat-value">${totalQuestions}</div>
                    </div>
                </div>

                <div class="quiz-results-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.QuizPage.closeQuizModal()">Zamknij</button>
                    <button type="button" class="btn btn-primary" onclick="window.QuizPage.retakeQuiz('${results.quizId}')">Spróbuj ponownie</button>
                </div>
            </div>
        `;

        // Reload user stats
        loadUserStats();
    }

    /**
     * Close quiz modal
     */
    function closeQuizModal() {
        if (quizModal) {
            quizModal.classList.remove('active');
            setTimeout(() => {
                quizModal.classList.add('hidden');
                if (quizContent) quizContent.innerHTML = '';
                currentQuizAttemptId = null;
            }, 300);
        }
    }

    /**
     * Retake quiz
     */
    function retakeQuiz(quizId) {
        closeQuizModal();
        setTimeout(() => openQuiz(quizId), 400);
    }

    /**
     * Show empty state
     */
    function showEmptyState() {
        if (quizList) quizList.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
    }

    /**
     * Hide empty state
     */
    function hideEmptyState() {
        if (emptyState) emptyState.classList.add('hidden');
    }

    /**
     * Show error message
     */
    function showError(message) {
        // Simple alert for now - could be replaced with a toast notification
        alert(message);
    }

    /**
     * Handle logout
     */
    async function handleLogout() {
        try {
            await API.auth.logout();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Get difficulty label
     */
    function getDifficultyLabel(difficulty) {
        const labels = {
            easy: 'Łatwy',
            medium: 'Średni',
            hard: 'Trudny'
        };
        return labels[difficulty] || 'Średni';
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
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Expose public API
    window.QuizPage = {
        openQuiz,
        closeQuizModal,
        retakeQuiz
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
