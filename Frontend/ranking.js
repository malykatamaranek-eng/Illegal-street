/**
 * Ranking Page JavaScript
 * Handles global/monthly rankings, user rank, and achievements
 */

let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = API.getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Setup tab navigation
    setupTabs();
    
    // Load initial data
    await Promise.all([
        loadUserRank(),
        loadGlobalRanking(),
        loadAchievements()
    ]);
});

// Setup tab navigation
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to current
            btn.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            // Load data for tab if needed
            if (tabName === 'monthly' && !document.getElementById('monthlyRankingList').dataset.loaded) {
                loadMonthlyRanking();
            }
        });
    });
}

// Load user's rank
async function loadUserRank() {
    try {
        const response = await API.ranking.getUserRank();
        const data = response.data;
        
        document.getElementById('userRankNumber').textContent = data.rank || '-';
        document.getElementById('userRankName').textContent = currentUser.username;
        document.getElementById('userPoints').textContent = data.points || 0;
        document.getElementById('userModulesCompleted').textContent = data.modulesCompleted || 0;
    } catch (error) {
        console.error('Error loading user rank:', error);
    }
}

// Load global ranking
async function loadGlobalRanking() {
    try {
        const response = await API.ranking.getGlobal({ limit: 50 });
        const users = response.data;
        
        const listEl = document.getElementById('globalRankingList');
        listEl.innerHTML = users.map((user, index) => createRankingItem(user, index + 1)).join('');
        
        listEl.dataset.loaded = 'true';
    } catch (error) {
        console.error('Error loading global ranking:', error);
        document.getElementById('globalRankingList').innerHTML = '<p class="error">Błąd ładowania rankingu</p>';
    }
}

// Load monthly ranking
async function loadMonthlyRanking() {
    try {
        const response = await API.ranking.getMonthly({ limit: 50 });
        const users = response.data;
        
        const listEl = document.getElementById('monthlyRankingList');
        listEl.innerHTML = users.map((user, index) => createRankingItem(user, index + 1)).join('');
        
        listEl.dataset.loaded = 'true';
    } catch (error) {
        console.error('Error loading monthly ranking:', error);
        document.getElementById('monthlyRankingList').innerHTML = '<p class="error">Błąd ładowania rankingu</p>';
    }
}

// Create ranking item HTML
function createRankingItem(user, rank) {
    const isCurrentUser = user.username === currentUser.username;
    const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    
    return `
        <div class="ranking-item ${isCurrentUser ? 'current-user' : ''}">
            <div class="rank-position">
                ${medalEmoji || `<span class="rank-num">#${rank}</span>`}
            </div>
            <div class="rank-user">
                <div class="user-avatar">
                    ${user.username.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <h4>${user.username}</h4>
                    <p>${user.modulesCompleted || 0} modułów ukończonych</p>
                </div>
            </div>
            <div class="rank-points">
                <strong>${user.points || 0}</strong>
                <span>punktów</span>
            </div>
        </div>
    `;
}

// Load achievements
async function loadAchievements() {
    try {
        const response = await API.achievements.getAll();
        const achievements = response.data;
        
        const gridEl = document.getElementById('achievementsGrid');
        gridEl.innerHTML = achievements.map(achievement => createAchievementCard(achievement)).join('');
    } catch (error) {
        console.error('Error loading achievements:', error);
        document.getElementById('achievementsGrid').innerHTML = '<p class="error">Błąd ładowania osiągnięć</p>';
    }
}

// Create achievement card HTML
function createAchievementCard(achievement) {
    const unlocked = achievement.unlocked || false;
    const progress = achievement.progress || 0;
    const total = achievement.total || 100;
    const percentage = (progress / total) * 100;
    
    return `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${achievement.icon || '🏆'}</div>
            <h3>${achievement.name}</h3>
            <p>${achievement.description}</p>
            ${!unlocked ? `
                <div class="achievement-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="progress-text">${progress} / ${total}</span>
                </div>
            ` : `
                <div class="achievement-unlocked">
                    <span class="unlock-date">Odblokowano: ${formatDate(achievement.unlockedAt)}</span>
                </div>
            `}
        </div>
    `;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
}
