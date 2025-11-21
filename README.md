# POS POC - Point of Sale Proof of Concept

A simple static website that displays and manages orders from an API endpoint, designed to integrate with POS systems.

## Features

- **Auto-Loading Order List**: Automatically fetches and displays orders from the API endpoint
- **Order Details**: Shows detailed information including customer name, items, quantities, and prices
- **Add to Order**: Sends selected order to POS system via POST request
- **Auto-Refresh**: Refreshes order list every 30 seconds
- **Responsive Design**: Works on desktop and mobile devices
- **GitHub Pages Ready**: Can be hosted on GitHub Pages for easy POS integration

## Quick Start

### Option 1: Local Testing

1. **Clone or download this repository**

2. **Run locally**:
   ```bash
   # Navigate to the pos-poc folder
   cd pos-poc
   
   # Start a local server
   python3 -m http.server 8080
   ```
   
4. **Open in browser**: `http://localhost:8080`

### Option 2: Deploy to GitHub Pages

1. **Create a GitHub Repository**:
   - Go to GitHub and create a new repository (e.g., `pos-poc`)
   - Initialize without README (we already have one)

2. **Push your code**:
   ```bash
   cd pos-poc
   git init
   git add .
   git commit -m "Initial POS POC commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/pos-poc.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **main** branch
   - Click **Save**
   - Your site will be available at: `https://YOUR-USERNAME.github.io/pos-poc/`

4. **Update POS Configuration** (Optional):
   - Edit `script.js` in your repository
   - Update the `POS_API_ENDPOINT` constant with your POS system URL
   - Uncomment the POS integration code in the `addToOrder()` function
   - Commit and push changes

## POS Integration

### Using the Hosted Page in POS System

Once deployed to GitHub Pages, you can integrate it into your POS system:

#### Method 1: iFrame Integration
```html
<!-- Embed in your POS dashboard -->
<iframe 
    src="https://YOUR-USERNAME.github.io/pos-poc/" 
    width="100%" 
    height="800px" 
    frameborder="0">
</iframe>
```

#### Method 2: Direct Link
```html
<!-- Open in new window/tab -->
<a href="https://YOUR-USERNAME.github.io/pos-poc/" target="_blank">
    View Orders
</a>
```

#### Method 3: WebView (Mobile POS)
```javascript
// For mobile POS apps
const webView = new WebView();
webView.loadUrl('https://YOUR-USERNAME.github.io/pos-poc/');
```

### Configuring "Add to Order" for POS

The "Add to Order" button sends the selected order to your POS system. Update the endpoint in `script.js`:

```javascript
// In the addToOrder() function, uncomment and configure:
fetch('https://YOUR-POS-SYSTEM.com/api/add-order', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR-API-KEY' // If needed
    },
    body: JSON.stringify({
        orderId: order.id,
        customerName: order.customerName,
        items: order.items,
        total: order.total
    })
})
.then(response => response.json())
.then(data => {
    alert('Order added to POS successfully!');
    console.log('Success:', data);
})
.catch((error) => {
    alert('Error adding order to POS');
    console.error('Error:', error);
});
```

### POS Endpoint Requirements

Your POS system should accept POST requests with this structure:

**Endpoint**: `POST /api/add-order`

**Request Body**:
```json
{
  "orderId": "ORD-1001",
  "customerName": "Alice Johnson",
  "items": [
    {
      "id": "ITEM-001",
      "product_name": "Cotton T-Shirt",
      "price": 12.99,
      "qty": 2
    }
  ],
  "total": 65.97
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Order added successfully",
  "posOrderId": "POS-12345"
}
```

## Mock Data

This POC uses mock data by default. The sample data includes:
- 3 orders (ORD-1001, ORD-1002, ORD-1003)
- Multiple items per order with quantities and prices
- Customer names and calculated totals

To modify the mock data, edit the `useMockData()` function in `script.js`.

### CORS Configuration (For POS Integration)

If your POS API is on a different domain, ensure CORS is enabled:

```javascript
// Example server-side CORS headers
Access-Control-Allow-Origin: https://YOUR-USERNAME.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## File Structure

```
pos-poc/
├── index.html      # Main HTML structure
├── styles.css      # All styling
├── script.js       # JavaScript logic and API calls
└── README.md       # This file
```

## Customization

### Change Colors
Edit `styles.css`:
- Header/Footer: `#2c3e50`
- Primary Button: `#3498db`
- Success Color: `#27ae60`

### Update Mock Data
Edit the `useMockData()` function in `script.js` to test with different data.

## Testing Workflow

1. **Test Locally**: Use mock data to verify UI and functionality
2. **Test POS Integration**: Update POS endpoint and test "Add to Order"
3. **Deploy to GitHub Pages**: Make it accessible to POS systems
4. **Integrate with POS**: Embed in your POS system using iframe or link

## Security Considerations

- **API Keys**: Don't commit API keys to GitHub. Use environment variables or server-side proxy
- **HTTPS**: Always use HTTPS for API endpoints
- **Authentication**: Implement proper authentication for POS endpoints
- **Rate Limiting**: Implement rate limiting on your API

## Troubleshooting

### "Add to Order" Not Working
- Verify POS endpoint URL is correct
- Check network tab in browser dev tools
- Ensure POS API accepts the request format
- Check for CORS issues

### GitHub Pages Not Updating
- Wait 1-2 minutes after pushing changes
- Clear browser cache
- Check GitHub Actions for build status

## Browser Support

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## License

This is a proof of concept. Modify as needed for your use case.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Test with mock data first
4. Check CORS configuration