// ===========================================
// CENTRAL DATABASE SYSTEM
// আলখিদমাহ ন্যাচারাল কেয়ার ব্রাঞ্চ
// ===========================================

const PRODUCT_DB = {
    // Get all products from all sources
    getAllProducts: function() {
        try {
            console.log('📦 Loading products from all sources...');
            
            // ১. প্রথমে localStorage থেকে (Admin Panel সেভ করে)
            const localProducts = JSON.parse(localStorage.getItem('alkhidmah_products')) || [];
            console.log('Local Storage products:', localProducts.length);
            
            // ২. তারপর ফাইল থেকে (Default products)
            let fileProducts = [];
            try {
                const response = fetch('data/products.json');
                if (response && response.ok) {
                    fileProducts = JSON.parse(localStorage.getItem('file_products_cache')) || [];
                }
            } catch (e) {
                console.log('Using cached file products');
            }
            
            // ৩. Website cache থেকে
            const websiteProducts = JSON.parse(localStorage.getItem('website_products')) || [];
            
            // ৪. সবগুলি মার্জ করো এবং ডুপ্লিকেট মুছো
            const allProductsMap = new Map();
            
            // ফাইল পণ্যগুলো প্রথমে যোগ করো
            fileProducts.forEach(product => {
                if (product && product.id) {
                    allProductsMap.set(product.id, product);
                }
            });
            
            // Local storage পণ্যগুলো যোগ করো (ফাইল থেকে প্রায়োরিটি বেশি)
            localProducts.forEach(product => {
                if (product && product.id) {
                    allProductsMap.set(product.id, product);
                }
            });
            
            // Website পণ্যগুলো যোগ করো
            websiteProducts.forEach(product => {
                if (product && product.id && !allProductsMap.has(product.id)) {
                    allProductsMap.set(product.id, product);
                }
            });
            
            const allProducts = Array.from(allProductsMap.values());
            
            // সাজানো (নতুন পণ্য আগে)
            allProducts.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            
            console.log('Total products found:', allProducts.length);
            return allProducts;
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            return this.getDemoProducts(); // Emergency fallback
        }
    },
    
    // নতুন পণ্য সংরক্ষণ করো
    saveProduct: function(product) {
        try {
            console.log('💾 Saving product:', product.name);
            
            // Product validation
            if (!product.name || !product.price) {
                throw new Error('Product name and price are required');
            }
            
            // Generate ID if not exists
            if (!product.id) {
                product.id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Set timestamps
            product.createdAt = product.createdAt || new Date().toISOString();
            product.updatedAt = new Date().toISOString();
            product.status = product.status || 'active';
            
            // Get existing products
            const existingProducts = this.getAllProducts();
            
            // Check if product exists
            const existingIndex = existingProducts.findIndex(p => p.id === product.id);
            
            if (existingIndex >= 0) {
                // Update existing
                existingProducts[existingIndex] = product;
                console.log('Updated existing product:', product.id);
            } else {
                // Add new product
                existingProducts.unshift(product); // New products at top
                console.log('Added new product:', product.id);
            }
            
            // Save to ALL storage locations
            localStorage.setItem('alkhidmah_products', JSON.stringify(existingProducts)); // For Admin
            localStorage.setItem('website_products', JSON.stringify(existingProducts));   // For Website
            localStorage.setItem('all_products_backup', JSON.stringify(existingProducts)); // Backup
            
            // Set sync timestamp
            localStorage.setItem('last_product_update', new Date().getTime());
            localStorage.setItem('force_website_refresh', 'true');
            
            console.log('✅ Product saved successfully');
            return { success: true, product: product };
            
        } catch (error) {
            console.error('❌ Error saving product:', error);
            return { success: false, error: error.message };
        }
    },
    
    // পণ্য মুছো
    deleteProduct: function(productId) {
        try {
            console.log('🗑️ Deleting product:', productId);
            
            const products = this.getAllProducts();
            const filteredProducts = products.filter(p => p.id !== productId);
            
            // Update all storage
            localStorage.setItem('alkhidmah_products', JSON.stringify(filteredProducts));
            localStorage.setItem('website_products', JSON.stringify(filteredProducts));
            
            // Set update timestamp
            localStorage.setItem('last_product_update', new Date().getTime());
            localStorage.setItem('force_website_refresh', 'true');
            
            console.log('✅ Product deleted');
            return { success: true, remaining: filteredProducts.length };
            
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ID দ্বারা পণ্য খুঁজো
    getProductById: function(id) {
        const products = this.getAllProducts();
        return products.find(p => p.id == id);
    },
    
    // Category দ্বারা পণ্য খুঁজো
    getProductsByCategory: function(category) {
        const products = this.getAllProducts();
        if (!category) return products;
        return products.filter(p => 
            p.category && p.category.toLowerCase().includes(category.toLowerCase())
        );
    },
    
    // Search products
    searchProducts: function(query) {
        const products = this.getAllProducts();
        if (!query) return products;
        
        const lowerQuery = query.toLowerCase();
        return products.filter(p => 
            (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
            (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
            (p.category && p.category.toLowerCase().includes(lowerQuery))
        );
    },
    
    // Emergency demo products
    getDemoProducts: function() {
        console.log('⚠️ Loading demo products (emergency mode)');
        return [
            {
                id: 'demo_1',
                name: "হেলথ কেয়ার সিরাপ",
                category: "হেলথ কেয়ার পণ্য",
                price: "৳ ১,২০০",
                description: "সুস্বাস্থ্যের জন্য প্রয়োজনীয় হার্বাল সিরাপ।",
                images: ["demo/health.jpg"],
                stock: 20,
                status: "active",
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo_2',
                name: "চর্ম রোগের ক্রিম",
                category: "চর্ম, এলার্জি, হাঁপানি ইত্যাদি পন্য তালিকা",
                price: "৳ ৭৫০",
                description: "একজিমা, সোরিয়াসিস ও চর্ম রোগের জন্য কার্যকরী ক্রিম।",
                images: ["demo/skin.jpg"],
                stock: 15,
                status: "active",
                createdAt: new Date().toISOString()
            }
        ];
    },
    
    // Initialize database
    initialize: function() {
        console.log('🚀 Initializing Product Database...');
        
        // Load default products from file if not exists
        if (!localStorage.getItem('alkhidmah_db_initialized')) {
            console.log('First time setup: Loading default products...');
            
            fetch('data/products.json')
                .then(response => {
                    if (response.ok) return response.json();
                    throw new Error('File not found');
                })
                .then(defaultProducts => {
                    // Save to all locations
                    localStorage.setItem('alkhidmah_products', JSON.stringify(defaultProducts));
                    localStorage.setItem('website_products', JSON.stringify(defaultProducts));
                    localStorage.setItem('file_products_cache', JSON.stringify(defaultProducts));
                    localStorage.setItem('alkhidmah_db_initialized', 'true');
                    localStorage.setItem('last_product_update', new Date().getTime());
                    
                    console.log('✅ Database initialized with', defaultProducts.length, 'default products');
                })
                .catch(error => {
                    console.log('⚠️ Could not load default products, using demo');
                    const demoProducts = this.getDemoProducts();
                    localStorage.setItem('alkhidmah_products', JSON.stringify(demoProducts));
                    localStorage.setItem('website_products', JSON.stringify(demoProducts));
                    localStorage.setItem('alkhidmah_db_initialized', 'true');
                });
        } else {
            console.log('✅ Database already initialized');
        }
        
        // Check for updates every 10 seconds
        setInterval(() => {
            this.checkForUpdates();
        }, 10000);
    },
    
    // Check for updates from other tabs/windows
    checkForUpdates: function() {
        const lastUpdate = localStorage.getItem('last_product_update');
        const lastCheck = localStorage.getItem('last_update_check') || 0;
        
        if (lastUpdate > lastCheck) {
            console.log('🔄 Update detected, refreshing...');
            localStorage.setItem('last_update_check', new Date().getTime());
            
            // Trigger refresh in website
            if (!window.location.pathname.includes('admin.html')) {
                if (window.loadProducts) {
                    loadProducts();
                }
            }
            
            // Trigger refresh in admin
            if (window.location.pathname.includes('admin.html')) {
                if (window.loadProducts) {
                    loadProducts();
                }
            }
        }
    },
    
    // Force refresh website
    forceRefreshWebsite: function() {
        localStorage.setItem('force_website_refresh', 'true');
        localStorage.setItem('last_product_update', new Date().getTime());
        console.log('🔔 Force refresh triggered');
    },
    
    // Export all products
    exportProducts: function() {
        const products = this.getAllProducts();
        const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alkhidmah_products_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return products.length;
    },
    
    // Import products from file
    importProducts: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedProducts = JSON.parse(e.target.result);
                    const currentProducts = this.getAllProducts();
                    
                    // Merge products (avoid duplicates by ID)
                    const mergedMap = new Map();
                    
                    currentProducts.forEach(p => mergedMap.set(p.id, p));
                    importedProducts.forEach(p => {
                        if (p && p.id) {
                            mergedMap.set(p.id, p);
                        }
                    });
                    
                    const mergedProducts = Array.from(mergedMap.values());
                    
                    // Save merged products
                    localStorage.setItem('alkhidmah_products', JSON.stringify(mergedProducts));
                    localStorage.setItem('website_products', JSON.stringify(mergedProducts));
                    localStorage.setItem('last_product_update', new Date().getTime());
                    
                    resolve({
                        success: true,
                        imported: importedProducts.length,
                        total: mergedProducts.length
                    });
                    
                } catch (error) {
                    reject({ success: false, error: 'Invalid JSON file' });
                }
            };
            reader.readAsText(file);
        });
    },
    
    // Get database stats
    getStats: function() {
        const products = this.getAllProducts();
        const categories = {};
        
        products.forEach(p => {
            const cat = p.category || 'Unknown';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        return {
            totalProducts: products.length,
            activeProducts: products.filter(p => p.status === 'active').length,
            categories: categories,
            lastUpdate: localStorage.getItem('last_product_update')
        };
    }
};

// Initialize on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        PRODUCT_DB.initialize();
        
        // Auto-refresh if force refresh is set
        const forceRefresh = localStorage.getItem('force_website_refresh');
        if (forceRefresh === 'true') {
            localStorage.removeItem('force_website_refresh');
            
            if (window.loadProducts) {
                setTimeout(() => {
                    loadProducts();
                    if (window.showNotification) {
                        showNotification('নতুন পণ্য লোড করা হয়েছে!', 'success');
                    }
                }, 1000);
            }
        }
    });
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.PRODUCT_DB = PRODUCT_DB;
    console.log('🌐 PRODUCT_DB loaded globally');
}

// For Node.js/CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRODUCT_DB;
}