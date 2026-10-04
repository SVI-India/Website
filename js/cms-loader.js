// ============================================================
// CMS LOADER — Header, Footer, Page Content, Notice, Popup
// All internal links converted to ABSOLUTE paths (/)
// ============================================================

// 🔥 SAFE EMAIL FALLBACK
window.SVI_EMAILS = window.SVI_EMAILS || {
    general:     "info@sve-in.xubi.org",
    contact:     "contact@sve-in.xubi.org",
    sales:       "sales@sve-in.xubi.org",
    support:     "support@sve-in.xubi.org",
    care:        "care@sve-in.xubi.org",
    enquiry:     "enquiry@sve-in.xubi.org",
    orders:      "orders@sve-in.xubi.org",
    billing:     "billing@sve-in.xubi.org",
    accounts:    "accounts@sve-in.xubi.org",
    b2b:         "b2b@sve-in.xubi.org",
    distributor: "distributor@sve-in.xubi.org",
    partner:     "partner@sve-in.xubi.org",
    bulk:        "bulk@sve-in.xubi.org",
    marketing:   "marketing@sve-in.xubi.org",
    media:       "media@sve-in.xubi.org",
    feedback:    "feedback@sve-in.xubi.org",
    newsletter:  "newsletter@sve-in.xubi.org",
    legal:       "legal@sve-in.xubi.org",
    privacy:     "privacy@sve-in.xubi.org",
    grievance:   "grievance@sve-in.xubi.org",
    webadmin:    "webadmin@sve-in.xubi.org",
    nikolux:     "nikolux@sve-in.xubi.org",
    lifestar:    "lifestar@sve-in.xubi.org",
    sanjivni:    "sanjivni@sve-in.xubi.org",
    help:        "help@sve-in.xubi.org"
};
window.SVI_REPLY_FROM = window.SVI_REPLY_FROM || "sve.raj.in@gmail.com";
window.SVI_REPLY_NOTICE = window.SVI_REPLY_NOTICE || "Reply will be from sve.raj.in@gmail.com";

