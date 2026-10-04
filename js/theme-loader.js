// ============================================================
// THEME LOADER — Custom theme, dark mode, favicon, custom CSS
// ============================================================

async function loadTheme() {
    try {
        const doc = await db.collection('settings').doc('theme').get();
        if (!doc.exists) return;
        const t = doc.data();

        const vars = {
            '--primary': t.primaryColor,
            '--primary-light': t.primaryLight,
            '--accent': t.accentColor,
            '--dark': t.darkColor,
            '--gray': t.grayColor,
            '--radius': t.borderRadius,
            '--font': t.fontFamily
        };
        Object.keys(vars).forEach(k => {
            if (vars[k]) document.documentElement.style.setProperty(k, vars[k]);
        });

        if (t.fontFamily) {
            const family = t.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
            if (!document.getElementById('custom-font')) {
                const link = document.createElement('link');
                link.id = 'custom-font';
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g,'+')}:wght@400;500;600;700;800&display=swap`;
                document.head.appendChild(link);
            }
        }

        if (t.customCSS) {
            let style = document.getElementById('custom-admin-css');
            if (!style) {
                style = document.createElement('style');
                style.id = 'custom-admin-css';
                document.head.appendChild(style);
            }
            style.textContent = t.customCSS;
        }
    } catch (e) {
        console.warn('Theme load failed:', e.message);
    }
}

// ---------- FAVICON from logo.png ----------
function setFavicon() {
    const isAdminPage = window.location.pathname.includes('/rdx/');
    const logo = isAdminPage ? '../images/logo.png' : 'images/logo.png';

    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) {
        fav = document.createElement('link');
        fav.rel = 'icon';
        document.head.appendChild(fav);
    }
    fav.href = logo;

    let apple = document.querySelector('link[rel="apple-touch-icon"]');
    if (!apple) {
        apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        document.head.appendChild(apple);
    }
    apple.href = logo;
}

// ---------- DARK MODE ----------
function getMode() {
    return localStorage.getItem('mode') || 'darkt';
}

function setMode(mode) {
    localStorage.setItem('mode', mode);
    document.documentElement.setAttribute('data-mode', mode);
    const btn = document.getElementById('modeToggle');
    if (btn) btn.textContent = mode === 'dark' ? '☀️' : '🌙';
}

function toggleMode() {
    setMode(getMode() === 'light' ? 'dark' : 'light');
}

// Init
setFavicon();
setMode(getMode());
loadTheme();

window.toggleMode = toggleMode;
window.setMode = setMode;
window.getMode = getMode;