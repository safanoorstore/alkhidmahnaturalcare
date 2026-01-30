// ===== ADMIN PANEL FUNCTIONS =====

// Product Management
let products = [];
let editingProductId = null;

// Initialize Admin Panel
function initializeAdminPanel() {
    loadAdminProducts();
    updateAdminStats();
    setupEventListeners();
    
    // Show dashboard by default
    showSection('dashboard');
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    // Product search
    document.getElementById('adminSearch').addEventListener('input', 
        debounce(searchProducts, 300)
    );
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
    
    // Add active class to clicked nav link
    document.querySelector(`.admin-nav a[href="#${sectionId}"]`).classList.add('active');
    
    // Refresh data if needed
    if (sectionId === 'products') {
        loadAdminProducts();
    } else if (sectionId === 'orders') {
        loadOrders();
    }
}

// Load products for admin
async function loadAdminProducts() {
    try {
        const response = await fetch('data/products.json');
        products = await response.json();
        renderProductTable();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'error');
    }
}

// Render product table
function renderProductTable(filteredProducts = null) {
    const tableBody = document.getElementById('productTable');
    const data = filteredProducts || products;
    
    tableBody.innerHTML = data.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <strong>${product.name}</strong><br>
                <small class="text-muted">${product.description.substring(0, 50)}...</small>
            </td>
            <td><span class="category-badge">${product.category}</span></td>
            <td>${product.price}</td>
            <td>
                <div class="product-images-small">
                    ${product.images.slice(0, 2).map(img => `
                        <img src="images/products/${img}" alt="Image">
                    `).join('')}
                    ${product.images.length > 2 ? '<span>+1</span>' : ''}
                </div>
            </td>
            <td>
                <button class="btn-sm btn-primary" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update stats
    document.getElementById('totalProducts').textContent = products.length;
}

// Search products
function searchProducts() {
    const query = document.getElementById('adminSearch').value.toLowerCase();
    
    if (!query) {
        renderProductTable();
        return;
    }
    
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
    
    renderProductTable(filtered);
}

// Add new product
function addProduct() {
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value;
    
    // Validate
    if (!name || !category || !price) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Check image uploads
    const image1 = document.getElementById('imageInput1').files[0];
    const image2 = document.getElementById('imageInput2').files[0];
    const image3 = document.getElementById('imageInput3').files[0];
    
    if (!image1) {
        showNotification('Please upload at least first image', 'error');
        return;
    }
    
    // Create new product object
    const newProduct = {
        id: Date.now(), // Generate unique ID
        name: name,
        category: category,
        price: `৳ ${parseInt(price).toLocaleString('bn-BD')}`,
        description: description,
        images: [
            `product_${Date.now()}/1.jpg`,
            `product_${Date.now()}/2.jpg`,
            `product_${Date.now()}/3.jpg`
        ],
        dateAdded: new Date().toISOString()
    };
    
    // Add to products array
    products.push(newProduct);
    
    // Update JSON file (in real scenario, this would be a server call)
    updateProductsJSON();
    
    // Clear form
    document.getElementById('productForm').reset();
    document.getElementById('preview1').style.display = 'none';
    document.getElementById('preview2').style.display = 'none';
    document.getElementById('preview3').style.display = 'none';
    
    // Update table
    renderProductTable();
    
    showNotification('Product added successfully!', 'success');
}

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    
    // Fill form with product data
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = parseInt(product.price.replace(/[৳,]/g, ''));
    document.getElementById('productDescription').value = product.description;
    
    // Change button text
    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Product';
    submitBtn.onclick = function(e) {
        e.preventDefault();
        updateProduct();
    };
    
    // Scroll to form
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Editing product...', 'info');
}

// Update product
function updateProduct() {
    if (!editingProductId) return;
    
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value;
    
    // Find and update product
    const productIndex = products.findIndex(p => p.id === editingProductId);
    if (productIndex !== -1) {
        products[productIndex] = {
            ...products[productIndex],
            name,
            category,
            price: `৳ ${parseInt(price).toLocaleString('bn-BD')}`,
            description
        };
        
        // Update JSON
        updateProductsJSON();
        
        // Reset form
        editingProductId = null;
        document.getElementById('productForm').reset();
        
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
        submitBtn.onclick = function(e) {
            e.preventDefault();
            addProduct();
        };
        
        // Update table
        renderProductTable();
        
        showNotification('Product updated successfully!', 'success');
    }
}

