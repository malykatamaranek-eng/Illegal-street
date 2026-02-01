/**
 * Chat Page JavaScript
 * Handles real-time chat with WebSocket, message history, and typing indicators
 */

let currentUser = null;
let ws = null;
let reconnectInterval = null;
let typingTimeout = null;
let isTyping = false;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = API.getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Load message history
    await loadMessages();
    
    // Setup WebSocket connection
    connectWebSocket();
    
    // Setup message form
    setupMessageForm();
    
    // Setup typing indicator
    setupTypingIndicator();
});

// Connect to WebSocket
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            updateConnectionStatus('connected');
            clearInterval(reconnectInterval);
            
            // Send authentication
            ws.send(JSON.stringify({
                type: 'auth',
                token: localStorage.getItem('authToken')
            }));
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus('error');
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            updateConnectionStatus('disconnected');
            
            // Try to reconnect
            reconnectInterval = setInterval(() => {
                if (!ws || ws.readyState === WebSocket.CLOSED) {
                    connectWebSocket();
                }
            }, 5000);
        };
    } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        updateConnectionStatus('error');
    }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'message':
            addMessageToUI(data.message);
            scrollToBottom();
            break;
        case 'typing':
            showTypingIndicator(data.username);
            break;
        case 'stop-typing':
            hideTypingIndicator();
            break;
        case 'delete':
            removeMessageFromUI(data.messageId);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Update connection status
function updateConnectionStatus(status) {
    const indicator = document.getElementById('connectionStatus');
    const text = document.getElementById('statusText');
    
    indicator.className = 'status-indicator';
    
    switch (status) {
        case 'connected':
            indicator.classList.add('status-connected');
            text.textContent = 'Połączono';
            break;
        case 'disconnected':
            indicator.classList.add('status-disconnected');
            text.textContent = 'Rozłączono';
            break;
        case 'error':
            indicator.classList.add('status-error');
            text.textContent = 'Błąd połączenia';
            break;
    }
}

// Load message history
async function loadMessages() {
    try {
        const response = await API.chat.getMessages({ limit: 100 });
        const messages = response.data;
        
        const listEl = document.getElementById('messagesList');
        listEl.innerHTML = '';
        
        messages.forEach(message => addMessageToUI(message, false));
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Add message to UI
function addMessageToUI(message, animate = true) {
    const listEl = document.getElementById('messagesList');
    const messageEl = createMessageElement(message);
    
    if (animate) {
        messageEl.classList.add('message-animate');
    }
    
    listEl.appendChild(messageEl);
}

// Create message element
function createMessageElement(message) {
    const isOwn = message.userId === currentUser.id || message.username === currentUser.username;
    
    const div = document.createElement('div');
    div.className = `message ${isOwn ? 'message-own' : 'message-other'}`;
    div.dataset.messageId = message.id;
    
    div.innerHTML = `
        <div class="message-avatar">${(message.username || 'U').charAt(0).toUpperCase()}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${escapeHtml(message.username || 'Unknown')}</span>
                <span class="message-time">${formatTime(message.createdAt)}</span>
            </div>
            <div class="message-text">${escapeHtml(message.content)}</div>
            ${isOwn ? `
                <button class="message-delete" data-message-id="${message.id}" title="Usuń wiadomość">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            ` : ''}
        </div>
    `;
    
    // Add delete handler
    const deleteBtn = div.querySelector('.message-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteMessage(message.id));
    }
    
    return div;
}

// Remove message from UI
function removeMessageFromUI(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
        messageEl.classList.add('message-deleted');
        setTimeout(() => messageEl.remove(), 300);
    }
}

// Setup message form
function setupMessageForm() {
    const form = document.getElementById('messageForm');
    const input = document.getElementById('messageInput');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const content = input.value.trim();
        if (!content) return;
        
        try {
            // Send via WebSocket if connected
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'message',
                    content: content
                }));
            } else {
                // Fallback to API
                await API.chat.sendMessage({ content });
            }
            
            input.value = '';
            stopTyping();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Błąd wysyłania wiadomości');
        }
    });
}

// Setup typing indicator
function setupTypingIndicator() {
    const input = document.getElementById('messageInput');
    
    input.addEventListener('input', () => {
        if (!isTyping) {
            startTyping();
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(stopTyping, 1000);
    });
}

// Start typing
function startTyping() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'typing' }));
        isTyping = true;
    }
}

// Stop typing
function stopTyping() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stop-typing' }));
        isTyping = false;
    }
}

// Show typing indicator
function showTypingIndicator(username) {
    const indicator = document.getElementById('typingIndicator');
    const text = document.getElementById('typingText');
    
    text.textContent = `${username} pisze...`;
    indicator.style.display = 'flex';
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'none';
}

// Delete message
async function deleteMessage(messageId) {
    if (!confirm('Czy na pewno chcesz usunąć tę wiadomość?')) {
        return;
    }
    
    try {
        await API.chat.deleteMessage(messageId);
        
        // Send via WebSocket if connected
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'delete',
                messageId: messageId
            }));
        }
        
        removeMessageFromUI(messageId);
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Błąd usuwania wiadomości');
    }
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// Format time
function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
    clearInterval(reconnectInterval);
});
