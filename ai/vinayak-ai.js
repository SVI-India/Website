// ============================================================
// VINAYAK AI — Main Chat Logic
// ============================================================

(function() {
    'use strict';

    // ---- CONFIG ----
    const BASE_URL = 'https://www.sveindia.mywire.org';
    const DATA_PATH = '/ai/data';

    // ---- STATE ----
    let CONFIG = null;
    let RESPONSES = null;
    let FALLBACKS = null;
    let QUICK_REPLIES = null;
    let KEYWORDS = null;
    let FAQ = null;
    let lang = localStorage.getItem('lang') || 'en';
    let chatHistory = JSON.parse(localStorage.getItem('vy_chat_history') || '[]');

    // ---- DOM ----
    const $ = (sel) => document.querySelector(sel);
    const messagesEl = $('#vyMessages');
    const inputEl = $('#vyInput');
    const sendBtn = $('#vySend');
    const quickEl = $('#vyQuick');
    const headName = $('#vyHeadName');
    const headImg = $('#vyHeadImg');
    const statusEl = $('#vyStatus');
    const clearBtn = $('#vyClear');
    const voiceBtn = $('#vyVoice');

    // ---- LOAD DATA ----
    async function loadData() {
        try {
            const [cfg, resp, fb, qr, kw, faq] = await Promise.all([
                fetch(`${DATA_PATH}/config.json`).then(r => r.json()),
                fetch(`${DATA_PATH}/responses.json`).then(r => r.json()),
                fetch(`${DATA_PATH}/fallbacks.json`).then(r => r.json()),
                fetch(`${DATA_PATH}/quick-replies.json`).then(r => r.json()),
                fetch(`${DATA_PATH}/keywords.json`).then(r => r.json()),
                fetch(`${DATA_PATH}/faq.json`).then(r => r.json())
            ]);
            CONFIG = cfg;
            RESPONSES = resp;
            FALLBACKS = fb;
            QUICK_REPLIES = qr;
            KEYWORDS = kw;
            FAQ = faq;
            applyConfig();
        } catch (e) {
            console.error('Data load failed:', e);
            addMessage('bot', 'Sorry, I couldn\'t load my data. Please refresh the page.');
        }
    }

    // ---- APPLY CONFIG ----
    function applyConfig() {
        if (!CONFIG) return;
        headName.textContent = lang === 'hi' ? (CONFIG.aiNameHi || CONFIG.aiName) : CONFIG.aiName;
        if (CONFIG.avatar && headImg) headImg.src = CONFIG.avatar;

        // Welcome message
        if (chatHistory.length === 0) {
            const welcome = lang === 'hi' ? CONFIG.welcomeMessageHi : CONFIG.welcomeMessage;
            addMessage('bot', welcome);
            chatHistory.push({ from: 'bot', text: welcome, ts: Date.now() });
            saveHistory();
            renderQuickReplies('initial');
        } else {
            // Restore history
            chatHistory.forEach(msg => addMessage(msg.from, msg.text, false));
            renderQuickReplies('initial');
        }
    }

    // ---- MATCH MESSAGE ----
    function matchMessage(text) {
        const t = text.toLowerCase().trim();

        // 1. Check greeting
        if (RESPONSES.greetings) {
            for (const g of RESPONSES.greetings) {
                if (g.patterns.some(p => t === p || t.includes(p))) {
                    return { reply: lang === 'hi' ? g.replyHi : g.reply };
                }
            }
        }

        // 2. Check keywords to find category
        let matchedCategory = null;
        if (KEYWORDS) {
            for (const [cat, words] of Object.entries(KEYWORDS)) {
                if (words.some(w => t.includes(w.toLowerCase()))) {
                    matchedCategory = cat;
                    break;
                }
            }
        }

        // 3. Map category to response
        const catMap = {
            'product': 'products',
            'price': 'price',
            'bulk': 'bulk_order',
            'shipping': 'shipping',
            'refund': 'refund',
            'contact': 'contact',
            'about': 'about',
            'greeting': 'greetings',
            'thanks': 'thanks',
            'bye': 'bye'
        };

        const respKey = catMap[matchedCategory] || matchedCategory;
        if (respKey && RESPONSES[respKey]) {
            const items = RESPONSES[respKey];
            for (const item of items) {
                if (item.patterns.some(p => t.includes(p))) {
                    return { reply: lang === 'hi' ? item.replyHi : item.reply };
                }
            }
        }

        // 4. Check all responses as fallback
        for (const [key, items] of Object.entries(RESPONSES)) {
            for (const item of items) {
                if (item.patterns.some(p => t.includes(p))) {
                    return { reply: lang === 'hi' ? item.replyHi : item.reply };
                }
            }
        }

        // 5. Fallback
        const fb = FALLBACKS.fallbacks[Math.floor(Math.random() * FALLBACKS.fallbacks.length)];
        return { reply: lang === 'hi' ? fb.replyHi : fb.reply };
    }

    // ---- RENDER MESSAGE ----
    function addMessage(from, text, save = true) {
        if (!messagesEl) return;

        // Remove typing indicator
        const typing = messagesEl.querySelector('.vy-typing');
        if (typing) typing.remove();

        const div = document.createElement('div');
        div.className = `vy-msg ${from}`;

        const avatarHtml = from === 'bot'
            ? (CONFIG?.avatar ? `<img src="${CONFIG.avatar}" onerror="this.style.display='none'"><span>V</span>` : 'V')
            : '<span>You</span>';

        const safeText = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/(\/[\w\-.]+\.html)/g, `<a href="${BASE_URL}$1">$1</a>`)
            .replace(/([\w.-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');

        div.innerHTML = `
            <div class="vy-msg-avatar">${avatarHtml}</div>
            <div>
                <div class="vy-bubble">${safeText}</div>
                <span class="vy-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
        `;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        if (save) {
            chatHistory.push({ from, text, ts: Date.now() });
            saveHistory();
        }
    }

    // ---- TYPING INDICATOR ----
    function showTyping() {
        const div = document.createElement('div');
        div.className = 'vy-msg bot vy-typing';
        div.innerHTML = `
            <div class="vy-msg-avatar">
                ${CONFIG?.avatar ? `<img src="${CONFIG.avatar}" onerror="this.style.display='none'">` : ''}
                <span>V</span>
            </div>
            <div class="vy-bubble">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
        `;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // ---- SEND MESSAGE ----
    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        addMessage('user', text);
        inputEl.value = '';
        inputEl.style.height = 'auto';
        sendBtn.disabled = true;

        showTyping();

        // Simulate typing delay
        setTimeout(() => {
            const match = matchMessage(text);
            addMessage('bot', match.reply);
            sendBtn.disabled = false;

            // Suggest follow-ups
            if (text.toLowerCase().match(/product|nikolux|life|sanjivni/i)) {
                renderQuickReplies('afterProduct');
            }
        }, 500 + Math.random() * 800);
    }

    // ---- QUICK REPLIES ----
    function renderQuickReplies(type) {
        if (!quickEl || !QUICK_REPLIES || !CONFIG.features.quickReplies) return;
        const items = QUICK_REPLIES[type] || [];
        quickEl.innerHTML = items.map(item => `
            <button class="vy-chip" data-query="${item.query}">
                ${lang === 'hi' && item.labelHi ? item.labelHi : item.label}
            </button>
        `).join('');

        quickEl.querySelectorAll('.vy-chip').forEach(btn => {
            btn.onclick = () => {
                inputEl.value = btn.dataset.query;
                sendMessage();
            };
        });
    }

    // ---- SAVE / LOAD HISTORY ----
    function saveHistory() {
        try {
            localStorage.setItem('vy_chat_history', JSON.stringify(chatHistory.slice(-50)));
        } catch (e) {}
    }

    function clearHistory() {
        chatHistory = [];
        localStorage.removeItem('vy_chat_history');
        messagesEl.innerHTML = '';
        const welcome = lang === 'hi' ? CONFIG.welcomeMessageHi : CONFIG.welcomeMessage;
        addMessage('bot', welcome);
        renderQuickReplies('initial');
    }

    // ---- VOICE INPUT ----
    function initVoice() {
        if (!voiceBtn) return;
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceBtn.style.display = 'none';
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recog = new SpeechRecognition();
        recog.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        recog.interimResults = false;

        let listening = false;

        voiceBtn.onclick = () => {
            if (listening) {
                recog.stop();
                return;
            }
            recog.start();
            listening = true;
            voiceBtn.textContent = '🔴';
        };

        recog.onresult = (e) => {
            const text = e.results[0][0].transcript;
            inputEl.value = text;
            sendMessage();
        };

        recog.onend = () => {
            listening = false;
            voiceBtn.textContent = '🎤';
        };

        recog.onerror = () => {
            listening = false;
            voiceBtn.textContent = '🎤';
        };
    }

    // ---- EVENT LISTENERS ----
    function initEvents() {
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
    }

    // ---- INIT ----
    async function init() {
        await loadData();
        initEvents();
        console.log('✅ Vinayak AI ready');
    }

    // Expose globals
    window.VinayakAI = {
        init,
        send: sendMessage,
        clear: clearHistory,
        setLang: (l) => { lang = l; applyConfig(); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();