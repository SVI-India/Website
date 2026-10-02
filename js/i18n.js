// ============================================================
// i18n — Hindi/English language switcher (COMPLETE)
// ============================================================
const TRANSLATIONS = {
    en: {
        // Navigation
        "nav.home": "Home",
        "nav.about": "About",
        "nav.products": "Products",
        "nav.gallery": "Gallery",
        "nav.contact": "Contact",
        "nav.b2b": "B2B Portal",

        // Hero (Home)
        "hero.badge": "🏆 India's Trusted Detergent Manufacturer",
        "hero.title": "Powerful Clean. <span>Assured Quality.</span>",
        "hero.text": "Premium quality detergents crafted with advanced technology. Trusted by millions of households across India.",
        "hero.cta1": "View Products",
        "hero.cta2": "Contact Us",

        // Stats
        "stats.years": "Years Experience",
        "stats.dist": "Distributors",
        "stats.brands": "Premium Brands",
        "stats.customers": "Happy Customers",

        // Home sections
        "products.title": "Our Premium Brands",
        "products.subtitle": "Discover our range of high-performance detergents",
        "features.title": "Why Choose Us?",
        "features.subtitle": "Manufacturing excellence with quality assurance",
        "feature1.title": "Modern Facility",
        "feature1.desc": "State-of-the-art manufacturing unit",
        "feature2.title": "Lab Tested",
        "feature2.desc": "Every batch tested for quality",
        "feature3.title": "Bulk Supply",
        "feature3.desc": "Reliable distribution network",
        "feature4.title": "ISO Certified",
        "feature4.desc": "Quality standards you can trust",

        // Footer
        "footer.quickLinks": "Quick Links",
        "footer.products": "Products",
        "footer.contact": "Contact",
        "footer.rights": "All rights reserved",

        // Buttons
        "btn.learnMore": "Learn More",
        "btn.send": "Send Message",

        // Contact page
        "contact.title": "Contact Us",
        "contact.subtitle": "We'd love to hear from you",
        "form.name": "Your Name",
        "form.email": "Email",
        "form.phone": "Phone",
        "form.message": "Message",

        // About page
        "about.title": "About Siddhi Vinayak Industries",
        "about.subtitle": "Our journey of excellence in detergent manufacturing",
        "about.storyHeading": "Our Story",
        "about.missionHeading": "Our Mission",
        "about.visionHeading": "Our Vision",
        "about.milestones": "Our Milestones",
        "about.milestonesSub": "A journey of growth and trust",
        "about.values": "Our Core Values",
        "about.valuesSub": "What drives us every single day",

        // Products page
        "products.title2": "Our Products",
        "products.subtitle2": "Premium quality detergents for every need",

        // Product detail pages
        "product.enquire": "📞 Enquire Now",
        "product.allProducts": "← All Products",
        "product.keyFeatures": "Key Features",
        "product.specs": "Product Specifications",
        "product.usage": "How to Use",
        "product.bulkEnquiry": "📦 Bulk Enquiry",

        // Gallery page
        "gallery.title": "Gallery",
        "gallery.subtitle": "Glimpses of our manufacturing excellence",

        // Legal pages
        "legal.terms": "Terms of Use",
        "legal.privacy": "Privacy Policy",
        "legal.disclaimer": "Disclaimer",
        "legal.refund": "Refund Policy",
        "legal.shipping": "Shipping Policy",
        "legal.lastUpdated": "Last Updated"
    },

    hi: {
        // Navigation
        "nav.home": "होम",
        "nav.about": "हमारे बारे में",
        "nav.products": "उत्पाद",
        "nav.gallery": "गैलरी",
        "nav.contact": "संपर्क",
        "nav.b2b": "B2B पोर्टल",

        // Hero (Home)
        "hero.badge": "🏆 भारत का भरोसेमंद डिटर्जेंट निर्माता",
        "hero.title": "शक्तिशाली सफाई। <span>सुनिश्चित गुणवत्ता।</span>",
        "hero.text": "उन्नत तकनीक से बने प्रीमियम गुणवत्ता वाले डिटर्जेंट। भारत भर के लाखों घरों का भरोसा।",
        "hero.cta1": "उत्पाद देखें",
        "hero.cta2": "संपर्क करें",

        // Stats
        "stats.years": "वर्षों का अनुभव",
        "stats.dist": "वितरक",
        "stats.brands": "प्रीमियम ब्रांड",
        "stats.customers": "खुश ग्राहक",

        // Home sections
        "products.title": "हमारे प्रीमियम ब्रांड",
        "products.subtitle": "उच्च प्रदर्शन वाले डिटर्जेंट की हमारी रेंज देखें",
        "features.title": "हमें क्यों चुनें?",
        "features.subtitle": "गुणवत्ता आश्वासन के साथ निर्माण उत्कृष्टता",
        "feature1.title": "आधुनिक सुविधा",
        "feature1.desc": "अत्याधुनिक निर्माण इकाई",
        "feature2.title": "लैब टेस्टेड",
        "feature2.desc": "हर बैच की गुणवत्ता जांच",
        "feature3.title": "थोक आपूर्ति",
        "feature3.desc": "विश्वसनीय वितरण नेटवर्क",
        "feature4.title": "ISO प्रमाणित",
        "feature4.desc": "गुणवत्ता मानक जिन पर भरोसा करें",

        // Footer
        "footer.quickLinks": "त्वरित लिंक",
        "footer.products": "उत्पाद",
        "footer.contact": "संपर्क",
        "footer.rights": "सर्वाधिकार सुरक्षित",

        // Buttons
        "btn.learnMore": "और जानें",
        "btn.send": "संदेश भेजें",

        // Contact page
        "contact.title": "संपर्क करें",
        "contact.subtitle": "हम आपसे सुनना चाहेंगे",
        "form.name": "आपका नाम",
        "form.email": "ईमेल",
        "form.phone": "फ़ोन",
        "form.message": "संदेश",

        // About page
        "about.title": "सिद्धि विनायक इंडस्ट्रीज़ के बारे में",
        "about.subtitle": "डिटर्जेंट निर्माण में उत्कृष्टता की हमारी यात्रा",
        "about.storyHeading": "हमारी कहानी",
        "about.missionHeading": "हमारा मिशन",
        "about.visionHeading": "हमारा दृष्टिकोण",
        "about.milestones": "हमारी उपलब्धियाँ",
        "about.milestonesSub": "विकास और विश्वास की यात्रा",
        "about.values": "हमारे मूल मूल्य",
        "about.valuesSub": "जो हमें हर दिन प्रेरित करता है",

        // Products page
        "products.title2": "हमारे उत्पाद",
        "products.subtitle2": "हर ज़रूरत के लिए प्रीमियम गुणवत्ता वाले डिटर्जेंट",

        // Product detail pages
        "product.enquire": "📞 अभी पूछताछ करें",
        "product.allProducts": "← सभी उत्पाद",
        "product.keyFeatures": "मुख्य विशेषताएँ",
        "product.specs": "उत्पाद विवरण",
        "product.usage": "उपयोग कैसे करें",
        "product.bulkEnquiry": "📦 थोक पूछताछ",

        // Gallery page
        "gallery.title": "गैलरी",
        "gallery.subtitle": "हमारी निर्माण उत्कृष्टता की झलकियाँ",

        // Legal pages
        "legal.terms": "उपयोग की शर्तें",
        "legal.privacy": "गोपनीयता नीति",
        "legal.disclaimer": "अस्वीकरण",
        "legal.refund": "वापसी नीति",
        "legal.shipping": "शिपिंग नीति",
        "legal.lastUpdated": "अंतिम अपडेट"
    }
};

