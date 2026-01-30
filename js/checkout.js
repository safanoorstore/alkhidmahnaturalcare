// ===== CHECKOUT PAGE FUNCTIONS =====

// Checkout page initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeCheckout();
    loadOrderSummary();
    updateCartCount();
    
    // URL থেকে অর্ডার কনফার্মেশন চেক
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        showOrderConfirmation();
    }
});

// Checkout initialization
function initializeCheckout() {
    // Progress steps setup
    setupProgressSteps();
    
    // Form validation setup
    setupFormValidation();
    
    // Payment method selection
    setupPaymentMethods();
    
    // Auto-fill form if user data exists
    autoFillUserData();
}

// Progress steps setup
function setupProgressSteps() {
    const steps = document.querySelectorAll('.progress-step');
    
    steps.forEach((step, index) => {
        step.addEventListener('click', function() {
            if (index <= getCurrentStep()) {
                goToStep(index);
            }
        });
    });
    
    // Start with step 1
    goToStep(0);
}

// Get current step
function getCurrentStep() {
    const activeStep = document.querySelector('.progress-step.active');
    if (!activeStep) return 0;
    
    const steps = document.querySelectorAll('.progress-step');
    return Array.from(steps).indexOf(activeStep);
}

// Go to specific step
function goToStep(stepIndex) {
    const steps = document.querySelectorAll('.progress-step');
    const forms = document.querySelectorAll('.checkout-form-section');
    
    // Update steps
    steps.forEach((step, index) => {
        if (index < stepIndex) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index === stepIndex) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Show corresponding form
    forms.forEach((form, index) => {
        if (index === stepIndex) {
            form.style.display = 'block';
        } else {
            form.style.display = 'none';
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Form validation setup
function setupFormValidation() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    
    // Real-time validation
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// Validate single field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'এই তথ্যটি প্রয়োজনীয়';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'সঠিক ইমেইল দিন';
        }
    }
    
    // Mobile validation
    if (field.id === 'mobile' && value) {
        const mobileRegex = /^01[3-9]\d{8}$/;
        if (!mobileRegex.test(value)) {
            isValid = false;
            errorMessage = 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)';
        }
    }
    
    // Update field state
    const formGroup = field.closest('.form-group-checkout');
    if (formGroup) {
        if (!isValid) {
            formGroup.classList.add('error');
            let errorElement = formGroup.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                formGroup.appendChild(errorElement);
            }
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        } else {
            formGroup.classList.remove('error');
            const errorElement = formGroup.querySelector('.error-message');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }
    
    return isValid;
}

// Clear field error
function clearFieldError(field) {
    const formGroup = field.closest('.form-group-checkout');
    if (formGroup) {
        formGroup.classList.remove('error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
}

// Setup payment methods
function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method-card');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remove selected class from all
            paymentMethods.forEach(m => m.classList.remove('selected'));
            
            // Add selected class to clicked
            this.classList.add('selected');
            
            // Save selected payment method
            const methodName = this.querySelector('h4').textContent;
            localStorage.setItem('selectedPaymentMethod', methodName);
        });
    });
    
    // Select first payment method by default
    if (paymentMethods.length > 0 && !localStorage.getItem('selectedPaymentMethod')) {
        paymentMethods[0].classList.add('selected');
        const methodName = paymentMethods[0].querySelector('h4').textContent;
        localStorage.setItem('selectedPaymentMethod', methodName);
    }
}

// Auto-fill user data from localStorage
function autoFillUserData() {
    const savedUser = JSON.parse(localStorage.getItem('userInfo'));
    
    if (savedUser) {
        document.getElementById('fullName').value = savedUser.name || '';
        document.getElementById('mobile').value = savedUser.mobile || '';
        document.getElementById('email').value = savedUser.email || '';
        document.getElementById('address').value = savedUser.address || '';
        document.getElementById('division').value = savedUser.division || '';
        document.getElementById('district').value = savedUser.district || '';
        document.getElementById('postalCode').value = savedUser.postalCode || '';
    }
}

