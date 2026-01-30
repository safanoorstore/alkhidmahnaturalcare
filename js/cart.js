// ===== CART PAGE FUNCTIONS =====

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    loadCartItems();
    loadRecommendedProducts();
    updateCartSummary();
});

// Load cart items
function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    
    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        container.innerHTML = '';
        container.appendChild(emptyCart);
        return;
    }
    
    emptyCart.style.display = 'none';
    
    // Load product data
    fetch('data/products.json')
        .then(response => response.json())
        .then(products => {
            const cartItems = cart.map(cartItem => {
                const product = products.find(p => p.id === cartItem.id);
                return { ...product, quantity: cartItem.quantity };
            });
            
            renderCartItems(cartItems);
        })
        .catch(error => {
            console.error('Error loading cart items:', error);
            container.innerHTML = '<p class="error">কার্ট লোড করতে সমস্যা হয়েছে</p>';
        });
}

// Render cart items
function renderCartItems(cartItems) {
    const container = document.getElementById('cartItems');
    
    container.innerHTML = cartItems.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="images/products/${item.images[0] || 'default.jpg'}" 
                 alt="${item.name}" 
                 class="cart-item-img">
            
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${item.category}</p>
                <p class="cart-item-price">${item.price}</p>
            </div>
            
            <div class="cart-item-actions">
                <div class="quantity-control">
                    <button class="quantity-btn minus" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" 
                           class="quantity-input" 
                           value="${item.quantity}" 
                           min="1" 
                           onchange="updateQuantity(${item.id}, this.value)">
                    <button class="quantity-btn plus" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Update quantity
function updateQuantity(productId, quantity) {
    quantity = parseInt(quantity);
    
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Reload cart items
        loadCartItems();
        updateCartSummary();
        
        // Update cart count in header
        updateCartCount();
    }
}

// Remove from cart
function removeFromCart(productId) {
    if (confirm('আপনি কি এই পণ্যটি কার্ট থেকে সরাতে চান?')) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Reload cart items
        loadCartItems();
        updateCartSummary();
        
        // Update cart count in header
        updateCartCount();
        
        showNotification('পণ্যটি কার্ট থেকে সরানো হয়েছে', 'success');
    }
}

// Update cart summary
function updateCartSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        document.getElementById('subtotal').textContent = '৳ ০';
        document.getElementById('total').textContent = '৳ ৬০';
        return;
    }
    
    // Load product prices and calculate total
    fetch('data/products.json')
        .then(response => response.json())
        .then(products => {
            let subtotal = 0;
            
            cart.forEach(cartItem => {
                const product = products.find(p => p.id === cartItem.id);
                if (product) {
                    const price = parseFloat(product.price.replace(/[৳,]/g, ''));
                    subtotal += price * cartItem.quantity;
                }
            });
            
            const delivery = 60;
            const discount = subtotal > 2000 ? subtotal * 0.1 : 0; // 10% discount for orders over 2000
            const total = subtotal + delivery - discount;
            
            // Update display
            document.getElementById('subtotal').textContent = `৳ ${subtotal.toLocaleString('bn-BD')}`;
            document.getElementById('delivery').textContent = `৳ ${delivery.toLocaleString('bn-BD')}`;
            document.getElementById('discount').textContent = `-৳ ${discount.toLocaleString('bn-BD')}`;
            document.getElementById('total').textContent = `৳ ${total.toLocaleString('bn-BD')}`;
        })
        .catch(error => {
            console.error('Error updating cart summary:', error);
        });
}

// Load recommended products
function loadRecommendedProducts() {
    fetch('data/products.json')
        .then(response => response.json())
        .then(products => {
            // Get random 4 products
            const shuffled = products.sort(() => 0.5 - Math.random());
            const recommended = shuffled.slice(0, 4);
            
            const container = document.getElementById('recommendedProducts');
            
            container.innerHTML = recommended.map(product => `
                <div class="product-card">
                    <div class="product-img-container">
                        <img src="images/products/${product.images[0] || 'default.jpg'}" 
                             alt="${product.name}" 
                             class="product-img">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description.substring(0, 60)}...</p>
                        <p class="product-price">${product.price}</p>
                        <div class="product-actions">
                            <button class="btn-cart" 
                                    onclick="addToCart({
                                        id: ${product.id},
                                        name: '${product.name}',
                                        price: '${product.price}'
                                    })">
                                <i class="fas fa-cart-plus"></i> কার্টে যোগ
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading recommended products:', error);
        });
}

// Proceed to checkout
function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        showNotification('কার্টে পণ্য যোগ করুন', 'error');
        return;
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Clear cart
function clearCart() {
    if (confirm('আপনি কি সব পণ্য কার্ট থেকে সরাতে চান?')) {
        localStorage.removeItem('cart');
        loadCartItems();
        updateCartSummary();
        updateCartCount();
        showNotification('কার্ট খালি করা হয়েছে', 'success');
    }
}

// Continue shopping
function continueShopping() {
    window.location.href = 'products.html';
}