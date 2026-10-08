// ============================================================
// VINAYAK AI WIDGET — Floating button + mini chat + summarize
// ============================================================

(function() {
    'use strict';

    const BASE_URL = 'https://www.sveindia.mywire.org';
    const DATA_PATH = BASE_URL + '/ai/data';

    // State
    let CONFIG = null;
    let RESPONSES = null;
    let FALLBACKS = null;
    let QUICK_REPLIES = null;
    let KEYWORDS = null;
    let FAQ = null;
    let PRODUCTS = null;
    let HELP = null;
    let POLICIES = null;
    let GREETINGS = null;
    let CONTACT = null;
    let COMPANY = null;
    let CATALOG = null;
    let SUMMARIES = null;
    let lang = localStorage.getItem('lang') || 'en';
    let history = JSON.parse(localStorage.getItem('vyw_history') || '[]');
    let panelOpen = false;
    let initialized = false;

    // ---- DATA LOADER ----
    async function loadAll() {
        if (initialized) return;
        try {
            const fetcher = (f) => fetch(`${DATA_PATH}/${f}`).then(r => r.ok ? r.json() : null).catch(() => null);
            const [
                cfg, resp, fb, qr, kw, faq, prods, hp, pol, greet, cont, comp, cat, summ
            ] = await Promise.all([
                fetcher('config.json'),
                fetcher('responses.json'),
                fetcher('fallbacks.json'),
                fetcher('quick-replies.json'),
                fetcher('keywords.json'),
                fetcher('faq.json'),
                fetcher('products.json'),
                fetcher('help.json'),
                fetcher('policies.json'),
                fetcher('greetings.json'),
                fetcher('contact.json'),
                fetcher('company.json'),
                fetcher('catalog.json'),
                fetcher('page-summaries.json')
            ]);
            CONFIG = cfg || { aiName: 'Vinayak AI' };
            RESPONSES = resp || {};
            FALLBACKS = fb || { fallbacks: [{ reply: 'I didn\'t understand. Please try again.' }] };
            QUICK_REPLIES = qr || { initial: [] };
            KEYWORDS = kw || {};
            FAQ = faq || {};
            PRODUCTS = prods || {};
            HELP = hp || {};
            POLICIES = pol || {};
            GREETINGS = greet || {};
            CONTACT = cont || {};
            COMPANY = comp || {};
            CATALOG = cat || {};
            SUMMARIES = summ || {};
            initialized = true;
        } catch (e) {
            console.warn('Data load failed:', e);
            initialized = true;
        }
    }

    // ---- MATCH LOGIC ----
    function matchAll(text) {
        const t = text.toLowerCase().trim();

        // Search all data sources in priority order
        const sources = [
            GREETINGS.greetings,
            POLICIES && Object.values(POLICIES),
            HELP && Object.values(HELP),
            CONTACT && Object.values(CONTACT),
            COMPANY && Object.values(COMPANY),
            CATALOG && Object.values(CATALOG),
            RESPONSES && Object.values(RESPONSES)
        ];

        for (const source of sources) {
            if (!source) continue;
            for (const item of source) {
                if (item && item.patterns && Array.isArray(item.patterns)) {
                    if (item.patterns.some(p => t.includes(String(p).toLowerCase()))) {
                        return {
                            reply: lang === 'hi' && item.replyHi ? item.replyHi : item.reply
                        };
                    }
                }
            }
        }

        // Product matching
        if (PRODUCTS) {
            for (const [id, p] of Object.entries(PRODUCTS)) {
                if (t.includes(id) || t.includes(p.name.toLowerCase()) || (p.nameHi && t.includes(p.nameHi))) {
                    return { reply: productReply(p) };
                }
            }
        }

        // Fallback
        const fb = FALLBACKS.fallbacks[Math.floor(Math.random() * FALLBACKS.fallbacks.length)];
        return { reply: lang === 'hi' && fb.replyHi ? fb.replyHi : fb.reply };
    }

    // ---- PRODUCT REPLY BUILDER ----
    function productReply(p) {
        const name = lang === 'hi' && p.nameHi ? p.nameHi : p.name;
        const tag = lang === 'hi' && p.taglineHi ? p.taglineHi : p.tagline;
        const feats = lang === 'hi' && p.featuresHi ? p.featuresHi : p.features;
        const sizes = (p.sizes || []).join(' / ');
        const link = BASE_URL + p.page;

        return `⭐ ${name}\n\n${tag}\n\n${p.description}\n\n✅ Features:\n${feats.map(f => '• ' + f).join('\n')}\n\n📦 Sizes: ${sizes}\n\n🔗 More info: ${link}`;
    }

    // ---- PAGE SUMMARY ----
    function getCurrentPageSummary() {
        if (!SUMMARIES || !SUMMARIES.summaries) return null;
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '') || 'index';
        return SUMMARIES.summaries[filename] || null;
    }

    // ---- CREATE WIDGET HTML ----
    function createWidget() {
        // Button
        const btn = document.createElement('button');
        btn.id = 'vyWidgetBtn';
        btn.innerHTML = '💬';
        btn.title = 'Chat with Vinayak AI';
        document.body.appendChild(btn);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'vyWidgetPanel';
        panel.innerHTML = `
            <div class="vyw-head">
                <img id="vywAvatar" src="${BASE_URL}/images/logo.png" alt="Vinayak AI" onerror="this.style.display='none'">
                <div class="vyw-head-info">
                    <div class="vyw-head-name" id="vywName">Vinayak AI</div>
                    <div class="vyw-status">Online • 24x7</div>
                </div>
                <button class="vyw-head-btn" id="vywClear" title="Clear">🗑️</button>
                <a href="${BASE_URL}/ai/vinayak-ai.html" class="vyw-head-btn" title="Full screen" style="text-decoration:none;">⛶</a>
            </div>
            <div class="vyw-summarize" id="vywSummarizeBar" style="display:none;">
                <span>📄 Summarize this page?</span>
                <button id="vywSummarizeBtn">Summarize</button>
            </div>
            <div class="vyw-messages" id="vywMessages"></div>
            <div class="vyw-quick" id="vywQuick"></div>
            <div class="vyw-input-wrap">
                <textarea class="vyw-input" id="vywInput" placeholder="Ask me anything..." rows="1"></textarea>
                <button class="vyw-send" id="vywSend">➤</button>
            </div>
            <div class="vyw-footer">
                <a href="${BASE_URL}/contact.html" class="vyw-footer-btn">📞 Contact</a>
                <a href="${BASE_URL}/products.html" class="vyw-footer-btn">📦 Products</a>
                <a href="${BASE_URL}/ai/vinayak-ai.html" class="vyw-footer-btn">💬 Full Chat</a>
            </div>
        `;
        document.body.appendChild(panel);

        return { btn, panel };
    }

    // ---- ADD MESSAGE ----
    function addMessage(from, text) {
        const messages = document.getElementById('vywMessages');
        if (!messages) return;

        const typing = messages.querySelector('.vyw-typing');
        if (typing) typing.remove();

        const div = document.createElement('div');
        div.className = `vyw-msg ${from}`;

        const avatarHtml = from === 'bot'
            ? `<img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span>`
            : '<span>You</span>';

        const safe = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/([\w.-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');

        div.innerHTML = `
            <div class="vyw-msg-avatar">${avatarHtml}</div>
            <div class="vyw-bubble">${safe}</div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        history.push({ from, text, ts: Date.now() });
        try { localStorage.setItem('vyw_history', JSON.stringify(history.slice(-30))); } catch(e) {}
    }

    // ---- TYPING ----
    function showTyping() {
        const messages = document.getElementById('vywMessages');
        const div = document.createElement('div');
        div.className = 'vyw-msg bot vyw-typing';
        div.innerHTML = `
            <div class="vyw-msg-avatar">
                <img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span>
            </div>
            <div class="vyw-bubble">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // ---- SEND ----
    async function send() {
        const input = document.getElementById('vywInput');
        const text = input.value.trim();
        if (!text) return;

        addMessage('user', text);
        input.value = '';
        input.style.height = 'auto';

        showTyping();

        await loadAll();
        setTimeout(() => {
            const match = matchAll(text);
            addMessage('bot', match.reply);
        }, 400 + Math.random() * 600);
    }

    // ---- QUICK REPLIES ----
    function renderQuick() {
        const el = document.getElementById('vywQuick');
        if (!el || !QUICK_REPLIES) return;
        const items = QUICK_REPLIES.initial || [];
        el.innerHTML = items.map(i => `
            <button class="vyw-chip" data-q="${i.query}">
                ${lang === 'hi' && i.labelHi ? i.labelHi : i.label}
            </button>
        `).join('');
        el.querySelectorAll('.vyw-chip').forEach(b => {
            b.onclick = () => {
                document.getElementById('vywInput').value = b.dataset.q;
                send();
            };
        });
    }

    // ---- CLEAR ----
    function clearChat() {
        history = [];
        localStorage.removeItem('vyw_history');
        const messages = document.getElementById('vywMessages');
        messages.innerHTML = '';
        const welcome = lang === 'hi' && CONFIG.welcomeMessageHi ? CONFIG.welcomeMessageHi : (CONFIG.welcomeMessage || 'Hi! How can I help?');
        addMessage('bot', welcome);
    }

    // ---- INIT ----
    async function init() {
        const { btn, panel } = createWidget();

        btn.onclick = async () => {
            panelOpen = !panelOpen;
            panel.classList.toggle('open', panelOpen);
            btn.classList.toggle('open', panelOpen);
            btn.innerHTML = panelOpen ? '✕' : '💬';

            if (panelOpen && !initialized) {
                await loadAll();
                applyConfig();
                // Restore or welcome
                if (history.length > 0) {
                    history.slice(-10).forEach(m => {
                        // Silent restore (no duplicate save)
                        const messages = document.getElementById('vywMessages');
                        const div = document.createElement('div');
                        div.className = `vyw-msg ${m.from}`;
                        const avatar = m.from === 'bot'
                            ? `<img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span>`
                            : '<span>You</span>';
                        const safe = String(m.text).replace(/\n/g, '<br>');
                        div.innerHTML = `<div class="vyw-msg-avatar">${avatar}</div><div class="vyw-bubble">${safe}</div>`;
                        messages.appendChild(div);
                    });
                    const messages = document.getElementById('vywMessages');
                    messages.scrollTop = messages.scrollHeight;
                } else {
                    const welcome = lang === 'hi' && CONFIG.welcomeMessageHi ? CONFIG.welcomeMessageHi : (CONFIG.welcomeMessage || 'Hi! I am Vinayak AI.');
                    addMessage('bot', welcome);
                }
                renderQuick();
                // Show summarize bar if applicable
                const summary = getCurrentPageSummary();
                if (summary) {
                    const bar = document.getElementById('vywSummarizeBar');
                    if (bar) {
                        bar.style.display = 'flex';
                        document.getElementById('vywSummarizeBtn').onclick = () => {
                            const s = lang === 'hi' && summary.summaryHi ? summary.summaryHi : summary.summary;
                            addMessage('user', lang === 'hi' ? `इस पेज का सारांश` : `Summarize this page`);
                            setTimeout(() => addMessage('bot', `📄 **${summary.title}**\n\n${s}`), 400);
                        };
                    }
                }
            }
        };

        // Events
        document.getElementById('vywSend').onclick = send;
        document.getElementById('vywClear').onclick = clearChat;
        const input = document.getElementById('vywInput');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 80) + 'px';
        });
    }

    function applyConfig() {
        const nameEl = document.getElementById('vywName');
        if (nameEl && CONFIG) {
            nameEl.textContent = lang === 'hi' && CONFIG.aiNameHi ? CONFIG.aiNameHi : (CONFIG.aiName || 'Vinayak AI');
        }
    }

    // ---- BOOT ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for manual control
    window.VinayakWidget = { open: () => document.getElementById('vyWidgetBtn')?.click() };
})();