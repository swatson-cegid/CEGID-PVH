// Configuration
let config = {
    environment: 'p', // Fixed to 'p' - this is the actual path
    useProxy: false, // Set to true for local development with CORS proxy
    tokenUrl: 'https://integration-retail-services.cegid.cloud/p/as/connect/token',
    proxyTokenUrl: 'http://localhost:3000/token',
    clientId: 'CegidRetailResourceFlowClient',
    username: 'SWA@PSR_UK2',
    password: 'Cegid.2020',
    apiBaseUrl: 'https://integration-retail-services.cegid.cloud/p/pos/external-basket/v1',
    proxyApiBaseUrl: 'http://localhost:3000',
    storeId: 'UK201',
    warehouseId: 'UK201',
    currency: 'GBP'
};

// Token cache
let accessToken = null;
let tokenExpiry = null;

// State
let orders = [];
let selectedOrderId = null;

// DOM Elements
const orderListEl = document.getElementById('order-list');
const orderDetailsEl = document.getElementById('order-details');
const orderCountEl = document.getElementById('order-count');
const loadingOverlay = document.getElementById('loading-overlay');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadConfiguration();
    useMockData();
});

// Configuration Management
function loadConfiguration() {
    const savedConfig = localStorage.getItem('posConfig');
    if (savedConfig) {
        config = { ...config, ...JSON.parse(savedConfig) };
    }
}

function saveConfiguration() {
    const newConfig = {
        environment: 'p', // Fixed - always use /p/ path
        useProxy: document.getElementById('use-proxy').checked,
        clientId: 'CegidRetailResourceFlowClient', // Fixed client_id
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value.trim(),
        apiBaseUrl: 'https://integration-retail-services.cegid.cloud/p/pos/external-basket/v1', // Fixed URL
        proxyApiBaseUrl: 'http://localhost:3000',
        tokenUrl: 'https://integration-retail-services.cegid.cloud/p/as/connect/token', // Fixed token URL
        proxyTokenUrl: 'http://localhost:3000/token',
        storeId: document.getElementById('store-id').value.trim(),
        warehouseId: document.getElementById('warehouse-id').value.trim(),
        currency: document.getElementById('currency').value.trim() || 'GBP'
    };

    // Validate required fields
    if (!newConfig.username || !newConfig.password || !newConfig.storeId || !newConfig.warehouseId) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    config = newConfig;
    localStorage.setItem('posConfig', JSON.stringify(config));
    
    // Clear cached token when config changes
    accessToken = null;
    tokenExpiry = null;
    
    closeConfigModal();
    showNotification('Configuration saved successfully', 'success');
}

function openConfigModal() {
    // Populate form with current config
    document.getElementById('use-proxy').checked = config.useProxy || false;
    document.getElementById('username').value = config.username || '';
    document.getElementById('password').value = config.password || '';
    document.getElementById('store-id').value = config.storeId || '';
    document.getElementById('warehouse-id').value = config.warehouseId || '';
    document.getElementById('currency').value = config.currency || 'GBP';
    
    document.getElementById('config-modal').style.display = 'flex';
}

function closeConfigModal() {
    document.getElementById('config-modal').style.display = 'none';
}

// Parse the order structure
function parseOrdersData(data) {
    const parsedOrders = [];
    const ordersList = data.orders || data;
    
    ordersList.forEach(order => {
        const orderId = order.id;
        const customerName = order.customer_name;
        const timestamp = order.timestamp;
        const items = order.items || [];
        
        // Calculate total for the order
        const orderTotal = items.reduce((sum, item) => {
            return sum + (item.price * item.qty);
        }, 0);
        
        parsedOrders.push({
            id: orderId,
            customerName: customerName,
            timestamp: timestamp,
            items: items,
            total: orderTotal,
            itemCount: items.length
        });
    });
    
    return parsedOrders;
}

