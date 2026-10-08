// ============================================================
// VINAYAK AI — Full Page Chat (v2 Universal Matcher)
// ============================================================

(function() {
    'use strict';

    const BASE_URL = 'https://www.sveindia.mywire.org';
    const DATA_PATH = BASE_URL + '/ai/data';

    let CONFIG = null;
    let DATA_BUNDLE = {};
    let lang = localStorage.getItem('lang') || 'en';
    let history = JSON.parse(localStorage.getItem('vy_chat_history') || '[]');
    let dataLoaded = false;

    // ---- DOM ----
    const messagesEl = document.getElementById('vyMessages');
    const inputEl = document.getElementById('vyInput');
    const sendBtn = document.getElementById('vySend');
    const quickEl = document.getElementById('vyQuick');
    const headName = document.getElementById('vyHeadName');
    const headImg = document.getElementById('vyHeadImg');
    const clearBtn = document.getElementById('vyClear');
    const voiceBtn = document.getElementById('vyVoice');

    // ---- LOAD ALL DATA ----
    async function loadAll() {
        if (dataLoaded) return;
        const files = [
            'config', 'responses', 'fallbacks', 'quick-replies', 'keywords',
            'faq', 'products', 'help', 'policies', 'greetings',
            'contact', 'company', 'catalog', 'page-summaries'
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
            console.log('✅ Vinayak AI FULL PAGE loaded:', Object.keys(DATA_BUNDLE));
        } catch (e) {
            console.error('Data load failed:', e);
            dataLoaded = true;
        }
    }

    // ---- COUNT PATTERNS ----
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

        // Product
        if (DATA_BUNDLE.products) {
            for (const [id, p] of Object.entries(DATA_BUNDLE.products)) {
                if (!p) continue;
                const nameLower = (p.name || '').toLowerCase();
                const nameHi = p.nameHi || '';
                if (t.includes(id.toLowerCase()) || (nameLower && t.includes(nameLower)) || (nameHi && t.includes(nameHi))) {
                    return { reply: productReply(p) };
                }
            }
        }

        // Keywords
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

        // Fallback
        const fbList = (DATA_BUNDLE.fallbacks && DATA_BUNDLE.fallbacks.fallbacks) || [];
        const fb = fbList.length ? fbList[Math.floor(Math.random() * fbList.length)] : null;
        const reply = fb
            ? (lang === 'hi' && fb.replyHi ? fb.replyHi : fb.reply)
            : 'Sorry, I didn\'t understand.\n\nTry asking about:\n• Products\n• Pricing\n• Bulk orders\n• Shipping\n• Refund policy\n• Contact';
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

    // ---- ADD MESSAGE ----
    function addMessage(from, text, save = true) {
        if (!messagesEl) return;
        const typing = messagesEl.querySelector('.vy-typing');
        if (typing) typing.remove();

        const div = document.createElement('div');
        div.className = `vy-msg ${from}`;

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
            <div class="vy-msg-avatar">${avatarHtml}</div>
            <div>
                <div class="vy-bubble">${safe}</div>
                <span class="vy-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
        `;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        if (save) {
            history.push({ from, text, ts: Date.now() });
            try { localStorage.setItem('vy_chat_history', JSON.stringify(history.slice(-50))); } catch(e) {}
        }
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'vy-msg bot vy-typing';
        div.innerHTML = `
            <div class="vy-msg-avatar">
                <img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span>
            </div>
            <div class="vy-bubble">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
        `;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;
        addMessage('user', text);
        inputEl.value = '';
        inputEl.style.height = 'auto';
        sendBtn.disabled = true;
        showTyping();
        await loadAll();
        setTimeout(() => {
            const match = matchAll(text);
            addMessage('bot', match.reply);
            sendBtn.disabled = false;
        }, 400 + Math.random() * 400);
    }

    function renderQuick() {
        if (!quickEl) return;
        const qr = DATA_BUNDLE['quick-replies'];
        if (!qr) return;
        const items = qr.initial || [];
        quickEl.innerHTML = items.map(item => `
            <button class="vy-chip" data-query="${item.query}">
                ${(lang === 'hi' && item.labelHi) ? item.labelHi : item.label}
            </button>
        `).join('');
        quickEl.querySelectorAll('.vy-chip').forEach(btn => {
            btn.onclick = () => {
                inputEl.value = btn.dataset.query;
                sendMessage();
            };
        });
    }

    function clearHistory() {
        history = [];
        localStorage.removeItem('vy_chat_history');
        messagesEl.innerHTML = '';
        const welcome = (lang === 'hi' && CONFIG.welcomeMessageHi) ? CONFIG.welcomeMessageHi : (CONFIG.welcomeMessage || 'Hi!');
        addMessage('bot', welcome);
        renderQuick();
    }

    function initVoice() {
        if (!voiceBtn) return;
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceBtn.style.display = 'none';
            return;
        }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recog = new SR();
        recog.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        recog.interimResults = false;
        let listening = false;
        voiceBtn.onclick = () => {
            if (listening) { recog.stop(); return; }
            recog.start();
            listening = true;
            voiceBtn.textContent = '🔴';
        };
        recog.onresult = (e) => {
            inputEl.value = e.results[0][0].transcript;
            sendMessage();
        };
        recog.onend = () => { listening = false; voiceBtn.textContent = '🎤'; };
        recog.onerror = () => { listening = false; voiceBtn.textContent = '🎤'; };
    }

    function applyConfig() {
        if (!CONFIG) return;
        headName.textContent = (lang === 'hi' && CONFIG.aiNameHi) ? CONFIG.aiNameHi : (CONFIG.aiName || 'Vinayak AI');
        if (CONFIG.avatar && headImg) headImg.src = CONFIG.avatar;
    }

    async function init() {
        await loadAll();
        applyConfig();

        // Welcome or restore
        if (history.length > 0) {
            history.forEach(m => {
                const div = document.createElement('div');
                div.className = `vy-msg ${m.from}`;
                const avatar = m.from === 'bot'
                    ? `<img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span>`
                    : '<span>You</span>';
                const safe = String(m.text)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>');
                div.innerHTML = `<div class="vy-msg-avatar">${avatar}</div><div><div class="vy-bubble">${safe}</div></div>`;
                messagesEl.appendChild(div);
            });
            messagesEl.scrollTop = messagesEl.scrollHeight;
        } else {
            const welcome = (lang === 'hi' && CONFIG.welcomeMessageHi) ? CONFIG.welcomeMessageHi : (CONFIG.welcomeMessage || 'Hi! I am Vinayak AI.');
            addMessage('bot', welcome);
        }
        renderQuick();

        // Events
        sendBtn.onclick = sendMessage;
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        inputEl.addEventListener('input', () => {
            inputEl.style.height = 'auto';
            inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
        });
        if (clearBtn) clearBtn.onclick = clearHistory;
        initVoice();

        // Debug
        window.vyTest = (text) => matchAll(text);
        window.vyData = () => DATA_BUNDLE;

        console.log('✅ Vinayak AI Full Page ready');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();