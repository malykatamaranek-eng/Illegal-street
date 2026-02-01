/**
 * Admin Page JavaScript
 * Handles user management, module management, order management, and audit logs
 */

let currentUser = null;
let editingUserId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = API.getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user is admin
    if (currentUser.role !== 'admin') {
        alert('Brak uprawnień do tej strony');
        window.location.href = 'dashboard.html';
        return;
    }

    // Setup tab navigation
    setupTabs();
    
    // Load initial data
    await Promise.all([
        loadAnalytics(),
        loadUsers()
    ]);
    
    // Setup modal
    setupUserModal();
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
            
            // Load data for tab if needed
            if (tabName === 'modules' && !document.getElementById('modulesTableBody').dataset.loaded) {
                loadModules();
            } else if (tabName === 'orders' && !document.getElementById('ordersTableBody').dataset.loaded) {
                loadOrders();
            } else if (tabName === 'audit' && !document.getElementById('auditLogs').dataset.loaded) {
                loadAuditLogs();
            }
        });
    });
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await API.admin.getAnalytics();
        const data = response.data;
        
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
        document.getElementById('totalModules').textContent = data.totalModules || 0;
        document.getElementById('totalOrders').textContent = data.totalOrders || 0;
        document.getElementById('totalMessages').textContent = data.totalMessages || 0;
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await API.admin.getUsers();
        const users = response.data;
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(user => createUserRow(user)).join('');
        tbody.dataset.loaded = 'true';
        
        // Add event listeners
        tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => editUser(btn.dataset.userId));
        });
        
        tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteUser(btn.dataset.userId));
        });
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" class="error">Błąd ładowania użytkowników</td></tr>';
    }
}

// Create user row
function createUserRow(user) {
    return `
        <tr>
            <td>${user.id.substring(0, 8)}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-${user.role === 'admin' ? 'danger' : 'info'}">${user.role}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn btn-small btn-secondary edit-user-btn" data-user-id="${user.id}">Edytuj</button>
                <button class="btn btn-small btn-danger delete-user-btn" data-user-id="${user.id}">Usuń</button>
            </td>
        </tr>
    `;
}

// Load modules
async function loadModules() {
    try {
        const response = await API.modules.getAll();
        const modules = response.data;
        
        const tbody = document.getElementById('modulesTableBody');
        tbody.innerHTML = modules.map(module => createModuleRow(module)).join('');
        tbody.dataset.loaded = 'true';
        
        // Add event listeners
        tbody.querySelectorAll('.delete-module-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteModule(btn.dataset.moduleId));
        });
    } catch (error) {
        console.error('Error loading modules:', error);
        document.getElementById('modulesTableBody').innerHTML = '<tr><td colspan="6" class="error">Błąd ładowania modułów</td></tr>';
    }
}

// Create module row
function createModuleRow(module) {
    return `
        <tr>
            <td>${module.id.substring(0, 8)}</td>
            <td>${module.title}</td>
            <td>${module.category || '-'}</td>
            <td>${module.difficulty || '-'}</td>
            <td><span class="badge badge-${module.isPublished ? 'success' : 'warning'}">${module.isPublished ? 'Opublikowany' : 'Szkic'}</span></td>
            <td>
                <button class="btn btn-small btn-danger delete-module-btn" data-module-id="${module.id}">Usuń</button>
            </td>
        </tr>
    `;
}