// Render Order List
function renderOrderList() {
    if (orders.length === 0) {
        orderListEl.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12H42V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V12Z" stroke="#CCCCCC" stroke-width="2"/>
                    <path d="M15 12V9C15 6.79086 16.7909 5 19 5H29C31.2091 5 33 6.79086 33 9V12" stroke="#CCCCCC" stroke-width="2"/>
                </svg>
                <p>No orders found</p>
            </div>
        `;
        orderCountEl.textContent = '0';
        return;
    }
    
    orderListEl.innerHTML = '';
    orderCountEl.textContent = orders.length;
    
    orders.forEach(order => {
        const orderItem = createOrderItem(order);
        orderListEl.appendChild(orderItem);
    });
}

// Create Order Item Element
function createOrderItem(order) {
    const div = document.createElement('div');
    div.className = 'order-item';
    if (selectedOrderId === order.id) {
        div.classList.add('selected');
    }
    
    // Format timestamp
    const orderDate = new Date(order.timestamp);
    const timeStr = orderDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    div.innerHTML = `
        <div class="order-item-header">
            <span class="order-item-id">${order.id}</span>
            <span class="order-item-time">${timeStr}</span>
        </div>
        <div class="order-item-customer">${order.customerName}</div>
        <div class="order-item-meta">
            <span class="item-count">${order.itemCount} item${order.itemCount !== 1 ? 's' : ''}</span>
            <span class="order-total">$${order.total.toFixed(2)}</span>
        </div>
    `;
    
    div.addEventListener('click', () => selectOrder(order.id));
    
    return div;
}

// Select Order
function selectOrder(orderId) {
    selectedOrderId = orderId;
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        renderOrderDetails(order);
        updateSelectedOrderUI();
    }
}

// Update Selected Order UI
function updateSelectedOrderUI() {
    const orderItems = document.querySelectorAll('.order-item');
    orderItems.forEach(item => {
        const orderIdText = item.querySelector('.order-item-id').textContent;
        
        if (orderIdText === selectedOrderId) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Render Order Details
function renderOrderDetails(order) {
    let itemsHtml = '';
    
    order.items.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        itemsHtml += `
            <div class="item-row">
                <img src="${item.thumbnail}" 
                     alt="${item.product_name}" 
                     class="item-thumbnail" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect fill=%22%23f5f5f5%22 width=%2280%22 height=%2280%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2210%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                <div class="item-info">
                    <div class="item-name">${item.product_name}</div>
                    <div class="item-sku">SKU: ${item.sku}</div>
                    <div class="item-id">ID: ${item.id}</div>
                </div>
                <div class="item-pricing">
                    <div class="item-unit-price">$${item.price.toFixed(2)} × ${item.qty}</div>
                    <div class="item-total">$${itemTotal.toFixed(2)}</div>
                </div>
            </div>
        `;
    });
    
    // Format timestamp
    const orderDate = new Date(order.timestamp);
    const formattedDate = orderDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    orderDetailsEl.innerHTML = `
        <div class="order-details-content">
            <div class="order-header">
                <div class="order-id-badge">${order.id}</div>
                <div class="order-info">
                    <div class="customer-name">${order.customerName}</div>
                    <div class="order-timestamp">${formattedDate}</div>
                </div>
            </div>
            
            <div class="items-section">
                <h3>Items (${order.itemCount})</h3>
                <div class="items-container">
                    ${itemsHtml}
                </div>
            </div>
            
            <div class="order-summary">
                <div class="summary-row">
                    <span class="summary-label">Subtotal:</span>
                    <span class="summary-value">$${order.total.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span class="summary-label">Total:</span>
                    <span class="summary-value">$${order.total.toFixed(2)}</span>
                </div>
            </div>
            
            <button class="add-to-order-btn" onclick="addToOrder()">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 10H4M10 4V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Add to LiveStore POS
            </button>
        </div>
    `;
}

// OAuth2 Token Management
async function getAccessToken() {
    // Check if we have a valid cached token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        let tokenResponse;
        
        if (config.useProxy) {
            // Use local CORS proxy
            tokenResponse = await fetch(config.proxyTokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: config.clientId,
                    username: config.username,
                    password: config.password,
                    grant_type: 'password',
                    scope: 'RetailBackendApi offline_access'
                })
            });
        } else {
            // Direct request to Cegid API
            tokenResponse = await fetch(config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'password',
                    client_id: config.clientId,
                    username: config.username,
                    password: config.password,
                    scope: 'RetailBackendApi offline_access'
                })
            });
        }

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        
        // Cache the token
        accessToken = tokenData.access_token;
        // Set expiry to 5 minutes before actual expiry for safety
        const expiresIn = (tokenData.expires_in || 3600) - 300;
        tokenExpiry = Date.now() + (expiresIn * 1000);

        console.log('Access token acquired successfully', config.useProxy ? '(via proxy)' : '(direct)');
        return accessToken;

    } catch (error) {
        console.error('Error acquiring access token:', error);
        if (config.useProxy && error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to proxy server. Make sure it is running on http://localhost:3000');
        }
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

// Add to Order function - Posts to Cegid External Basket API
async function addToOrder() {
    if (!selectedOrderId) {
        showNotification('Please select an order first', 'error');
        return;
    }

    // Check if configuration is complete
    if (!config.username || !config.password || !config.storeId || !config.warehouseId) {
        showNotification('Please configure username, password, store ID and warehouse ID first', 'error');
        openConfigModal();
        return;
    }
    
    const order = orders.find(o => o.id === selectedOrderId);
    
    try {
        showLoadingOverlay();
        
        // Step 1: Acquire OAuth2 access token
        let token;
        try {
            token = await getAccessToken();
        } catch (authError) {
            throw new Error(`Authentication failed: ${authError.message}`);
        }
        
        // Step 2: Build the External Basket API payload
        const basketPayload = {
            externalReference: order.id,
            basketType: "RECEIPT",
            itemLines: order.items.map((item, index) => ({
                itemLineId: index + 1,
                item: {
                    itemCode: item.sku
                },
                quantity: item.qty,
                price: {
                    basePrice: item.price,
                    currentPrice: item.price
                },
                lineAmount: {
                    currency: config.currency,
                    value: item.price * item.qty
                },
                inventoryOrigin: {
                    warehouseId: config.warehouseId
                }
            })),
            store: {
                storeId: config.storeId
            }
        };

        console.log('Sending basket payload:', basketPayload);

        // Step 3: Call the Cegid External Basket API with Bearer token
        // Note: config.apiBaseUrl already includes the full path including /external-basket
        let response;
        
        if (config.useProxy) {
            // Use local CORS proxy
            response = await fetch(`${config.proxyApiBaseUrl}/external-basket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiBaseUrl: config.apiBaseUrl,
                    token: token,
                    ...basketPayload
                })
            });
        } else {
            // Direct request to Cegid API - do NOT append /external-basket
            response = await fetch(config.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(basketPayload)
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Step 4: Extract redirect URL from the response
        const redirectUrl = data.externalBasketUrl;
        const basketId = data.externalBasketId;
        
        if (!redirectUrl || !basketId) {
            console.error('API Response:', data);
            throw new Error('Missing externalBasketUrl or externalBasketId in API response');
        }

        console.log('Basket created successfully:', {
            externalBasketId: basketId,
            externalBasketUrl: redirectUrl,
            orderId: order.id,
            fullResponse: data
        });

        // Step 5: Redirect to LiveStore POS using the URL provided by the API
        hideLoadingOverlay();
        showNotification(`Order ${order.id} processed successfully! Redirecting to LiveStore...`, 'success');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);

    } catch (error) {
        hideLoadingOverlay();
        console.error('Error processing order:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Loading Overlay
function showLoadingOverlay() {
    loadingOverlay.style.display = 'flex';
}

function hideLoadingOverlay() {
    loadingOverlay.style.display = 'none';
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Mock data for testing
function useMockData() {
    const mockApiResponse = {
        "orders": [
            {
                "id": "3901234567",
                "customer_name": "Alice Johnson",
                "timestamp": "2025-01-15T10:24:30Z",
                "items": [
                    {
                        "id": "1256347801",
                        "sku": "MW0MW10800C1Z",
                        "product_name": "Slim Jersey Crew Neck T-Shirt",
                        "price": 40.00,
                        "qty": 2,
                        "thumbnail": "https://tommy-europe.scene7.com/is/image/TommyEurope/MW0MW10800_C1Z_productswatch"
                    },
                    {
                        "id": "1256347802",
                        "sku": "DW0DW224541BK",
                        "product_name": "Sylvia High Rise Flared Jeans",
                        "price": 85.00,
                        "qty": 1,
                        "thumbnail": "https://tommy-europe.scene7.com/is/image/TommyEurope/DW0DW22454_1BK_productswatch"
                    }
                ]
            },
            {
                "id": "3901234570",
                "customer_name": "Brian Smith",
                "timestamp": "2025-01-15T11:05:10Z",
                "items": [
                    {
                        "id": "1256347810",
                        "sku": "MW0MW11599L6K",
                        "product_name": "Logo Embroidery Flex Fleece Hoody",
                        "price": 110.00,
                        "qty": 1,
                        "thumbnail": "https://tommy-europe.scene7.com/is/image/TommyEurope/MW0MW11599_L6K_productswatch"
                    },
                    {
                        "id": "1256347811",
                        "sku": "AM0AM12020C1G",
                        "product_name": "Heritage Logo Baseball Cap",
                        "price": 28.00,
                        "qty": 1,
                        "thumbnail": "https://tommy-europe.scene7.com/is/image/TommyEurope/AM0AM12020_C1G_productswatch"
                    },
                    {
                        "id": "1256347812",
                        "sku": "08A1371111085",
                        "product_name": "2-Pack Classic Flag Embroidery Socks",
                        "price": 14.00,
                        "qty": 2,
                        "thumbnail": "https://tommy-europe.scene7.com/is/image/TommyEurope/08A1371111_085_productswatch"
                    }
                ]
            },
            {
                "id": "3901234575",
                "customer_name": "Carla Reyes",
                "timestamp": "2025-01-15T12:40:55Z",
                "items": [
                    {
                        "id": "UKC002                           X",
                        "sku": "UKC002                           X",
                        "product_name": "Cegid Woolly Hat",
                        "price": 20.00,
                        "qty": 1,
                        "thumbnail": "https://tommy-europe.scene7.com/is/image/TommyEurope/MW0MW38905_DW5_productswatch"
                    }
                ]
            }
        ]
    };
    
    orders = parseOrdersData(mockApiResponse);
    renderOrderList();
}