function getLang() {
    return localStorage.getItem('lang') || 'en';
}

function setLang(lang) {
    localStorage.setItem('lang', lang);
    applyTranslations();
    toggleLangBlocks();
    const btn = document.getElementById('langToggle');
    if (btn) btn.textContent = lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English';
    document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
}

function t(key) {
    const lang = getLang();
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        // Agar translation mili hi nahi, to HTML ka original content chhod do
        if (val === key && !TRANSLATIONS.en[key]) {
            return;
        }
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = val;
        } else {
            el.innerHTML = val;
        }
    });
}

// ---------- LANGUAGE BLOCK TOGGLE (data-lang-en / data-lang-hi) ----------
function toggleLangBlocks() {
    const lang = getLang();
    document.querySelectorAll('[data-lang-en][data-lang-hi]').forEach(el => {
        el.innerHTML = lang === 'hi' ? el.dataset.langHi : el.dataset.langEn;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    toggleLangBlocks();
    const btn = document.getElementById('langToggle');
    if (btn) {
        const lang = getLang();
        btn.textContent = lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English';
        btn.onclick = () => setLang(getLang() === 'en' ? 'hi' : 'en');
    }
});

window.t = t;
window.setLang = setLang;
window.getLang = getLang;
window.applyTranslations = applyTranslations;
window.toggleLangBlocks = toggleLangBlocks;