// Load order summary
function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('orderItemsContainer');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <p>আপনার কার্ট খালি</p>
            </div>
        `;
        updateOrderTotals(0);
        return;
    }
    
    // Load products data
    fetch('data/products.json')
        .then(response => response.json())
        .then(products => {
            let itemsHTML = '';
            let subtotal = 0;
            
            cart.forEach(cartItem => {
                const product = products.find(p => p.id === cartItem.id);
                if (product) {
                    const price = parseFloat(product.price.replace(/[৳,]/g, ''));
                    const itemTotal = price * cartItem.quantity;
                    subtotal += itemTotal;
                    
                    itemsHTML += `
                        <div class="order-item-checkout">
                            <div class="order-item-name">
                                ${product.name} × ${cartItem.quantity}
                            </div>
                            <div class="order-item-price">
                                ৳ ${itemTotal.toLocaleString('bn-BD')}
                            </div>
                        </div>
                    `;
                }
            });
            
            container.innerHTML = itemsHTML;
            updateOrderTotals(subtotal);
        })
        .catch(error => {
            console.error('Error loading order summary:', error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>পণ্য তথ্য লোড করতে সমস্যা</p>
                </div>
            `;
        });
}

// Update order totals
function updateOrderTotals(subtotal) {
    const deliveryCharge = SITE_CONFIG.delivery.charge;
    const discount = subtotal > SITE_CONFIG.delivery.freeDeliveryAbove ? 
        Math.min(subtotal * 0.1, 500) : 0; // 10% discount, max 500
    const total = subtotal + deliveryCharge - discount;
    
    // Update display
    document.getElementById('orderSubtotal').textContent = `৳ ${subtotal.toLocaleString('bn-BD')}`;
    document.getElementById('orderDelivery').textContent = `৳ ${deliveryCharge.toLocaleString('bn-BD')}`;
    document.getElementById('orderDiscount').textContent = `-৳ ${discount.toLocaleString('bn-BD')}`;
    document.getElementById('orderTotal').textContent = `৳ ${total.toLocaleString('bn-BD')}`;
    
    // Save order total for later use
    localStorage.setItem('orderTotal', total);
}

// Validate checkout form
function validateCheckoutForm() {
    const requiredFields = [
        'fullName',
        'mobile',
        'address',
        'division',
        'district'
    ];
    
    let isValid = true;
    
    // Validate all required fields
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validate mobile format
    const mobileField = document.getElementById('mobile');
    if (mobileField.value && !/^01[3-9]\d{8}$/.test(mobileField.value)) {
        isValid = false;
        validateField(mobileField);
    }
    
    return isValid;
}

// Submit order
function submitOrder() {
    // Validate form
    if (!validateCheckoutForm()) {
        showNotification('দয়া করে সকল প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন', 'error');
        return;
    }
    
    // Check cart is not empty
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showNotification('আপনার কার্ট খালি', 'error');
        return;
    }
    
    // Collect form data
    const orderData = {
        customer: {
            name: document.getElementById('fullName').value.trim(),
            mobile: document.getElementById('mobile').value.trim(),
            email: document.getElementById('email').value.trim(),
            address: document.getElementById('address').value.trim(),
            division: document.getElementById('division').value,
            district: document.getElementById('district').value.trim(),
            postalCode: document.getElementById('postalCode').value.trim(),
            specialInstructions: document.getElementById('specialInstructions').value.trim()
        },
        payment: {
            method: localStorage.getItem('selectedPaymentMethod') || 'ক্যাশ অন ডেলিভারি',
            status: 'pending'
        },
        order: {
            id: generateOrderId(),
            date: new Date().toISOString(),
            items: cart,
            subtotal: parseFloat(localStorage.getItem('orderSubtotal') || 0),
            delivery: SITE_CONFIG.delivery.charge,
            discount: parseFloat(localStorage.getItem('orderDiscount') || 0),
            total: parseFloat(localStorage.getItem('orderTotal') || 0),
            status: 'processing'
        },
        delivery: {
            charge: SITE_CONFIG.delivery.charge,
            estimatedDays: document.getElementById('division').value === 'dhaka' ? 
                SITE_CONFIG.delivery.dhakaDays : SITE_CONFIG.delivery.outsideDays,
            status: 'pending'
        }
    };
    
    // Save user info for future use
    localStorage.setItem('userInfo', JSON.stringify(orderData.customer));
    
    // Save order to localStorage (in production, send to server)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Save current order for confirmation page
    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    
    // Clear cart
    localStorage.removeItem('cart');
    updateCartCount();
    
    // Show confirmation
    showOrderConfirmation(orderData);
    
    // Send WhatsApp notification (optional)
    sendWhatsAppNotification(orderData);
}

