// ============================================================
// VINAYAK AI WIDGET — Universal Matcher + Lead Capture
// ============================================================

(function() {
    'use strict';

    const BASE_URL = 'https://www.sveindia.mywire.org';
    const DATA_PATH = BASE_URL + '/ai/data';

    let CONFIG = null;
    let DATA_BUNDLE = {};
    let lang = localStorage.getItem('lang') || 'en';
    let history = JSON.parse(localStorage.getItem('vyw_history') || '[]');
    let panelOpen = false;
    let dataLoaded = false;
    let messagesRendered = false;

    // ---- LOAD ALL DATA ----
    async function loadAll() {
        if (dataLoaded) return;
        const files = [
            'config', 'responses', 'fallbacks', 'quick-replies', 'keywords',
            'faq', 'products', 'help', 'policies', 'greetings',
            'contact', 'company', 'catalog', 'page-summaries', 'leads-config'
        ];
        try {
            const results = await Promise.all(
                files.map(f => fetch(`${DATA_PATH}/${f}.json?v=${Date.now()}`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null))
            );
            files.forEach((f, i) => {
                if (results[i]) DATA_BUNDLE[f] = results[i];
            });
            CONFIG = DATA_BUNDLE.config || {
                aiName: 'Vinayak AI',
                aiNameHi: 'विनयक AI',
                welcomeMessage: 'Hi! I am Vinayak AI 👋 How can I help you?',
                welcomeMessageHi: 'नमस्ते! मैं विनयक AI हूँ 👋 कैसे मदद कर सकता हूँ?'
            };
            dataLoaded = true;

            console.log('═══════════════════════════════════════');
            console.log('✅ VINAYAK AI DATA LOADED');
            console.log('═══════════════════════════════════════');
            Object.entries(DATA_BUNDLE).forEach(([k, v]) => {
                const c = countPatterns(v);
                if (c > 0) console.log(`  ${k.padEnd(18)}: ${c} patterns`);
            });
            console.log('═══════════════════════════════════════');
        } catch (e) {
            console.error('❌ Data load failed:', e);
            dataLoaded = true;
        }
    }

    function countPatterns(obj, depth = 0) {
        if (depth > 8 || !obj) return 0;
        let count = 0;
        if (Array.isArray(obj)) {
            obj.forEach(item => count += countPatterns(item, depth + 1));
        } else if (typeof obj === 'object') {
            if (Array.isArray(obj.patterns)) count += obj.patterns.length;
            Object.values(obj).forEach(v => count += countPatterns(v, depth + 1));
        }
        return count;
    }

    // ---- UNIVERSAL PATTERN WALKER ----
    function findMatches(obj, text) {
        const matches = [];
        const t = text.toLowerCase().trim();

        function walk(node, path) {
            if (!node || typeof node !== 'object') return;

            if (Array.isArray(node.patterns) && (node.reply || node.replyHi)) {
                for (const p of node.patterns) {
                    const pattern = String(p).toLowerCase().trim();
                    if (!pattern) continue;
                    let priority = 0;
                    if (t === pattern) priority = 3;
                    else if (new RegExp('\\b' + escapeRegex(pattern) + '\\b').test(t)) priority = 2;
                    else if (t.includes(pattern)) priority = 1;

                    if (priority > 0) {
                        matches.push({ path, item: node, pattern: p, priority });
                        break;
                    }
                }
            }

            if (Array.isArray(node)) {
                node.forEach((item, i) => walk(item, `${path}[${i}]`));
            } else {
                Object.entries(node).forEach(([k, v]) => {
                    if (['patterns', 'reply', 'replyHi'].includes(k)) return;
                    walk(v, path ? `${path}.${k}` : k);
                });
            }
        }
        walk(obj, '');
        return matches;
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ---- MATCH ----
    function matchAll(text) {
        const t = text.toLowerCase().trim();
        if (!t) return { reply: '...' };

        const sources = ['greetings', 'help', 'policies', 'contact', 'company', 'catalog', 'responses', 'faq'];
        for (const srcKey of sources) {
            const source = DATA_BUNDLE[srcKey];
            if (!source) continue;
            const matches = findMatches(source, t);
            if (matches.length) {
                const best = matches.sort((a, b) => b.priority - a.priority)[0];
                const item = best.item;
                const reply = (lang === 'hi' && item.replyHi) ? item.replyHi : item.reply;
                if (reply) {
                    console.log(`✅ MATCH [${srcKey}] "${best.pattern}"`);
                    return { reply };
                }
            }
        }

        if (DATA_BUNDLE.products) {
            for (const [id, p] of Object.entries(DATA_BUNDLE.products)) {
                if (!p) continue;
                const nameLower = (p.name || '').toLowerCase();
                const nameHi = p.nameHi || '';
                if (t.includes(id.toLowerCase()) ||
                    (nameLower && t.includes(nameLower)) ||
                    (nameHi && t.includes(nameHi))) {
                    return { reply: productReply(p) };
                }
            }
        }

        if (DATA_BUNDLE.keywords) {
            for (const [cat, words] of Object.entries(DATA_BUNDLE.keywords)) {
                if (!Array.isArray(words)) continue;
                for (const w of words) {
                    if (t.includes(String(w).toLowerCase())) {
                        const srcs = ['help', 'responses', 'policies'];
                        for (const sk of srcs) {
                            if (!DATA_BUNDLE[sk]) continue;
                            const m = findMatches(DATA_BUNDLE[sk], w);
                            if (m.length) {
                                const item = m[0].item;
                                const reply = (lang === 'hi' && item.replyHi) ? item.replyHi : item.reply;
                                if (reply) return { reply };
                            }
                        }
                    }
                }
            }
        }

        const fbList = (DATA_BUNDLE.fallbacks && DATA_BUNDLE.fallbacks.fallbacks) || [];
        const fb = fbList.length ? fbList[Math.floor(Math.random() * fbList.length)] : null;
        const reply = fb
            ? (lang === 'hi' && fb.replyHi ? fb.replyHi : fb.reply)
            : 'Sorry, I didn\'t understand.\n\nTry asking:\n• Products\n• Pricing\n• Bulk orders\n• Shipping\n• Refund policy\n• Contact';
        return { reply };
    }

    function productReply(p) {
        const name = (lang === 'hi' && p.nameHi) ? p.nameHi : (p.name || '');
        const tag = (lang === 'hi' && p.taglineHi) ? p.taglineHi : (p.tagline || '');
        const feats = (lang === 'hi' && p.featuresHi) ? p.featuresHi : (p.features || []);
        const sizes = (p.sizes || []).join(' / ');
        const link = p.page ? BASE_URL + p.page : BASE_URL + '/products.html';
        const desc = (lang === 'hi' && p.descriptionHi) ? p.descriptionHi : (p.description || '');

        let text = `⭐ ${name}\n\n`;
        if (tag) text += `${tag}\n\n`;
        if (desc) text += `${desc}\n\n`;
        if (feats.length) text += `✅ Features:\n${feats.map(f => '• ' + f).join('\n')}\n\n`;
        if (sizes) text += `📦 Sizes: ${sizes}\n\n`;
        text += `🔗 More info: ${link}`;
        return text;
    }

    function getCurrentPageSummary() {
        const s = DATA_BUNDLE['page-summaries'];
        if (!s || !s.summaries) return null;
        const filename = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        return s.summaries[filename] || null;
    }

    // ---- CREATE WIDGET ----
    function createWidget() {
        const btn = document.createElement('button');
        btn.id = 'vyWidgetBtn';
        btn.innerHTML = '💬';
        btn.title = 'Chat with Vinayak AI';
        document.body.appendChild(btn);

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

    function addMessage(from, text, save = true) {
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
            .replace(/([\w.+-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');

        div.innerHTML = `
            <div class="vyw-msg-avatar">${avatarHtml}</div>
            <div class="vyw-bubble">${safe}</div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        if (save) {
            history.push({ from, text, ts: Date.now() });
            try { localStorage.setItem('vyw_history', JSON.stringify(history.slice(-30))); } catch(e) {}
        }
    }

    function showTyping() {
        const messages = document.getElementById('vywMessages');
        if (!messages) return;
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

    // ---- SEND (with lead capture) ----
    async function send() {
        const input = document.getElementById('vywInput');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        addMessage('user', text);
        input.value = '';
        input.style.height = 'auto';

        showTyping();
        await loadAll();

        // 🔥 CHECK FOR LEAD CAPTURE
        if (window.SVE_LEADS) {
            try {
                const leadResult = await window.SVE_LEADS.processMessage(text, lang);
                if (leadResult) {
                    setTimeout(() => {
                        addMessage('bot', leadResult.reply);
                    }, 400 + Math.random() * 400);
                    return;
                }
            } catch (e) {
                console.warn('Lead process error:', e);
            }
        }

        // Normal matching
        setTimeout(() => {
            const match = matchAll(text);
            addMessage('bot', match.reply);
        }, 400 + Math.random() * 400);
    }

    function renderQuick() {
        const el = document.getElementById('vywQuick');
        const qr = DATA_BUNDLE['quick-replies'];
        if (!el || !qr) return;
        const items = qr.initial || [];
        el.innerHTML = items.map(i => `
            <button class="vyw-chip" data-q="${escapeHtml(i.query)}">
                ${escapeHtml((lang === 'hi' && i.labelHi) ? i.labelHi : i.label)}
            </button>
        `).join('');
        el.querySelectorAll('.vyw-chip').forEach(b => {
            b.onclick = () => {
                const inp = document.getElementById('vywInput');
                if (inp) inp.value = b.dataset.q;
                send();
            };
        });
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function clearChat() {
        history = [];
        localStorage.removeItem('vyw_history');
        if (window.SVE_LEADS) window.SVE_LEADS.reset();
        const messages = document.getElementById('vywMessages');
        if (messages) messages.innerHTML = '';
        const welcome = (lang === 'hi' && CONFIG.welcomeMessageHi)
            ? CONFIG.welcomeMessageHi
            : (CONFIG.welcomeMessage || 'Hi! I am Vinayak AI.');
        addMessage('bot', welcome);
    }

    function applyConfig() {
        const nameEl = document.getElementById('vywName');
        if (nameEl && CONFIG) {
            nameEl.textContent = (lang === 'hi' && CONFIG.aiNameHi)
                ? CONFIG.aiNameHi
                : (CONFIG.aiName || 'Vinayak AI');
        }
    }

    function renderHistory() {
        const messages = document.getElementById('vywMessages');
        if (!messages) return;
        history.slice(-10).forEach(m => {
            const div = document.createElement('div');
            div.className = `vyw-msg ${m.from}`;
            const avatar = m.from === 'bot'
                ? `<img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span>`
                : '<span>You</span>';
            const safe = String(m.text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
            div.innerHTML = `<div class="vyw-msg-avatar">${avatar}</div><div class="vyw-bubble">${safe}</div>`;
            messages.appendChild(div);
        });
        messages.scrollTop = messages.scrollHeight;
    }

    async function init() {
        const { btn, panel } = createWidget();

        btn.onclick = async () => {
            panelOpen = !panelOpen;
            panel.classList.toggle('open', panelOpen);
            btn.classList.toggle('open', panelOpen);
            btn.innerHTML = panelOpen ? '✕' : '💬';

            if (panelOpen && !messagesRendered) {
                await loadAll();
                applyConfig();

                if (history.length > 0) {
                    renderHistory();
                } else {
                    const welcome = (lang === 'hi' && CONFIG.welcomeMessageHi)
                        ? CONFIG.welcomeMessageHi
                        : (CONFIG.welcomeMessage || 'Hi! I am Vinayak AI.');
                    addMessage('bot', welcome);
                }
                renderQuick();
                messagesRendered = true;

                const summary = getCurrentPageSummary();
                if (summary) {
                    const bar = document.getElementById('vywSummarizeBar');
                    if (bar) {
                        bar.style.display = 'flex';
                        document.getElementById('vywSummarizeBtn').onclick = () => {
                            const s = (lang === 'hi' && summary.summaryHi) ? summary.summaryHi : summary.summary;
                            addMessage('user', lang === 'hi' ? 'इस पेज का सारांश' : 'Summarize this page');
                            setTimeout(() => addMessage('bot', `📄 **${summary.title}**\n\n${s}`), 400);
                        };
                    }
                }
            }
        };

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

        window.vyTest = (text) => matchAll(text);
        window.vyData = () => DATA_BUNDLE;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();