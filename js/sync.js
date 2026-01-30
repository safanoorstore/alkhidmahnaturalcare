// ===========================================
// REAL-TIME SYNC SYSTEM
// Admin Panel ↔ Website Synchronization
// ===========================================

const SYNC_SYSTEM = {
    // Configuration
    config: {
        syncInterval: 5000, // 5 seconds
        forceRefreshKey: 'force_website_refresh',
        lastUpdateKey: 'last_product_update',
        lastCheckKey: 'last_sync_check',
        websiteProductsKey: 'website_products',
        adminProductsKey: 'alkhidmah_products'
    },
    
    // Initialize sync system
    initialize: function() {
        console.log('🔄 Initializing Sync System...');
        
        // Check current page type
        this.isAdminPanel = window.location.pathname.includes('admin.html');
        this.isWebsite = !this.isAdminPanel;
        
        // Setup based on page type
        if (this.isAdminPanel) {
            this.setupAdminSync();
        } else {
            this.setupWebsiteSync();
        }
        
        // Start sync interval
        this.startSyncInterval();
        
        console.log('✅ Sync System initialized for:', this.isAdminPanel ? 'Admin Panel' : 'Website');
    },
    
    // Setup for Admin Panel
    setupAdminSync: function() {
        // Auto-save products to website when changed in admin
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            
            if (key === SYNC_SYSTEM.config.adminProductsKey) {
                // Also save to website storage
                localStorage.setItem(SYNC_SYSTEM.config.websiteProductsKey, value);
                localStorage.setItem(SYNC_SYSTEM.config.lastUpdateKey, new Date().getTime());
                localStorage.setItem(SYNC_SYSTEM.config.forceRefreshKey, 'true');
                
                console.log('📤 Admin -> Website sync triggered');
            }
        };
        
        // Add sync button to admin panel
        this.addSyncButtonToAdmin();
    },
    
    // Setup for Website
    setupWebsiteSync: function() {
        // Check for updates from admin
        this.checkForAdminUpdates();
        
        // Listen for storage events (other tabs/windows)
        window.addEventListener('storage', (e) => {
            if (e.key === SYNC_SYSTEM.config.lastUpdateKey || 
                e.key === SYNC_SYSTEM.config.forceRefreshKey) {
                console.log('📥 Storage event: Update detected from other tab');
                this.refreshWebsiteProducts();
            }
        });
    },
    
    // Start sync interval
    startSyncInterval: function() {
        // Clear existing interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Start new interval
        this.syncInterval = setInterval(() => {
            this.syncProducts();
        }, this.config.syncInterval);
    },
    
    // Main sync function
    syncProducts: function() {
        const lastUpdate = localStorage.getItem(this.config.lastUpdateKey);
        const lastCheck = localStorage.getItem(this.config.lastCheckKey) || 0;
        
        // If never checked or update is newer than last check
        if (!lastCheck || (lastUpdate && lastUpdate > lastCheck)) {
            console.log('🔄 Syncing products...');
            
            if (this.isAdminPanel) {
                this.syncAdminToWebsite();
            } else {
                this.checkForAdminUpdates();
            }
            
            // Update last check time
            localStorage.setItem(this.config.lastCheckKey, new Date().getTime());
        }
    },
    
    // Sync from Admin to Website
    syncAdminToWebsite: function() {
        try {
            // Get products from admin storage
            const adminProducts = JSON.parse(
                localStorage.getItem(this.config.adminProductsKey) || '[]'
            );
            
            // Save to website storage
            localStorage.setItem(this.config.websiteProductsKey, JSON.stringify(adminProducts));
            
            // Set update timestamp
            localStorage.setItem(this.config.lastUpdateKey, new Date().getTime());
            localStorage.setItem(this.config.forceRefreshKey, 'true');
            
            console.log(`📤 Admin → Website: ${adminProducts.length} products synced`);
            
            // Update sync status display
            this.updateSyncStatus(adminProducts.length);
            
            return { success: true, count: adminProducts.length };
            
        } catch (error) {
            console.error('❌ Sync error (Admin → Website):', error);
            return { success: false, error: error.message };
        }
    },
    
    // Check for updates from Admin on Website
    checkForAdminUpdates: function() {
        const forceRefresh = localStorage.getItem(this.config.forceRefreshKey);
        
        if (forceRefresh === 'true') {
            console.log('📥 Force refresh requested');
            
            // Clear the flag
            localStorage.removeItem(this.config.forceRefreshKey);
            
            // Refresh website products
            this.refreshWebsiteProducts();
            
            return true;
        }
        
        return false;
    },
    
    // Refresh products on website
    refreshWebsiteProducts: function() {
        console.log('🔄 Refreshing website products...');
        
        // Get latest products
        const websiteProducts = JSON.parse(
            localStorage.getItem(this.config.websiteProductsKey) || '[]'
        );
        
        // Update global products if function exists
        if (window.loadProducts && typeof window.loadProducts === 'function') {
            window.loadProducts();
        }
        
        // Update featured products if function exists
        if (window.loadFeaturedProducts && typeof window.loadFeaturedProducts === 'function') {
            window.loadFeaturedProducts();
        }
        
        // Update cart if function exists
        if (window.updateCartCount && typeof window.updateCartCount === 'function') {
            window.updateCartCount();
        }
        
        // Show notification if function exists
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification('নতুন পণ্য আপডেট করা হয়েছে!', 'success');
        }
        
        console.log(`✅ Website refreshed with ${websiteProducts.length} products`);
        return websiteProducts.length;
    },
    
    // Force manual sync (for admin panel button)
    forceSync: function() {
        console.log('🚀 Manual force sync requested');
        
        if (this.isAdminPanel) {
            const result = this.syncAdminToWebsite();
            
            if (result.success) {
                if (window.showNotification) {
                    showNotification(`সফলভাবে ${result.count}টি পণ্য সিঙ্ক করা হয়েছে!`, 'success');
                }
                
                // Update sync status
                this.updateSyncStatus(result.count, true);
                
                return result;
            } else {
                if (window.showNotification) {
                    showNotification('সিঙ্ক করতে সমস্যা: ' + result.error, 'error');
                }
                return result;
            }
        } else {
            // On website, just refresh
            const count = this.refreshWebsiteProducts();
            
            if (window.showNotification) {
                showNotification(`${count}টি পণ্য রিফ্রেশ করা হয়েছে!`, 'info');
            }
            
            return { success: true, count: count };
        }
    },
    
    // Add sync button to admin panel
    addSyncButtonToAdmin: function() {
        // Wait for DOM to be ready
        setTimeout(() => {
            // Look for product section
            const productSection = document.querySelector('.product-list-section');
            
            if (productSection) {
                // Create sync section
                const syncSection = document.createElement('div');
                syncSection.className = 'sync-section';
                syncSection.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin: 20px 0;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 10px;
                        border-left: 4px solid #3498db;
                    ">
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: #2c3e50;">
                                <i class="fas fa-sync-alt"></i> সিঙ্ক স্ট্যাটাস
                            </h4>
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                সর্বশেষ সিঙ্ক: <span id="lastSyncTime">কখনোই না</span>
                                | পণ্য সংখ্যা: <span id="productCount">0</span>
                            </p>
                        </div>
                        <div>
                            <button id="syncNowBtn" class="btn" style="background: #3498db; color: white;">
                                <i class="fas fa-sync"></i> এখনই সিঙ্ক করুন
                            </button>
                            <button id="forceRefreshBtn" class="btn" style="background: #2ecc71; color: white; margin-left: 10px;">
                                <i class="fas fa-redo"></i> ওয়েবসাইট রিফ্রেশ
                            </button>
                        </div>
                    </div>
                `;
                
                // Insert before product table
                productSection.insertBefore(syncSection, productSection.querySelector('.table-container'));
                
                // Add event listeners
                document.getElementById('syncNowBtn').addEventListener('click', () => {
                    this.forceSync();
                });
                
                document.getElementById('forceRefreshBtn').addEventListener('click', () => {
                    localStorage.setItem(this.config.forceRefreshKey, 'true');
                    if (window.showNotification) {
                        showNotification('ওয়েবসাইট রিফ্রেশ রিকোয়েস্ট পাঠানো হয়েছে!', 'success');
                    }
                });
                
                // Update initial status
                this.updateSyncStatus();
                
                // Auto-update status every 10 seconds
                setInterval(() => {
                    this.updateSyncStatus();
                }, 10000);
                
                console.log('✅ Sync buttons added to admin panel');
            }
        }, 1000);
    },
    
    // Update sync status display
    updateSyncStatus: function(productCount = null, justSynced = false) {
        const lastSyncElement = document.getElementById('lastSyncTime');
        const productCountElement = document.getElementById('productCount');
        
        if (lastSyncElement) {
            const lastUpdate = localStorage.getItem(this.config.lastUpdateKey);
            if (lastUpdate) {
                const date = new Date(parseInt(lastUpdate));
                lastSyncElement.textContent = date.toLocaleTimeString('bn-BD');
            } else {
                lastSyncElement.textContent = 'কখনোই না';
            }
        }
        
        if (productCountElement) {
            if (productCount === null) {
                const products = JSON.parse(
                    localStorage.getItem(this.config.adminProductsKey) || '[]'
                );
                productCount = products.length;
            }
            productCountElement.textContent = productCount;
        }
        
        // Visual feedback if just synced
        if (justSynced && lastSyncElement) {
            lastSyncElement.style.color = '#27ae60';
            lastSyncElement.style.fontWeight = 'bold';
            
            setTimeout(() => {
                if (lastSyncElement) {
                    lastSyncElement.style.color = '';
                    lastSyncElement.style.fontWeight = '';
                }
            }, 2000);
        }
    },
    
    // Get sync statistics
    getStats: function() {
        const adminProducts = JSON.parse(
            localStorage.getItem(this.config.adminProductsKey) || '[]'
        );
        const websiteProducts = JSON.parse(
            localStorage.getItem(this.config.websiteProductsKey) || '[]'
        );
        const lastUpdate = localStorage.getItem(this.config.lastUpdateKey);
        
        return {
            adminProductCount: adminProducts.length,
            websiteProductCount: websiteProducts.length,
            inSync: adminProducts.length === websiteProducts.length,
            lastUpdate: lastUpdate ? new Date(parseInt(lastUpdate)) : null,
            needsSync: localStorage.getItem(this.config.forceRefreshKey) === 'true'
        };
    },
    
    // Reset sync system
    reset: function() {
        localStorage.removeItem(this.config.forceRefreshKey);
        localStorage.removeItem(this.config.lastCheckKey);
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        console.log('🔄 Sync system reset');
        return { success: true };
    }
};

// Auto-initialize on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Small delay to ensure other scripts are loaded
        setTimeout(() => {
            SYNC_SYSTEM.initialize();
        }, 1000);
    });
}

// Make available globally
if (typeof window !== 'undefined') {
    window.SYNC_SYSTEM = SYNC_SYSTEM;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SYNC_SYSTEM;
}