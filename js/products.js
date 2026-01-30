// ===== PRODUCTS PAGE FUNCTIONS =====

// সকল পণ্য লোড
async function loadProducts() {
    try {
        // Use website products loader
        const products = loadWebsiteProducts();
        
        // If it's a promise, wait for it
        if (products.then) {
            products.then(data => {
                displayProducts(data);
                updateProductsCount(data.length);
            });
        } else {
            displayProducts(products);
            updateProductsCount(products.length);
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Fallback: directly fetch from file
        fetch('data/products.json')
            .then(response => response.json())
            .then(data => {
                displayProducts(data);
                updateProductsCount(data.length);
            })
            .catch(err => {
                console.error('Fallback also failed:', err);
                document.getElementById('productContainer').innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>পণ্য লোড করতে সমস্যা</h3>
                        <p>পৃষ্ঠাটি রিফ্রেশ করুন</p>
                    </div>
                `;
            });
    }
}

// Also update loadFeaturedProducts function
async function loadFeaturedProducts() {
    try {
        const products = loadWebsiteProducts();
        
        // Handle promise or direct data
        if (products.then) {
            products.then(data => {
                const featured = data.slice(0, 8);
                displayFeaturedProducts(featured);
            });
        } else {
            const featured = products.slice(0, 8);
            displayFeaturedProducts(featured);
        }
        
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();
        
        displayAllProducts(products);
        updateProductsCount(products.length);
        setupPagination(products);
    } catch (error) {
        console.error('পণ্য লোড করতে সমস্যা:', error);
        document.getElementById('allProducts').innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px;">
                <i class="fas fa-exclamation-triangle" style="font-size:60px; color:#ffc107;"></i>
                <h3 style="color:var(--text-light); margin-top:20px;">পণ্য লোড করতে সমস্যা হয়েছে</h3>
                <p>দয়া করে পৃষ্ঠাটি রিফ্রেশ করুন অথবা পরে চেষ্টা করুন।</p>
            </div>
        `;
    }
}

// সকল পণ্য প্রদর্শন
function displayAllProducts(products, page = 1) {
    const container = document.getElementById('allProducts');
    const itemsPerPage = 12;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    if (paginatedProducts.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                <i class="fas fa-search" style="font-size:80px; color:#ddd;"></i>
                <h3 style="color:var(--text-light); margin-top:20px;">কোন পণ্য পাওয়া যায়নি</h3>
                <p>আপনার সার্চ ক্রাইটেরিয়ার সাথে মিলে এমন কোন পণ্য নেই।</p>
                <button class="btn" onclick="resetFilters()" style="margin-top:20px;">
                    <i class="fas fa-redo"></i> সকল পণ্য দেখুন
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = paginatedProducts.map(product => `
        <div class="product-card">
            <div class="product-img-container">
                <img src="images/products/${product.images[0] || 'default.jpg'}" 
                     alt="${product.name}" 
                     class="product-img">
                ${product.category.includes('কম্বো') ? '<span class="product-badge">কম্বো</span>' : ''}
                ${parseFloat(product.price.replace(/[৳,]/g, '')) > 1500 ? '<span class="product-badge">প্রিমিয়াম</span>' : ''}
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
    
    // কার্ট বাটন ইভেন্ট লিসেনার যোগ
    document.querySelectorAll('.btn-cart').forEach(button => {
        button.addEventListener('click', function() {
            const product = {
                id: this.dataset.id,
                name: this.dataset.name,
                price: this.dataset.price
            };
            addToCart(product);
        });
    });
}

// পণ্য সংখ্যা আপডেট
function updateProductsCount(count) {
    const countElement = document.getElementById('productsCount');
    if (countElement) {
        countElement.innerHTML = `মোট <span>${count}</span>টি পণ্য পাওয়া গেছে`;
    }
}

// পেজিনেশন সেটআপ
function setupPagination(products) {
    const container = document.getElementById('pagination');
    const itemsPerPage = 12;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // পূর্ববর্তী বাটন
    paginationHTML += `
        <button class="page-btn" onclick="changePage('prev')">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // পেজ নম্বর
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button class="page-btn ${i === 1 ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // পরবর্তী বাটন
    paginationHTML += `
        <button class="page-btn" onclick="changePage('next')">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = paginationHTML;
}

// পেজ পরিবর্তন
function changePage(page) {
    const currentPage = getCurrentPage();
    const totalPages = document.querySelectorAll('.page-btn:not([onclick*="prev"]):not([onclick*="next"])').length;
    
    let newPage = currentPage;
    
    if (page === 'prev') {
        newPage = Math.max(1, currentPage - 1);
    } else if (page === 'next') {
        newPage = Math.min(totalPages, currentPage + 1);
    } else {
        newPage = page;
    }
    
    // সক্রিয় পেজ আপডেট
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // নতুন সক্রিয় পেজ সেট
    document.querySelectorAll('.page-btn').forEach(btn => {
        if (btn.textContent.trim() == newPage) {
            btn.classList.add('active');
        }
    });
    
    // পণ্য রিলোড
    reloadProductsForPage(newPage);
    
    // পেজের উপরে স্ক্রল
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// বর্তমান পেজ পাওয়া
function getCurrentPage() {
    const activeBtn = document.querySelector('.page-btn.active');
    return activeBtn ? parseInt(activeBtn.textContent) : 1;
}

// নির্দিষ্ট পেজের পণ্য রিলোড
async function reloadProductsForPage(page) {
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();
        displayAllProducts(products, page);
    } catch (error) {
        console.error('পণ্য রিলোড করতে সমস্যা:', error);
    }
}

// ফিচার্ড পণ্য লোড (হোমপেজের জন্য)
async function loadFeaturedProducts() {
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();
        
        // প্রথম ৮টি পণ্য নিন
        const featured = products.slice(0, 8);
        const container = document.getElementById('featuredProducts');
        
        if (!container) return;
        
        container.innerHTML = featured.map(product => `
            <div class="product-card">
                <div class="product-img-container">
                    <img src="images/products/${product.images[0] || 'default.jpg'}" 
                         alt="${product.name}" 
                         class="product-img">
                    ${product.category.includes('কম্বো') ? '<span class="product-badge">কম্বো</span>' : ''}
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
        
        // কার্ট বাটন ইভেন্ট লিসেনার যোগ
        document.querySelectorAll('.btn-cart').forEach(button => {
            button.addEventListener('click', function() {
                const product = {
                    id: this.dataset.id,
                    name: this.dataset.name,
                    price: this.dataset.price
                };
                addToCart(product);
            });
        });
    } catch (error) {
        console.error('ফিচার্ড পণ্য লোড করতে সমস্যা:', error);
    }
}

// পণ্য ফিল্টার
async function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceRange').value;
    const searchQuery = document.getElementById('searchProduct').value.toLowerCase();
    
    try {
        const response = await fetch('data/products.json');
        let products = await response.json();
        
        // বিভাগ দ্বারা ফিল্টার
        if (category) {
            const categoryMap = {
                'health-care': 'হেলথ কেয়ার',
                'skin-care': 'চর্ম ও এলার্জি',
                'sexual-health': 'যৌন রোগ',
                'cosmetics': 'কসমেটিক্স',
                'combo': 'কম্বো'
            };
            
            const categoryText = categoryMap[category];
            products = products.filter(product => 
                product.category.includes(categoryText)
            );
        }
        
        // মূল্য পরিসীমা দ্বারা ফিল্টার
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            products = products.filter(product => {
                const price = parseFloat(product.price.replace(/[৳,]/g, ''));
                return price >= min && price <= max;
            });
        }
        
        // সার্চ কোয়েরি দ্বারা ফিল্টার
        if (searchQuery) {
            products = products.filter(product =>
                product.name.toLowerCase().includes(searchQuery) ||
                product.description.toLowerCase().includes(searchQuery) ||
                product.category.toLowerCase().includes(searchQuery)
            );
        }
        
        // ফলাফল প্রদর্শন
        displayAllProducts(products);
        updateProductsCount(products.length);
        setupPagination(products);
        
        // কোন পণ্য না পাওয়া গেলে মেসেজ
        if (products.length === 0) {
            document.getElementById('allProducts').innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                    <i class="fas fa-search" style="font-size:80px; color:#ddd;"></i>
                    <h3 style="color:var(--text-light); margin-top:20px;">কোন পণ্য পাওয়া যায়নি</h3>
                    <p>আপনার ফিল্টার ক্রাইটেরিয়ার সাথে মিলে এমন কোন পণ্য নেই।</p>
                    <button class="btn" onclick="resetFilters()" style="margin-top:20px;">
                        <i class="fas fa-redo"></i> সকল ফিল্টার রিসেট করুন
                    </button>
                </div>
            `;
            document.getElementById('pagination').innerHTML = '';
        }
    } catch (error) {
        console.error('পণ্য ফিল্টার করতে সমস্যা:', error);
    }
}

// ফিল্টার রিসেট
function resetFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('priceRange').value = '';
    document.getElementById('searchProduct').value = '';
    loadAllProducts();
}

// পণ্য সর্ট
async function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    
    try {
        const response = await fetch('data/products.json');
        let products = await response.json();
        
        switch (sortValue) {
            case 'price-low':
                products.sort((a, b) => {
                    const priceA = parseFloat(a.price.replace(/[৳,]/g, ''));
                    const priceB = parseFloat(b.price.replace(/[৳,]/g, ''));
                    return priceA - priceB;
                });
                break;
                
            case 'price-high':
                products.sort((a, b) => {
                    const priceA = parseFloat(a.price.replace(/[৳,]/g, ''));
                    const priceB = parseFloat(b.price.replace(/[৳,]/g, ''));
                    return priceB - priceA;
                });
                break;
                
            case 'name-asc':
                products.sort((a, b) => 
                    a.name.localeCompare(b.name, 'bn')
                );
                break;
                
            case 'name-desc':
                products.sort((a, b) => 
                    b.name.localeCompare(a.name, 'bn')
                );
                break;
        }
        
        displayAllProducts(products);
    } catch (error) {
        console.error('পণ্য সর্ট করতে সমস্যা:', error);
    }
}

// ক্যাটাগরি দ্বারা পণ্য ফিল্টার
async function filterByCategory(category) {
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();
        
        const filtered = products.filter(product => 
            product.category.toLowerCase().includes(category.toLowerCase())
        );
        
        displayAllProducts(filtered);
        updateProductsCount(filtered.length);
        setupPagination(filtered);
    } catch (error) {
        console.error('ক্যাটাগরি ফিল্টার করতে সমস্যা:', error);
    }
}

// মূল্য পরিসীমা ফিল্টার
async function filterByPrice(min, max) {
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();
        
        const filtered = products.filter(product => {
            const price = parseFloat(product.price.replace(/[৳,]/g, ''));
            return price >= min && price <= max;
        });
        
        displayAllProducts(filtered);
        updateProductsCount(filtered.length);
        setupPagination(filtered);
    } catch (error) {
        console.error('মূল্য ফিল্টার করতে সমস্যা:', error);
    }
}

// পণ্য সার্চ
async function searchProducts(query) {
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();
        
        const results = products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        );
        
        displayAllProducts(results);
        updateProductsCount(results.length);
        setupPagination(results);
        
        // সার্চ কোয়েরি URL এ অ্যাড
        const url = new URL(window.location);
        url.searchParams.set('search', query);
        window.history.pushState({}, '', url);
    } catch (error) {
        console.error('পণ্য সার্চ করতে সমস্যা:', error);
    }
}

// ইনিশিয়ালাইজেশন
document.addEventListener('DOMContentLoaded', function() {
    // যদি products.html পেজে থাকে
    if (window.location.pathname.includes('products.html')) {
        loadAllProducts();
        
        // সার্চ ফাংশনালিটি
        const searchInput = document.getElementById('searchProduct');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    filterProducts();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', filterProducts);
        }
    }
    
    // যদি index.html পেজে থাকে
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        loadFeaturedProducts();
    }
});