// Load orders
async function loadOrders() {
    try {
        const response = await API.admin.getOrders();
        const orders = response.data;
        
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = orders.map(order => createOrderRow(order)).join('');
        tbody.dataset.loaded = 'true';
        
        // Add event listeners
        tbody.querySelectorAll('.update-order-btn').forEach(btn => {
            btn.addEventListener('click', () => updateOrderStatus(btn.dataset.orderId, btn.dataset.status));
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersTableBody').innerHTML = '<tr><td colspan="7" class="error">Błąd ładowania zamówień</td></tr>';
    }
}

// Create order row
function createOrderRow(order) {
    const statusClass = order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'info';
    
    return `
        <tr>
            <td>${order.id.substring(0, 8)}</td>
            <td>${order.username || order.userId.substring(0, 8)}</td>
            <td>${order.items.length} produktów</td>
            <td>${order.totalPoints}</td>
            <td><span class="badge badge-${statusClass}">${order.status}</span></td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                ${order.status === 'pending' ? `
                    <button class="btn btn-small btn-success update-order-btn" data-order-id="${order.id}" data-status="completed">Zatwierdź</button>
                ` : '-'}
            </td>
        </tr>
    `;
}

// Load audit logs
async function loadAuditLogs() {
    try {
        const response = await API.admin.getAuditLogs();
        const logs = response.data;
        
        const logsEl = document.getElementById('auditLogs');
        logsEl.innerHTML = logs.map(log => createAuditLogItem(log)).join('');
        logsEl.dataset.loaded = 'true';
    } catch (error) {
        console.error('Error loading audit logs:', error);
        document.getElementById('auditLogs').innerHTML = '<p class="error">Błąd ładowania logów</p>';
    }
}

// Create audit log item
function createAuditLogItem(log) {
    return `
        <div class="audit-log-item">
            <div class="log-icon">${getLogIcon(log.action)}</div>
            <div class="log-info">
                <p class="log-message">${log.message}</p>
                <p class="log-meta">
                    ${log.username || 'System'} • ${formatDateTime(log.createdAt)} • IP: ${log.ipAddress || 'N/A'}
                </p>
            </div>
        </div>
    `;
}

// Get log icon based on action
function getLogIcon(action) {
    const icons = {
        create: '➕',
        update: '✏️',
        delete: '🗑️',
        login: '🔐',
        logout: '🚪',
        error: '⚠️'
    };
    return icons[action] || '📝';
}

// Setup user modal
function setupUserModal() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const addBtn = document.getElementById('addUserBtn');
    const closeBtns = modal.querySelectorAll('.modal-close, .modal-cancel');
    
    addBtn.addEventListener('click', () => {
        editingUserId = null;
        form.reset();
        document.getElementById('modalTitle').textContent = 'Dodaj użytkownika';
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('modalPassword').required = true;
        modal.style.display = 'flex';
    });
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveUser(form);
    });
}

// Edit user
async function editUser(userId) {
    try {
        const response = await API.admin.getUser(userId);
        const user = response.data;
        
        editingUserId = userId;
        document.getElementById('userId').value = userId;
        document.getElementById('modalUsername').value = user.username;
        document.getElementById('modalEmail').value = user.email;
        document.getElementById('modalRole').value = user.role;
        document.getElementById('modalTitle').textContent = 'Edytuj użytkownika';
        document.getElementById('passwordGroup').style.display = 'none';
        document.getElementById('modalPassword').required = false;
        
        document.getElementById('userModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Błąd ładowania danych użytkownika');
    }
}

// Save user
async function saveUser(form) {
    const formData = new FormData(form);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role')
    };
    
    if (formData.get('password')) {
        data.password = formData.get('password');
    }
    
    try {
        if (editingUserId) {
            await API.admin.updateUser(editingUserId, data);
        } else {
            await API.admin.createUser(data);
        }
        
        document.getElementById('userModal').style.display = 'none';
        await loadUsers();
        showNotification('Użytkownik zapisany', 'success');
    } catch (error) {
        console.error('Error saving user:', error);
        alert(error.message || 'Błąd zapisu użytkownika');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
        return;
    }
    
    try {
        await API.admin.deleteUser(userId);
        await loadUsers();
        showNotification('Użytkownik usunięty', 'success');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.message || 'Błąd usuwania użytkownika');
    }
}

// Delete module
async function deleteModule(moduleId) {
    if (!confirm('Czy na pewno chcesz usunąć ten moduł?')) {
        return;
    }
    
    try {
        await API.admin.deleteModule(moduleId);
        await loadModules();
        showNotification('Moduł usunięty', 'success');
    } catch (error) {
        console.error('Error deleting module:', error);
        alert(error.message || 'Błąd usuwania modułu');
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        await API.admin.updateOrderStatus(orderId, { status: newStatus });
        await loadOrders();
        showNotification('Status zamówienia zaktualizowany', 'success');
    } catch (error) {
        console.error('Error updating order:', error);
        alert(error.message || 'Błąd aktualizacji zamówienia');
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
    return date.toLocaleDateString('pl-PL');
}

// Format date and time
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL');
}