// ============================================================
// ABSOLUTE PATH HELPER — Converts any path to root-relative
// e.g. "index.html" → "/index.html"
//      "products/nikolux.html" → "/products/nikolux.html"
//      "https://..." → unchanged
// ============================================================
function absUrl(url) {
    if (!url) return '#';
    const s = String(url).trim();
    // Already absolute or special protocol → return as-is
    if (/^(https?:|mailto:|tel:|#|\/\/|\/)/.test(s)) return s;
    // Prepend slash
    return '/' + s.replace(/^\/+/, '');
}

// Fix image path stored in Firestore
function absImg(path) {
    if (!path) return '';
    const s = String(path).trim();
    if (/^(https?:|data:|\/\/|\/)/.test(s)) return s;
    return '/' + s.replace(/^\/+/, '');
}

window.absUrl = absUrl;
window.absImg = absImg;

const CACHE = {};

async function fetchDoc(collection, docId) {
    const key = `${collection}/${docId}`;
    if (CACHE[key]) return CACHE[key];
    try {
        const doc = await db.collection(collection).doc(docId).get();
        if (doc.exists) {
            CACHE[key] = doc.data();
            return doc.data();
        }
    } catch (e) {
        console.warn(`❌ ${key}:`, e.message);
    }
    return null;
}

// ---------- DEFAULTS ----------
const DEFAULT_HEADER = {
    logoText: "Siddhi Vinayak Enterprises",
    logoImage: "/images/logo.png",
    b2bButtonText: "B2B Portal",
    b2bButtonTextHi: "B2B पोर्टल",
    b2bButtonUrl: "#",
    showLangToggle: true,
    showModeToggle: true,
    navItems: [
        { label: "Home",     labelHi: "होम",              url: "index.html" },
        { label: "About",    labelHi: "हमारे बारे में",    url: "about.html" },
        { label: "Products", labelHi: "उत्पाद",           url: "products.html" },
        { label: "Gallery",  labelHi: "गैलरी",            url: "gallery.html" },
        { label: "Contact",  labelHi: "संपर्क",           url: "contact.html" }
    ]
};

const DEFAULT_FOOTER = {
    brandName: "Siddhi Vinayak Enterprises",
    aboutText: "Powerful Clean. Assured Quality. India's trusted detergent manufacturer since 2009.",
    aboutTextHi: "शक्तिशाली सफाई। सुनिश्चित गुणवत्ता। 2009 से भारत का भरोसेमंद डिटर्जेंट निर्माता।",
    quickLinks: [
        { label: "About Us",  labelHi: "हमारे बारे में", url: "about.html" },
        { label: "Products",  labelHi: "उत्पाद",         url: "products.html" },
        { label: "Gallery",   labelHi: "गैलरी",          url: "gallery.html" },
        { label: "Contact",   labelHi: "संपर्क",         url: "contact.html" }
    ],
    productLinks: [
        { label: "Nikolux",   url: "products/nikolux.html" },
        { label: "Life Star", url: "products/life-star.html" },
        { label: "Sanjivni",  url: "products/sanjivni.html" }
    ],
    contactInfo: {
        address: "Lachharsar, District Churu, Rajasthan — 331 001, India",
        addressHi: "लछारसर, ज़िला चूरू, राजस्थान — 331 001, भारत",
        phone: "",
        email: "info@sve-in.xubi.org",
        salesEmail: "sales@sve-in.xubi.org",
        b2bEmail: "b2b@sve-in.xubi.org",
        grievanceEmail: "grievance@sve-in.xubi.org",
        replyFrom: "sve.raj.in@gmail.com",
        replyNotice: "Reply will be from sve.raj.in@gmail.com"
    },
    legalLinks: [
        { label: "Terms",       labelHi: "नियम",      url: "terms.html" },
        { label: "Privacy",     labelHi: "गोपनीयता",  url: "privacy.html" },
        { label: "Disclaimer",  labelHi: "अस्वीकरण",  url: "disclaimer.html" },
        { label: "Refund",      labelHi: "वापसी",     url: "refund.html" },
        { label: "Shipping",    labelHi: "शिपिंग",    url: "shipping.html" }
    ],
    socialLinks: {
        youtube:   "https://www.youtube.com/@SVE_India",
        facebook:  "",
        instagram: "",
        twitter:   "",
        linkedin:  ""
    },
    copyright: "© 2025 Siddhi Vinayak Enterprises. All rights reserved."
};

// ---------- HEADER ----------
async function renderHeader() {
    const el = document.getElementById('site-header');
    if (!el) return;
    const data = await fetchDoc('settings', 'header') || DEFAULT_HEADER;
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const lang = getLang();

    const navHtml = (data.navItems || []).map(item => {
        const url = absUrl(item.url);
        const isActive = url === absUrl(currentPath) || url === '/' + currentPath;
        const label = lang === 'hi' && item.labelHi ? item.labelHi : item.label;
        return `<li><a href="${url}" class="${isActive ? 'active' : ''}">${label}</a></li>`;
    }).join('');

    const b2bLabel = lang === 'hi' && data.b2bButtonTextHi ? data.b2bButtonTextHi : (data.b2bButtonText || 'B2B Portal');
    const b2bUrl = absUrl(data.b2bButtonUrl || '#');
    const logoImg = absImg(data.logoImage || '/images/logo.png');

    el.innerHTML = `
        <nav class="navbar">
            <div class="nav-container">
                <a href="/index.html" class="nav-logo">
                    ${logoImg ? `<img src="${logoImg}" alt="Logo" onerror="this.style.display='none'">` : ''}
                    <span>${data.logoText || 'Siddhi Vinayak Enterprises'}</span>
                </a>
                <ul class="nav-menu" id="navMenu">
                    ${navHtml}
                    <li><a href="${b2bUrl}" class="btn-b2b">${b2bLabel}</a></li>
                </ul>
                <div class="nav-controls">
                    ${data.showLangToggle !== false ? `<button id="langToggle" class="icon-btn" title="Language">🇮🇳 हिंदी</button>` : ''}
                    ${data.showModeToggle !== false ? `<button id="modeToggle" class="icon-btn" onclick="toggleMode()" title="Theme">🌙</button>` : ''}
                    <button class="nav-toggle" onclick="document.getElementById('navMenu').classList.toggle('open')">☰</button>
                </div>
            </div>
        </nav>
    `;

    const lt = document.getElementById('langToggle');
    if (lt) {
        lt.textContent = lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English';
        lt.onclick = () => setLang(lang === 'en' ? 'hi' : 'en');
    }
    const mt = document.getElementById('modeToggle');
    if (mt) mt.textContent = getMode() === 'dark' ? '☀️' : '🌙';
}

// ---------- FOOTER ----------
async function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    const data = await fetchDoc('settings', 'footer') || DEFAULT_FOOTER;
    const lang = getLang();

    const quickLinks = (data.quickLinks || []).map(l => {
        const label = lang === 'hi' && l.labelHi ? l.labelHi : l.label;
        return `<li><a href="${absUrl(l.url)}">${label}</a></li>`;
    }).join('');

    const productLinks = (data.productLinks || []).map(l =>
        `<li><a href="${absUrl(l.url)}">${l.label}</a></li>`
    ).join('');

    const legalLinks = (data.legalLinks || []).map(l => {
        const label = lang === 'hi' && l.labelHi ? l.labelHi : l.label;
        return `<a href="${absUrl(l.url)}">${label}</a>`;
    }).join('');

    const c = data.contactInfo || {};
    const aboutText = lang === 'hi' && data.aboutTextHi ? data.aboutTextHi : (data.aboutText || '');
    const address = lang === 'hi' && c.addressHi ? c.addressHi : (c.address || '');

    const s = data.socialLinks || {};
    const socialHtml = [
        s.youtube   ? `<a href="${s.youtube}"   target="_blank" rel="noopener" title="YouTube">▶️</a>` : '',
        s.facebook  ? `<a href="${s.facebook}"  target="_blank" rel="noopener" title="Facebook">📘</a>` : '',
        s.instagram ? `<a href="${s.instagram}" target="_blank" rel="noopener" title="Instagram">📷</a>` : '',
        s.twitter   ? `<a href="${s.twitter}"   target="_blank" rel="noopener" title="Twitter">🐦</a>` : '',
        s.linkedin  ? `<a href="${s.linkedin}"  target="_blank" rel="noopener" title="LinkedIn">💼</a>` : ''
    ].filter(Boolean).join('');

    const replyNotice = c.replyNotice || window.SVI_REPLY_NOTICE;

    el.innerHTML = `
        <footer class="footer">
            <div class="footer-container">
                <div>
                    <h4>${data.brandName || ''}</h4>
                    <p style="font-size:0.9rem;">${aboutText}</p>
                    <div class="footer-social" style="margin-top:1rem;display:flex;gap:0.75rem;font-size:1.3rem;">
                        ${socialHtml}
                    </div>
                </div>
                <div>
                    <h4 data-i18n="footer.quickLinks">Quick Links</h4>
                    <ul>${quickLinks}</ul>
                </div>
                <div>
                    <h4 data-i18n="footer.products">Products</h4>
                    <ul>${productLinks}</ul>
                </div>
                <div>
                    <h4 data-i18n="footer.contact">Contact</h4>
                    <ul>
                        <li>📍 ${address}</li>
                        <li>✉️ <a href="mailto:${c.email || window.SVI_EMAILS.general}">${c.email || window.SVI_EMAILS.general}</a></li>
                        ${c.salesEmail ? `<li>💼 <a href="mailto:${c.salesEmail}">${c.salesEmail}</a></li>` : ''}
                        ${c.b2bEmail ? `<li>🤝 <a href="mailto:${c.b2bEmail}">${c.b2bEmail}</a></li>` : ''}
                    </ul>
                    <p style="font-size:0.75rem;color:#94a3b8;margin-top:0.75rem;line-height:1.4;">
                        ℹ️ ${replyNotice}
                    </p>
                </div>
            </div>
            <div class="footer-bottom">
                <div class="footer-legal-links">${legalLinks}</div>
                <p>${data.copyright || ''}</p>
            </div>
        </footer>
    `;
    if (typeof applyTranslations === 'function') applyTranslations();
}

// ---------- PAGE CONTENT ----------
async function renderPageContent(pageId) {
    const data = await fetchDoc('pages', pageId);
    if (!data) return null;
    const lang = getLang();

    Object.keys(data).forEach(key => {
        if (key === 'updatedAt' || key === 'updatedBy') return;
        let val = data[key];
        if (lang === 'hi' && data[key + 'Hi']) val = data[key + 'Hi'];
        const el = document.getElementById(key);
        if (el) {
            if (el.tagName === 'IMG') el.src = absImg(val);
            else el.innerHTML = val;
        }
    });

    document.querySelectorAll('[data-cms]').forEach(el => {
        const key = el.getAttribute('data-cms');
        if (data[key] !== undefined) {
            let val = data[key];
            if (lang === 'hi' && data[key + 'Hi']) val = data[key + 'Hi'];
            if (el.tagName === 'IMG') el.src = absImg(val);
            else el.innerHTML = val;
        }
    });

    return data;
}

// ---------- NOTICE BAR ----------
async function renderNoticeBar() {
    try {
        const snap = await db.collection('notices').where('type', '==', 'bar').where('active', '==', true).get();
        if (snap.empty) return;
        const docs = snap.docs.sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0));
        const n = docs[0].data();
        const bar = document.createElement('div');
        bar.className = 'notice-bar';
        bar.style.background = n.bgColor || 'var(--accent)';
        bar.style.color = n.textColor || '#000';
        bar.innerHTML = `
            <span>${n.icon || '📢'} ${n.message}</span>
            ${n.link ? `<a href="${absUrl(n.link)}" style="color:inherit;text-decoration:underline;margin-left:10px;">${n.linkText || 'Read more'}</a>` : ''}
            <span class="notice-close" onclick="document.querySelector('.notice-bar').remove();document.body.classList.remove('has-notice')">✕</span>
        `;
        document.body.insertBefore(bar, document.body.firstChild);
        document.body.classList.add('has-notice');
    } catch (e) {}
}

