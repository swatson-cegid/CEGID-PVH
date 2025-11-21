// Configuration - POS Integration
const POS_API_ENDPOINT = 'https://YOUR-POS-SYSTEM.com/api/add-order'; // Update with your POS endpoint

// State
let orders = [];
let selectedOrderId = null;

// DOM Elements
const orderListEl = document.getElementById('order-list');
const orderDetailsEl = document.getElementById('order-details');

// Initialize - Load mock data on page load
document.addEventListener('DOMContentLoaded', () => {
    useMockData();
});

// Parse the order structure from mock data
function parseOrdersData(data) {
    const parsedOrders = [];
    
    // Handle the structure: {"orders": [...]}
    const ordersList = data.orders || data;
    
    ordersList.forEach(order => {
        const orderId = order.id;
        const customerName = order.customer_name;
        const items = order.items || [];
        
        // Calculate total for the order
        const orderTotal = items.reduce((sum, item) => {
            return sum + (item.price * item.qty);
        }, 0);
        
        // Create an entry for the order with all items
        parsedOrders.push({
            id: orderId,
            customerName: customerName,
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
                <div class="item-info">
                    <div class="item-id">${item.id}</div>
                    <div class="item-name">${item.product_name}</div>
                </div>
                <div class="item-details">
                    <span>$${item.price.toFixed(2)} × ${item.qty}</span>
                    <span class="item-total">$${itemTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });
    
    orderDetailsEl.innerHTML = `
        <div class="order-details-content">
            <div class="order-header">
                <h3>${order.id}</h3>
                <p class="customer-name">${order.customerName}</p>
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

// Add to Order function - Sends order to POS system
function addToOrder() {
    if (!selectedOrderId) {
        alert('Please select an order first');
        return;
    }
    
    const order = orders.find(o => o.id === selectedOrderId);
    
    // Disable button during processing
    const button = document.querySelector('.add-to-order-btn');
    if (button) {
        button.disabled = true;
        button.textContent = 'Processing...';
    }
    
    // Log to console for debugging
    console.log('Adding to POS:', order);
    
    // UNCOMMENT AND CONFIGURE FOR PRODUCTION POS INTEGRATION:
    /*
    fetch(POS_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Add authentication if required:
            // 'Authorization': 'Bearer YOUR-API-KEY',
            // 'X-API-Key': 'YOUR-API-KEY'
        },
        body: JSON.stringify({
            orderId: order.id,
            customerName: order.customerName,
            items: order.items,
            total: order.total,
            timestamp: new Date().toISOString()
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('POS Response:', data);
        alert(`✓ Order ${order.id} added to POS successfully!\nPOS Order ID: ${data.posOrderId || 'N/A'}`);
    })
    .catch((error) => {
        console.error('Error adding to POS:', error);
        alert(`Failed to add order to POS: ${error.message}`);
    })
    .finally(() => {
        // Re-enable button
        if (button) {
            button.disabled = false;
            button.textContent = 'Add to Order';
        }
    });
    */
    
    // MOCK SUCCESS (Remove this when using real POS API)
    setTimeout(() => {
        alert(`✓ Order ${order.id} for ${order.customerName} added to POS!\n\nTotal: $${order.total.toFixed(2)}\nItems: ${order.itemCount}`);
        
        // Re-enable button
        if (button) {
            button.disabled = false;
            button.textContent = 'Add to Order';
        }
    }, 1000);
}

// Mock data for testing
function useMockData() {
    const mockApiResponse = {
        "orders": [
            {
                "id": "ORD-1001",
                "customer_name": "Alice Johnson",
                "items": [
                    {
                        "id": "ITEM-001",
                        "product_name": "Cotton T-Shirt",
                        "price": 12.99,
                        "qty": 2
                    },
                    {
                        "id": "ITEM-002",
                        "product_name": "Denim Jeans",
                        "price": 39.99,
                        "qty": 1
                    }
                ]
            },
            {
                "id": "ORD-1002",
                "customer_name": "Brian Smith",
                "items": [
                    {
                        "id": "ITEM-010",
                        "product_name": "Hoodie",
                        "price": 29.99,
                        "qty": 1
                    },
                    {
                        "id": "ITEM-011",
                        "product_name": "Baseball Cap",
                        "price": 14.50,
                        "qty": 1
                    },
                    {
                        "id": "ITEM-012",
                        "product_name": "Athletic Socks (3-Pack)",
                        "price": 9.99,
                        "qty": 2
                    }
                ]
            },
            {
                "id": "ORD-1003",
                "customer_name": "Carla Reyes",
                "items": [
                    {
                        "id": "ITEM-020",
                        "product_name": "Lightweight Jacket",
                        "price": 49.99,
                        "qty": 1
                    }
                ]
            }
        ]
    };
    
    orders = parseOrdersData(mockApiResponse);
    renderOrderList();
}
