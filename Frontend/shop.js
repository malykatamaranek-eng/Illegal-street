/**
 * Shop Page JavaScript
 * Handles product listing, cart management, checkout, and order history
 */

let currentUser = null;
let cart = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = API.getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Load cart from localStorage
    loadCartFromStorage();
    
    // Setup tab navigation
    setupTabs();
    
    // Load products
    await loadProducts();
    
    // Load user points
    await loadUserPoints();
    
    // Setup checkout
    setupCheckout();
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
            
            if (tabName === 'cart') {
                renderCart();
            } else if (tabName === 'orders' && !document.getElementById('ordersList').dataset.loaded) {
                loadOrders();
            }
        });
    });
}

// Load products
async function loadProducts() {
    try {
        const response = await API.shop.getProducts();
        const products = response.data;
        
        const gridEl = document.getElementById('productsGrid');
        gridEl.innerHTML = products.map(product => createProductCard(product)).join('');
        
        // Add to cart handlers
        gridEl.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                const product = products.find(p => p.id === productId);
                addToCart(product);
            });
        });
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = '<p class="error">Błąd ładowania produktów</p>';
    }
}

// Create product card
function createProductCard(product) {
    return `
        <div class="product-card">
            <div class="product-image">
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}">` : 
                  `<div class="product-placeholder">${product.icon || '📦'}</div>`}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price} punktów</span>
                    <button class="btn btn-primary btn-small add-to-cart-btn" data-product-id="${product.id}">
                        Dodaj do koszyka
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Add to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCartToStorage();
    updateCartBadge();
    showNotification(`${product.name} dodano do koszyka`, 'success');
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartBadge();
    renderCart();
}

// Update cart quantity
function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCartToStorage();
        renderCart();
    }
}

// Render cart
function renderCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartSummaryEl = document.getElementById('cartSummary');
    
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<div class="empty-state"><p>Twój koszyk jest pusty</p></div>';
        cartSummaryEl.style.display = 'none';
        return;
    }
    
    cartItemsEl.innerHTML = cart.map(item => createCartItem(item)).join('');
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('totalPoints').textContent = `${total} punktów`;
    cartSummaryEl.style.display = 'block';
    
    // Add event listeners
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.productId));
    });
    
    cartItemsEl.querySelectorAll('.cart-item-quantity').forEach(input => {
        input.addEventListener('change', (e) => {
            updateCartQuantity(e.target.dataset.productId, parseInt(e.target.value, 10));
        });
    });
}

// Create cart item
function createCartItem(item) {
    return `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">${item.price} punktów</p>
            </div>
            <div class="cart-item-controls">
                <input 
                    type="number" 
                    class="cart-item-quantity" 
                    value="${item.quantity}" 
                    min="1" 
                    data-product-id="${item.id}"
                >
                <button class="btn btn-danger btn-small cart-item-remove" data-product-id="${item.id}">
                    Usuń
                </button>
            </div>
        </div>
    `;
}

// Setup checkout
function setupCheckout() {
    document.getElementById('checkoutBtn').addEventListener('click', async () => {
        if (cart.length === 0) {
            showNotification('Koszyk jest pusty', 'error');
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const userPoints = parseInt(document.getElementById('userPointsDisplay').textContent, 10);
        
        if (total > userPoints) {
            showNotification('Niewystarczająca liczba punktów', 'error');
            return;
        }
        
        if (!confirm(`Czy na pewno chcesz złożyć zamówienie za ${total} punktów?`)) {
            return;
        }
        
        try {
            const items = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }));
            
            await API.shop.checkout({ items });
            
            // Clear cart
            cart = [];
            saveCartToStorage();
            updateCartBadge();
            
            showNotification('Zamówienie złożone pomyślnie!', 'success');
            
            // Refresh points and switch to orders tab
            await loadUserPoints();
            document.querySelector('[data-tab="orders"]').click();
            loadOrders();
        } catch (error) {
            console.error('Error during checkout:', error);
            showNotification(error.message || 'Błąd składania zamówienia', 'error');
        }
    });
}

// Load user points
async function loadUserPoints() {
    try {
        const response = await API.auth.getMe();
        const points = response.data.points || 0;
        document.getElementById('userPointsDisplay').textContent = points;
    } catch (error) {
        console.error('Error loading user points:', error);
    }
}

// Load orders
async function loadOrders() {
    try {
        const response = await API.shop.getOrders();
        const orders = response.data;
        
        const listEl = document.getElementById('ordersList');
        
        if (!orders || orders.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><p>Brak zamówień</p></div>';
            return;
        }
        
        listEl.innerHTML = orders.map(order => createOrderCard(order)).join('');
        listEl.dataset.loaded = 'true';
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersList').innerHTML = '<p class="error">Błąd ładowania zamówień</p>';
    }
}

// Create order card
function createOrderCard(order) {
    const statusClass = order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'info';
    const statusText = order.status === 'completed' ? 'Zrealizowane' : order.status === 'pending' ? 'Oczekujące' : 'Przetwarzanie';
    
    return `
        <div class="order-card">
            <div class="order-header">
                <h3>Zamówienie #${order.id.substring(0, 8)}</h3>
                <span class="order-status status-${statusClass}">${statusText}</span>
            </div>
            <div class="order-body">
                <p class="order-date">${formatDate(order.createdAt)}</p>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.productName || item.name}</span>
                            <span>x${item.quantity}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="order-footer">
                <span class="order-total">Łącznie: ${order.totalPoints} punktów</span>
            </div>
        </div>
    `;
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const stored = localStorage.getItem('cart');
    if (stored) {
        try {
            cart = JSON.parse(stored);
            updateCartBadge();
        } catch (error) {
            console.error('Error loading cart:', error);
            cart = [];
        }
    }
}

// Update cart badge
function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
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
