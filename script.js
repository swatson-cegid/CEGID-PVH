// State
let orders = [];
let selectedOrderId = null;

// Configuration - Update these with your Cegid credentials
const CONFIG = {
    environment: 'p'
    tokenUrl: 'https://integration-retail-services.cegid.cloud/p/as/connect/token',
    basketUrl: 'https://integration-retail-services.cegid.cloud/p/api/external-basket',
    liveStorePosUrl: 'https://integration-retail-services.cegid.cloud/p/pos/', // Update with actual LiveStore POS URL
    
    // Auth credentials
    clientId: 'CegidRetailResourceFlowClient',
    username: 'SWA@PSR_UK2', 
    password: 'Cegid.2020', // Replace with actual password
    grantType: 'password',
    scope: 'RetailBackendApi offline_access',
    
    // Store configuration
    storeId: 'UK201', // Replace with actual store ID
    warehouseId: 'UK201', // Replace with actual warehouse ID
    currency: 'GBP' 
};

// DOM Elements
const orderListEl = document.getElementById('order-list');
const orderDetailsEl = document.getElementById('order-details');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    useMockData();
});

// Parse the order structure
function parseOrdersData(data) {
    const parsedOrders = [];
    
    // Handle the structure: {"orders": [...]}
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
        
        // Create an entry for the order with all items
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
        orderListEl.innerHTML = '<p class="placeholder">No orders found.</p>';
        return;
    }
    
    orderListEl.innerHTML = '';
    
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
    
    div.innerHTML = `
        <div class="order-item-info">
            <div class="order-item-id">${order.id}</div>
            <div class="order-item-name">${order.customerName}</div>
            <div class="order-item-meta">${order.itemCount} item(s) • $${order.total.toFixed(2)}</div>
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
    
    order.items.forEach(item => {
        const itemTotal = item.price * item.qty;
        itemsHtml += `
            <div class="item-row">
                <img src="${item.thumbnail}" alt="${item.product_name}" class="item-thumbnail" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect fill=%22%23ddd%22 width=%2280%22 height=%2280%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2212%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                <div class="item-info">
                    <div class="item-id">${item.id}</div>
                    <div class="item-name">${item.product_name}</div>
                    <div class="item-sku">SKU: ${item.sku}</div>
                </div>
                <div class="item-details">
                    <span>$${item.price.toFixed(2)} × ${item.qty}</span>
                    <span class="item-total">$${itemTotal.toFixed(2)}</span>
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
                <h3>${order.id}</h3>
                <p class="customer-name">${order.customerName}</p>
                <p class="order-timestamp">${formattedDate}</p>
            </div>
            
            <div class="items-section">
                <h4>Items (${order.itemCount})</h4>
                ${itemsHtml}
            </div>
            
            <div class="order-total-section">
                <div class="detail-row total-row">
                    <span class="detail-label">Total Amount:</span>
                    <span class="detail-value total">$${order.total.toFixed(2)}</span>
                </div>
            </div>
            
            <button class="add-to-order-btn" onclick="addToOrder()">Add to Order</button>
        </div>
    `;
}

// Get Access Token from Cegid
async function getCegidAccessToken() {
    const tokenUrl = CONFIG.tokenUrl.replace('{{environment}}', CONFIG.environment);
    
    const body = new URLSearchParams({
        client_id: CONFIG.clientId,
        username: CONFIG.username,
        password: CONFIG.password,
        grant_type: CONFIG.grantType,
        scope: CONFIG.scope
    });
    
    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

// Create External Basket in Cegid
async function createExternalBasket(order, accessToken) {
    const basketUrl = CONFIG.basketUrl.replace('{{environment}}', CONFIG.environment);
    
    // Build item lines from order items
    const itemLines = order.items.map((item, index) => ({
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
            currency: CONFIG.currency,
            value: item.price * item.qty
        },
        inventoryOrigin: {
            warehouseId: CONFIG.warehouseId
        }
    }));
    
    // Build the basket payload
    const basketPayload = {
        externalReference: order.id,
        basketType: "RECEIPT",
        itemLines: itemLines,
        store: {
            storeId: CONFIG.storeId
        }
    };
    
    try {
        const response = await fetch(basketUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(basketPayload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Basket creation failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        return data.basketUuid; // Return the basket UUID
    } catch (error) {
        console.error('Error creating basket:', error);
        throw error;
    }
}

// Redirect to LiveStore POS
function redirectToLiveStorePOS(basketUuid) {
    // Build the LiveStore POS URL with the basket UUID
    const posUrl = `${CONFIG.liveStorePosUrl}?basketId=${basketUuid}`;
    
    console.log('Redirecting to LiveStore POS:', posUrl);
    
    // Redirect to the POS system
    window.location.href = posUrl;
}

// Add to Order function - Main integration logic
async function addToOrder() {
    if (!selectedOrderId) {
        alert('Please select an order first');
        return;
    }
    
    const order = orders.find(o => o.id === selectedOrderId);
    
    // Validate configuration
    if (!CONFIG.username.includes('@') || CONFIG.username.includes('{{')) {
        alert('⚠️ Please update the CONFIG object with your Cegid credentials in the script.');
        console.error('Configuration error: Please set username, password, storeId, warehouseId, and other required fields in CONFIG object');
        return;
    }
    
    // Show loading state
    const button = document.querySelector('.add-to-order-btn');
    const originalText = button.textContent;
    button.textContent = 'Processing...';
    button.disabled = true;
    
    try {
        console.log('Step 1: Getting access token...');
        const accessToken = await getCegidAccessToken();
        console.log('Access token obtained successfully');
        
        console.log('Step 2: Creating external basket...');
        const basketUuid = await createExternalBasket(order, accessToken);
        console.log('Basket created successfully. UUID:', basketUuid);
        
        console.log('Step 3: Redirecting to LiveStore POS...');
        redirectToLiveStorePOS(basketUuid);
        
    } catch (error) {
        console.error('Error in addToOrder:', error);
        alert(`❌ Error: ${error.message}\n\nPlease check the console for more details and ensure your configuration is correct.`);
        
        // Restore button
        button.textContent = originalText;
        button.disabled = false;
    }
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
                        "id": "1256347890",
                        "sku": "MW0MW38905DW5",
                        "product_name": "Logo Patch Hooded Jacket",
                        "price": 138.00,
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