// Generate order ID
function generateOrderId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `ORD-${year}${month}${day}-${random}`;
}

// Show order confirmation
function showOrderConfirmation(orderData = null) {
    // Hide checkout form
    document.querySelector('.checkout-form-section').style.display = 'none';
    document.querySelector('.order-summary-sidebar').style.display = 'none';
    
    // Show confirmation
    const confirmation = document.getElementById('orderConfirmation');
    if (confirmation) {
        confirmation.style.display = 'block';
        
        // Load order data if provided
        if (orderData) {
            document.getElementById('confirmationOrderId').textContent = orderData.order.id;
            document.getElementById('confirmationName').textContent = orderData.customer.name;
            document.getElementById('confirmationMobile').textContent = orderData.customer.mobile;
            document.getElementById('confirmationAddress').textContent = orderData.customer.address;
            document.getElementById('confirmationPayment').textContent = orderData.payment.method;
            document.getElementById('confirmationTotal').textContent = `৳ ${orderData.order.total.toLocaleString('bn-BD')}`;
            document.getElementById('confirmationDelivery').textContent = orderData.delivery.estimatedDays;
        } else {
            // Load from localStorage
            const savedOrder = JSON.parse(localStorage.getItem('currentOrder'));
            if (savedOrder) {
                document.getElementById('confirmationOrderId').textContent = savedOrder.order.id;
                document.getElementById('confirmationName').textContent = savedOrder.customer.name;
                document.getElementById('confirmationMobile').textContent = savedOrder.customer.mobile;
                document.getElementById('confirmationAddress').textContent = savedOrder.customer.address;
                document.getElementById('confirmationPayment').textContent = savedOrder.payment.method;
                document.getElementById('confirmationTotal').textContent = `৳ ${savedOrder.order.total.toLocaleString('bn-BD')}`;
                document.getElementById('confirmationDelivery').textContent = savedOrder.delivery.estimatedDays;
            }
        }
    }
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('success', 'true');
    window.history.pushState({}, '', url);
    
    // Scroll to confirmation
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Send WhatsApp notification
function sendWhatsAppNotification(orderData) {
    const message = `
নতুন অর্ডার! 📦

অর্ডার আইডি: ${orderData.order.id}
ক্রেতার নাম: ${orderData.customer.name}
মোবাইল: ${orderData.customer.mobile}
ঠিকানা: ${orderData.customer.address}

পণ্য: ${orderData.order.items.length}টি
মোট টাকা: ৳ ${orderData.order.total.toLocaleString('bn-BD')}

পেমেন্ট: ${orderData.payment.method}
স্ট্যাটাস: ${orderData.order.status}

সময়: ${new Date().toLocaleString('bn-BD')}
    `.trim();
    
    const whatsappURL = `https://wa.me/${SITE_CONFIG.contact.whatsapp.replace('+', '')}?text=${encodeURIComponent(message)}`;
    
    // Open in new tab (optional)
    // window.open(whatsappURL, '_blank');
    
    console.log('WhatsApp Notification:', whatsappURL);
}

// Go to next step
function goToNextStep() {
    const currentStep = getCurrentStep();
    const totalSteps = document.querySelectorAll('.progress-step').length;
    
    if (currentStep < totalSteps - 1) {
        goToStep(currentStep + 1);
    }
}

// Go to previous step
function goToPreviousStep() {
    const currentStep = getCurrentStep();
    
    if (currentStep > 0) {
        goToStep(currentStep - 1);
    }
}

// Save step data
function saveStepData(stepIndex) {
    const stepsData = JSON.parse(localStorage.getItem('checkoutStepsData')) || {};
    
    switch(stepIndex) {
        case 0: // Personal info
            stepsData.personalInfo = {
                name: document.getElementById('fullName').value,
                mobile: document.getElementById('mobile').value,
                email: document.getElementById('email').value
            };
            break;
            
        case 1: // Address
            stepsData.address = {
                address: document.getElementById('address').value,
                division: document.getElementById('division').value,
                district: document.getElementById('district').value,
                postalCode: document.getElementById('postalCode').value
            };
            break;
            
        case 2: // Payment
            stepsData.payment = {
                method: localStorage.getItem('selectedPaymentMethod')
            };
            break;
    }
    
    localStorage.setItem('checkoutStepsData', JSON.stringify(stepsData));
}