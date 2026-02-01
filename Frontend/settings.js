/**
 * Settings Page JavaScript
 * Handles profile editing, password change, preferences, and session management
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
    
    // Load user profile
    await loadProfile();
    
    // Setup form handlers
    setupProfileForm();
    setupPasswordForm();
    setupPreferencesForm();
});

// Setup tab navigation
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            if (tabName === 'sessions' && !document.getElementById('sessionsList').dataset.loaded) {
                loadSessions();
            }
        });
    });
}

// Load user profile
async function loadProfile() {
    try {
        const response = await API.users.getProfile();
        const profile = response.data;
        
        document.getElementById('username').value = profile.username || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('fullName').value = profile.fullName || '';
        document.getElementById('bio').value = profile.bio || '';
        
        // Load preferences
        document.getElementById('emailNotifications').checked = profile.emailNotifications !== false;
        document.getElementById('pushNotifications').checked = profile.pushNotifications !== false;
        document.getElementById('language').value = profile.language || 'pl';
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Błąd ładowania profilu', 'error');
    }
}

// Setup profile form
function setupProfileForm() {
    const form = document.getElementById('profileForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            fullName: formData.get('fullName'),
            bio: formData.get('bio')
        };
        
        try {
            await API.users.updateProfile(data);
            showNotification('Profil zaktualizowany pomyślnie', 'success');
            
            // Update stored user data
            const user = API.getCurrentUser();
            Object.assign(user, data);
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification(error.message || 'Błąd aktualizacji profilu', 'error');
        }
    });
}

// Setup password form
function setupPasswordForm() {
    const form = document.getElementById('passwordForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            showNotification('Nowe hasła nie są zgodne', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            showNotification('Hasło musi mieć co najmniej 8 znaków', 'error');
            return;
        }
        
        try {
            await API.users.changePassword({ currentPassword, newPassword });
            showNotification('Hasło zmienione pomyślnie', 'success');
            form.reset();
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification(error.message || 'Błąd zmiany hasła', 'error');
        }
    });
}

// Setup preferences form
function setupPreferencesForm() {
    const form = document.getElementById('preferencesForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            pushNotifications: document.getElementById('pushNotifications').checked,
            language: document.getElementById('language').value
        };
        
        try {
            await API.users.updateProfile(data);
            showNotification('Preferencje zapisane', 'success');
        } catch (error) {
            console.error('Error updating preferences:', error);
            showNotification(error.message || 'Błąd aktualizacji preferencji', 'error');
        }
    });
}

// Load active sessions
async function loadSessions() {
    try {
        const response = await API.users.getSessions();
        const sessions = response.data;
        
        const listEl = document.getElementById('sessionsList');
        
        if (!sessions || sessions.length === 0) {
            listEl.innerHTML = '<p class="empty-state">Brak aktywnych sesji</p>';
            return;
        }
        
        listEl.innerHTML = sessions.map(session => createSessionItem(session)).join('');
        listEl.dataset.loaded = 'true';
        
        // Add delete handlers
        listEl.querySelectorAll('.delete-session-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteSession(btn.dataset.sessionId));
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        document.getElementById('sessionsList').innerHTML = '<p class="error">Błąd ładowania sesji</p>';
    }
}

// Create session item HTML
function createSessionItem(session) {
    const isCurrent = session.current;
    
    return `
        <div class="session-item ${isCurrent ? 'current' : ''}">
            <div class="session-info">
                <h4>${session.device || 'Nieznane urządzenie'}</h4>
                <p>${session.browser || 'Nieznana przeglądarka'}</p>
                <p class="session-meta">
                    IP: ${session.ipAddress || 'N/A'} • 
                    ${isCurrent ? 'Bieżąca sesja' : `Ostatnia aktywność: ${formatDate(session.lastActivity)}`}
                </p>
            </div>
            ${!isCurrent ? `
                <button class="btn btn-danger btn-small delete-session-btn" data-session-id="${session.id}">
                    Wyloguj
                </button>
            ` : ''}
        </div>
    `;
}

// Delete session
async function deleteSession(sessionId) {
    if (!confirm('Czy na pewno chcesz zakończyć tę sesję?')) {
        return;
    }
    
    try {
        await API.users.deleteSession(sessionId);
        showNotification('Sesja zakończona', 'success');
        await loadSessions();
    } catch (error) {
        console.error('Error deleting session:', error);
        showNotification(error.message || 'Błąd kończenia sesji', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL');
}
