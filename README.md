# README.md

# POS POC – Static Order Listing Website

This repository contains a **static website** used as part of a **Proof of Concept (POC) / Template** for evaluating POS (Point-of-Sale) integration capabilities.
The site displays a simple list of sample orders and provides a **“Add to Order”** call-to-action (CTA) that POS vendors can customize to integrate with their own transaction flows.

The reference site is also hosted here for preview:
**[https://nithins1989.github.io/pos-poc/](https://nithins1989.github.io/pos-poc/)**

---

## 🚀 Purpose of This POC/Template

Many POS platforms need to embed or load external web experiences in order to enhance workflows—e.g., importing orders or add-on transactions from a vendor site.

This POC/Template demonstrates:

* Serving a simple static website from GitHub Pages or AWS.
* Displaying a list of orders.
* Allowing the POS to trigger its transaction API when the user clicks **Add to Order**.
* Enabling the POS vendor to pull, modify, host, and integrate this site with minimal effort.

Vendors can adopt this as a **template**, perform required code changes, and host it on their own infrastructure.

---

## 🗂️ Repository Structure

```
/
├── index.html          # Main page with UI and order listing
├── styles.css          # Basic styling
├── scripts.js          # Logic for Add-to-Order CTA and sample data
├── assets/             # (Optional) images or static assets
└── README.md           # This file
```

---

## 🛠️ What Vendors Need to Modify

### 1. **Add-to-Order CTA Logic**

In `scripts.js`, the function handling the “Add to Order” button is intentionally generic.
Vendors must update this code to:

* Call their internal POS transaction API
* Pass required order identifiers or metadata
* Handle the callback or response as needed
* Trigger any required messaging back to the POS or parent frame

Example placeholder (for vendor modification):

```javascript
// Add to Order function
function addToOrder() {
    if (!selectedOrderId) {
        alert('Please select an order first');
        return;
    }
    
    const order = orders.find(o => o.id === selectedOrderId);
    
    // Here you can add your logic to POST to an endpoint
    console.log('Adding to order:', order);
    alert(`Order ${selectedOrderId} for ${order.customerName} added successfully!`);
    
    // Example POST request (uncomment and modify as needed):
    /*
    fetch('https://X/test/add-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
    })
    .then(response => response.json())
    .then(data => {
        alert('Order added successfully!');
        console.log('Success:', data);
    })
    .catch((error) => {
        alert('Error adding order');
        console.error('Error:', error);
    });
    */
}
```

---

## 📥 How to Use This Template

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/nithins1989/pos-poc.git
```

Or download it as a ZIP from GitHub.

### **Step 2: Apply Vendor-Specific Changes**

Modify:

* `scripts.js` → Add-to-order integration logic
* `index.html` → Optionally customize UI or styling
* `styles.css` → Apply brand styling if desired

### **Step 3: Host the Website**

Vendors may host the modified site in:

---

## ☁️ Hosting Options

### **Option A: GitHub Pages**

1. Push the modified repository to your organization’s GitHub account.
2. Go to **Settings → Pages**.
3. Select the **main branch / root** folder.
4. Save.

GitHub will provide a deployment URL like:

```
https://<your-org>.github.io/<your-repo>/
```

---

### **Option B: AWS S3 + CloudFront**

1. Create an S3 bucket configured for **static website hosting**.
2. Upload all files from the repository.
3. Enable public access (or restrict to POS IPs).
4. Optionally place CloudFront in front for CDN distribution.
5. Map your custom domain if required.

Example S3 upload command:

```bash
aws s3 sync . s3://your-bucket-name --acl public-read
```

---

### **Option C: Any Static Hosting Platform**

This site is fully static → works with:

* Netlify
* Vercel
* Azure Static Web Apps
* Firebase Hosting
* Nginx/Apache static hosting

---

## 🧪 Testing the Integration

POS vendors should:

1. Load the page inside their POS system (iframe, webview, in-app browser, etc.).
2. Verify that **Add to Order** triggers the correct POS workflow.
3. Confirm order IDs or payloads are passed correctly.
4. Log, debug, and validate any transaction-related responses.

---

## 📄 License

This POC template is provided for evaluation and integration purposes.
Vendors may clone, modify, and host their own version as required.
