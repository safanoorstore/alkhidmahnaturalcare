// ===== GLOBAL CONFIG =====
const CONFIG = {
    siteName: "Alkhidmah Natural Care Branch",
    phone: "01949805239",
    whatsapp: "01949805239",
    email: "alkhidmahnturalcarebranch@gmail.com",
    currency: "৳"
};

// ===== CART MANAGEMENT =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

function addToCart(product) {
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Show notification
    showNotification(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
}

function updateQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace(/[৳,]/g, ''));
        return total + (price * item.quantity);
    }, 0);
}

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query) {
        // Store search query and redirect to products page
        localStorage.setItem('searchQuery', query);
        window.location.href = 'products.html';
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#1a6d2c' : '#ff4757'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 15px;
        animation: slideIn 0.3s ease;
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// ===== IMAGE GALLERY =====
function initializeImageGallery(images) {
    const galleryContainer = document.getElementById('productGallery');
    if (!galleryContainer) return;
    
    galleryContainer.innerHTML = '';
    
    // Main image
    const mainImg = document.createElement('div');
    mainImg.className = 'gallery-main';
    mainImg.innerHTML = `<img src="images/products/${images[0]}" id="mainImage" alt="Product Image">`;
    
    // Thumbnails
    const thumbnails = document.createElement('div');
    thumbnails.className = 'gallery-thumbnails';
    
    images.forEach((img, index) => {
        const thumb = document.createElement('img');
        thumb.src = `images/products/${img}`;
        thumb.alt = `Thumbnail ${index + 1}`;
        thumb.onclick = () => {
            document.getElementById('mainImage').src = thumb.src;
            // Update active thumbnail
            document.querySelectorAll('.gallery-thumbnails img').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        };
        if (index === 0) thumb.classList.add('active');
        thumbnails.appendChild(thumb);
    });
    
    galleryContainer.appendChild(mainImg);
    galleryContainer.appendChild(thumbnails);
}

// ===== FORM VALIDATION =====
function validateCheckoutForm() {
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!name) {
        showNotification('Please enter your name', 'error');
        return false;
    }
    
    if (!address) {
        showNotification('Please enter your address', 'error');
        return false;
    }
    
    if (!mobile) {
        showNotification('Please enter your mobile number', 'error');
        return false;
    }
    
    if (mobile.length !== 11 || !/^01[3-9]\d{8}$/.test(mobile)) {
        showNotification('Please enter a valid Bangladeshi mobile number', 'error');
        return false;
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

// ===== UTILITY FUNCTIONS =====
function formatPrice(price) {
    return `${CONFIG.currency} ${parseInt(price).toLocaleString('bn-BD')}`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Update cart count on all pages
    updateCartCount();
    
    // Initialize search
    initializeSearch();
    
    // Load featured products on homepage
    if (document.getElementById('featuredProducts')) {
        loadFeaturedProducts();
    }
    
    // Add to cart buttons
    document.querySelectorAll('.btn-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.id;
            // This would be replaced with actual product data
            const product = {
                id: productId,
                name: this.dataset.name,
                price: this.dataset.price
            };
            addToCart(product);
        });
    });
    
    // Admin panel initialization
    if (window.location.pathname.includes('admin.html')) {
        initializeAdminPanel();
    }
});

// ===== PRODUCT LOADING =====
async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

async function loadFeaturedProducts() {
    const products = await loadProducts();
    const container = document.getElementById('featuredProducts');
    
    if (!container) return;
    
    // Take first 8 products as featured
    const featured = products.slice(0, 8);
    
    container.innerHTML = featured.map(product => `
        <div class="product-card">
            <div class="product-img-container">
                <img src="images/products/${product.images[0] || 'default.jpg'}" 
                     alt="${product.name}" 
                     class="product-img">
                <span class="product-badge">নতুন</span>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 80)}...</p>
                <p class="product-price">${product.price}</p>
                <div class="product-actions">
                    <button class="btn-cart" 
                            data-id="${product.id}"
                            data-name="${product.name}"
                            data-price="${product.price}">
                        <i class="fas fa-cart-plus"></i> কার্টে যোগ
                    </button>
                    <button class="btn-view" onclick="window.location.href='product-details.html?id=${product.id}'">
                        <i class="fas fa-eye"></i> বিস্তারিত
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}