// ---------- POPUP ----------
async function renderPopup() {
    try {
        const snap = await db.collection('notices').where('type', '==', 'popup').where('active', '==', true).get();
        if (snap.empty) return;
        const docs = snap.docs.sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0));
        const docId = docs[0].id;
        const n = docs[0].data();
        const dismissKey = 'popup_dismissed_' + docId;
        if (sessionStorage.getItem(dismissKey)) return;

        setTimeout(() => {
            const modal = document.createElement('div');
            modal.className = 'popup-overlay';
            modal.innerHTML = `
                <div class="popup-modal" style="background:${n.bgColor || '#fff'};color:${n.textColor || '#000'};">
                    <span class="popup-close" onclick="this.closest('.popup-overlay').remove();sessionStorage.setItem('${dismissKey}','1')">✕</span>
                    ${n.image ? `<img src="${absImg(n.image)}" style="width:100%;border-radius:8px;margin-bottom:1rem;">` : ''}
                    <h2 style="margin-bottom:0.75rem;">${n.title || ''}</h2>
                    <div style="margin-bottom:1.5rem;">${n.message || ''}</div>
                    ${n.link ? `<a href="${absUrl(n.link)}" class="btn btn-primary">${n.linkText || 'Learn More'}</a>` : ''}
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', e => {
                if (e.target === modal) {
                    modal.remove();
                    sessionStorage.setItem(dismissKey, '1');
                }
            });
        }, 1500);
    } catch (e) {}
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([renderHeader(), renderFooter(), renderNoticeBar(), renderPopup()]);
    const pageId = document.body.dataset.page;
    if (pageId) await renderPageContent(pageId);
    if (typeof applyTranslations === 'function') applyTranslations();
    if (typeof toggleLangBlocks === 'function') toggleLangBlocks();
});

document.addEventListener('langChanged', async () => {
    CACHE['settings/header'] = null;
    CACHE['settings/footer'] = null;
    await Promise.all([renderHeader(), renderFooter()]);
    const pageId = document.body.dataset.page;
    if (pageId) await renderPageContent(pageId);
    if (typeof applyTranslations === 'function') applyTranslations();
    if (typeof toggleLangBlocks === 'function') toggleLangBlocks();
});