// Delete product
function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    // Remove from products array
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        products.splice(productIndex, 1);
        
        // Update JSON
        updateProductsJSON();
        
        // Update table
        renderProductTable();
        
        showNotification('Product deleted successfully!', 'success');
    }
}

// Update products.json file
function updateProductsJSON() {
    // In a real application, this would be a server API call
    // For local demo, we'll update localStorage
    localStorage.setItem('products_backup', JSON.stringify(products));
    
    // Note: In production, you would need a server-side script
    // to actually update the JSON file
    console.log('Products updated (in production, this would save to server)');
}

// Image preview
function previewImage(input, previewId) {
    const preview = document.getElementById(`preview${previewId}`);
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        
        reader.readAsDataURL(file);
    }
}

// Load orders
function loadOrders() {
    // In a real app, this would fetch from server
    // For demo, we'll use dummy data
    const orders = [
        {
            id: 'ORD-1001',
            customer: 'আরিফ রহমান',
            mobile: '01949805239',
            items: 2,
            total: '৳ 2,300',
            status: 'pending',
            date: '2026-01-30'
        },
        {
            id: 'ORD-1002',
            customer: 'সাদিয়া ইসলাম',
            mobile: '01712345678',
            items: 1,
            total: '৳ 1,200',
            status: 'completed',
            date: '2026-01-29'
        }
    ];
    
    const tableBody = document.getElementById('orderTable');
    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.mobile}</td>
            <td>${order.items} items</td>
            <td>${order.total}</td>
            <td><span class="status ${order.status}">${order.status}</span></td>
            <td>${order.date}</td>
            <td>
                <button class="btn-sm btn-success" onclick="updateOrderStatus('${order.id}', 'completed')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-sm btn-danger" onclick="updateOrderStatus('${order.id}', 'cancelled')">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update order status
function updateOrderStatus(orderId, status) {
    // In real app, send to server
    showNotification(`Order ${orderId} marked as ${status}`, 'success');
    
    // Reload orders
    setTimeout(loadOrders, 500);
}

// Save settings
function saveSettings() {
    const siteName = document.getElementById('siteName').value;
    const contactPhone = document.getElementById('contactPhone').value;
    const contactEmail = document.getElementById('contactEmail').value;
    const whatsappNumber = document.getElementById('whatsappNumber').value;
    const siteAddress = document.getElementById('siteAddress').value;
    
    // Save to localStorage (in production, save to server)
    const settings = {
        siteName,
        contactPhone,
        contactEmail,
        whatsappNumber,
        siteAddress,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('site_settings', JSON.stringify(settings));
    
    showNotification('Settings saved successfully!', 'success');
    
    // Update last login time
    document.getElementById('lastLogin').textContent = 
        new Date().toLocaleString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
}

// Update admin stats
function updateAdminStats() {
    // Total products
    document.getElementById('totalProducts').textContent = products.length;
    
    // Total orders (dummy data)
    document.getElementById('totalOrders').textContent = '42';
    
    // Total revenue (dummy data)
    document.getElementById('totalRevenue').textContent = '৳ 1,25,400';
    
    // Pending orders (dummy data)
    document.getElementById('pendingOrders').textContent = '8';
}

// Load saved settings
function loadSettings() {
    const saved = JSON.parse(localStorage.getItem('site_settings'));
    if (saved) {
        document.getElementById('siteName').value = saved.siteName || '';
        document.getElementById('contactPhone').value = saved.contactPhone || '';
        document.getElementById('contactEmail').value = saved.contactEmail || '';
        document.getElementById('whatsappNumber').value = saved.whatsappNumber || '';
        document.getElementById('siteAddress').value = saved.siteAddress || '';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        initializeAdminPanel();
        loadSettings();
    }
});