// ============================================================
// ADMIN SHARED HELPERS — Complete
// ============================================================

// ---------- AUTH GUARD ----------
function guardAdmin() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(user => {
            if (!user || user.email !== window.ADMIN_EMAIL) {
                location.href = 'login.html';
                return;
            }
            // Fill user info everywhere
            document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);
            resolve(user);
        });
    });
}

// ---------- LOGOUT ----------
function adminLogout() {
    if (!confirm('Logout from admin panel?')) return;
    auth.signOut().then(() => location.href = 'login.html');
}

// ---------- TOAST ----------
function toast(message, type = 'info', duration = 3500) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'toast-wrap';
        document.body.appendChild(wrap);
    }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
        <span style="font-size:1.15rem;">${icons[type] || 'ℹ️'}</span>
        <span>${message}</span>
        <button class="close" aria-label="Close">✕</button>
    `;
    el.querySelector('.close').onclick = () => el.remove();
    wrap.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        el.style.transition = 'all 0.3s';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

// ---------- ALERT ----------
function showAlert(id, message, type = 'success') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `alert alert-${type} show`;
    el.textContent = message;
    if (type === 'success') setTimeout(() => el.classList.remove('show'), 4000);
}

// ---------- SIDEBAR TOGGLE (mobile) ----------
function initSidebar() {
    const toggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (!toggle || !sidebar) return;

    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    function close() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }
    function open() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    }

    toggle.onclick = () => sidebar.classList.contains('open') ? close() : open();
    overlay.onclick = close;

    // Close on nav link click (mobile)
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

// ---------- SIDEBAR HTML ----------
function renderSidebar(activePage) {
    const el = document.querySelector('.sidebar');
    if (!el) return;

    const items = [
        { id: 'index',      icon: '📊', label: 'Dashboard',       href: 'index.html' },
        { id: 'header',     icon: '🔝', label: 'Header',          href: 'header.html' },
        { id: 'footer',     icon: '🔻', label: 'Footer',          href: 'footer.html' },
        { id: 'pages',      icon: '📄', label: 'Pages',           href: 'pages.html' },
        { id: 'products',   icon: '📦', label: 'Products',        href: 'products.html' },
        { id: 'notices',    icon: '📢', label: 'Notices & Popups', href: 'notices.html' },
        { id: 'theme',      icon: '🎨', label: 'Theme & CSS',     href: 'theme.html' },
        { id: 'settings',   icon: '⚙️', label: 'Settings',        href: 'settings.html' },
        { id: 'enquiries',  icon: '✉️', label: 'Enquiries',       href: 'enquiries.html' }
    ];

    el.innerHTML = `
        <div class="sidebar-logo">
            <img src="../images/logo.png" alt="" onerror="this.style.display='none'">
            SVI <span>CMS</span>
        </div>
        <ul class="sidebar-nav">
            ${items.map(i => `
                <li><a href="${i.href}" class="${i.id === activePage ? 'active' : ''}">
                    <span class="icon">${i.icon}</span> ${i.label}
                </a></li>
            `).join('')}
        </ul>
        <div class="sidebar-footer">
            <div class="user-email" data-user-email>—</div>
            <button class="btn btn-danger btn-block btn-sm" onclick="adminLogout()">
                🚪 Logout
            </button>
        </div>
    `;
}

// ---------- FORMAT DATE ----------
function formatDate(ts) {
    if (!ts) return '—';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return '—'; }
}

// ---------- ESCAPE HTML ----------
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ---------- CONFIRM ----------
function confirmAction(message) {
    return confirm(message || 'Are you sure?');
}

// ---------- EXPOSE GLOBAL ----------
window.guardAdmin = guardAdmin;
window.adminLogout = adminLogout;
window.toast = toast;
window.showAlert = showAlert;
window.initSidebar = initSidebar;
window.renderSidebar = renderSidebar;
window.formatDate = formatDate;
window.esc = esc;
window.confirmAction = confirmAction;