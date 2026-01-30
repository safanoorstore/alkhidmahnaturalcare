// ===== WEBSITE CONFIGURATION =====
// এক জায়গা পরিবর্তন করলে সাইটজুড়ে পরিবর্তিত হবে

const SITE_CONFIG = {
    // সাইট তথ্য
    siteName: "Alkhidmah Natural Care Branch",
    siteTitle: "Alkhidmah Natural Care | Pure Health & Beauty Products",
    tagline: "প্রকৃতির উপাদানে বিশুদ্ধ স্বাস্থ্য",
    
    // যোগাযোগ (এক জায়গা থেকে নিয়ন্ত্রণ)
    contact: {
        phone: "01949805239",
        whatsapp: "01949805239",
        email: "alkhidmahnturalcarebranch@gmail.com",
        address: "আপনার শাখার ঠিকানা, বাংলাদেশ"
    },
    
    // অ্যাডমিন অ্যাক্সেস
    admin: {
        username: "admin",
        password: "alkhidmah@2026", // আপনি চাইলে পরিবর্তন করুন
        sessionTimeout: 60 // মিনিট
    },
    
    // ডেলিভারি ও পেমেন্ট
    delivery: {
        charge: 60,
        freeDeliveryAbove: 2000,
        dhakaDays: "১-২ কার্যদিবস",
        outsideDays: "৩-৫ কার্যদিবস"
    },
    
    // থিম রং (সবুজ রঙের থিম)
    colors: {
        primary: "#1a6d2c",
        secondary: "#2e8b57",
        light: "#f5fdf7",
        dark: "#0d4d1f"
    },
    
    // কারেন্সি
    currency: "৳",
    
    // সোশ্যাল মিডিয়া
    social: {
        facebook: "#",
        whatsapp: "https://wa.me/8801949805239",
        youtube: "#",
        instagram: "#"
    }
};

// গ্লোবাল ভেরিয়েবল হিসেবে এক্সপোর্ট
if (typeof window !== 'undefined') {
    window.SITE_CONFIG = SITE_CONFIG;
}