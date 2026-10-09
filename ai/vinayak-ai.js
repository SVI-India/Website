// ============================================================
// VINAYAK AI — Full Page Chat (Smart Version)
// ============================================================

(function() {
    'use strict';

    const BASE_URL = 'https://www.sveindia.mywire.org';
    const DATA_PATH = BASE_URL + '/ai/data';

    let CONFIG = null;
    let SMART = null;
    let DATA_BUNDLE = {};
    let lang = localStorage.getItem('lang') || 'en';
    let history = JSON.parse(localStorage.getItem('vy_chat_history') || '[]');
    let dataLoaded = false;
    let sessionContext = { viewedProducts: [], lastIntent: null };

    // ---- DOM ----
    const messagesEl = document.getElementById('vyMessages');
    const inputEl = document.getElementById('vyInput');
    const sendBtn = document.getElementById('vySend');
    const quickEl = document.getElementById('vyQuick');
    const headName = document.getElementById('vyHeadName');
    const headImg = document.getElementById('vyHeadImg');
    const clearBtn = document.getElementById('vyClear');
    const voiceBtn = document.getElementById('vyVoice');

    // ---- LOAD DATA ----
    async function loadAll() {
        if (dataLoaded) return;
        const files = [
            'config', 'smart-config', 'responses', 'fallbacks', 'quick-replies',
            'keywords', 'sentence-patterns',
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
            CONFIG = DATA_BUNDLE.config || {};
            SMART = DATA_BUNDLE['smart-config'] || {};
            dataLoaded = true;
            console.log('✅ Vinayak AI FULL PAGE ready:', Object.keys(DATA_BUNDLE).length, 'files');
        } catch (e) {
            console.error('Data load failed:', e);
            dataLoaded = true;
        }
    }

    // ---- TIME GREETING ----
    function getTimeGreeting() {
        const h = new Date().getHours();
        const tg = SMART.timeGreetings || {};
        for (const [key, val] of Object.entries(tg)) {
            if (h >= val.from && h < val.to) {
                return {
                    greeting: lang === 'hi' ? val.hi : val.en,
                    emoji: val.emoji,
                    chip: val.chip,
                    key: key
                };
            }
        }
        return { greeting: 'Hello', emoji: '👋', chip: 'Hi', key: 'default' };
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
                    if (['patterns', 'reply', 'replyHi', 'examples'].includes(k)) return;
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

    // ---- SENTENCE PATTERN MATCHER ----
    function findBestSentencePattern(text, patterns) {
        let best = null;
        let bestScore = 0;

        for (const p of patterns) {
            if (!p.examples) continue;
            for (const example of p.examples) {
                const score = computeSimilarity(text, example.toLowerCase());
                if (score > bestScore && score >= 0.65) {
                    bestScore = score;
                    best = { ...p, score };
                }
            }
        }
        return best;
    }

    function computeSimilarity(a, b) {
        const wordsA = a.split(/\s+/).filter(Boolean);
        const wordsB = b.split(/\s+/).filter(Boolean);
        if (!wordsA.length || !wordsB.length) return 0;

        const setB = new Set(wordsB);
        let matches = 0;
        for (const w of wordsA) {
            if (setB.has(w)) matches++;
            else {
                for (const bw of wordsB) {
                    if (w.length > 3 && bw.length > 3 &&
                        (w.startsWith(bw.substring(0, 4)) || bw.startsWith(w.substring(0, 4)))) {
                        matches += 0.5;
                        break;
                    }
                }
            }
        }
        const baseScore = matches / Math.max(wordsA.length, wordsB.length);
        const lenRatio = Math.min(wordsA.length, wordsB.length) / Math.max(wordsA.length, wordsB.length);
        return baseScore * 0.75 + lenRatio * 0.25;
    }

    function detectAllKeywords(text, keywordsData) {
        const found = new Set();
        if (!keywordsData.keywords) return [];
        for (const [cat, words] of Object.entries(keywordsData.keywords)) {
            if (!Array.isArray(words)) continue;
            for (const w of words) {
                if (text.includes(String(w).toLowerCase())) found.add(cat);
            }
        }
        return Array.from(found);
    }

    function normalizeWithFuzzy(text) {
        const keywordsData = DATA_BUNDLE.keywords;
        if (!keywordsData || !keywordsData.fuzzy) return text;
        let normalized = text;
        for (const [correct, misspellings] of Object.entries(keywordsData.fuzzy)) {
            for (const wrong of misspellings) {
                const regex = new RegExp('\\b' + escapeRegex(wrong) + '\\b', 'gi');
                normalized = normalized.replace(regex, correct);
            }
        }
        return normalized;
    }

    // ---- MAIN MATCH ----
    function matchAll(text) {
        const t = text.toLowerCase().trim();
        if (!t) return { reply: '...', matchType: null };

        // LAYER 1: Sentence patterns
        const sentenceData = DATA_BUNDLE['sentence-patterns'];
        if (sentenceData && sentenceData.patterns) {
            const bestPattern = findBestSentencePattern(t, sentenceData.patterns);
            if (bestPattern) {
                console.log(`✅ SENTENCE MATCH: ${bestPattern.id} (score: ${bestPattern.score.toFixed(2)})`);
                return {
                    reply: (lang === 'hi' && bestPattern.replyHi) ? bestPattern.replyHi : bestPattern.reply,
                    matchType: 'sentence',
                    matchPath: bestPattern.id
                };
            }
        }

        // LAYER 2: Fuzzy normalization
        const normalizedT = normalizeWithFuzzy(t);

        // LAYER 3: Combo matching
        const keywordsData = DATA_BUNDLE.keywords;
        if (keywordsData && keywordsData.combos) {
            const detectedKeywords = detectAllKeywords(normalizedT, keywordsData);
            for (const combo of keywordsData.combos) {
                if (combo.must_have.every(k => detectedKeywords.includes(k))) {
                    console.log(`✅ COMBO MATCH: ${combo.id}`);
                    return {
                        reply: (lang === 'hi' && combo.replyHi) ? combo.replyHi : combo.reply,
                        matchType: 'combo',
                        matchPath: combo.id
                    };
                }
            }
        }

        // LAYER 4: Structured sources
        const sources = ['greetings', 'help', 'policies', 'contact', 'company', 'catalog', 'responses', 'faq'];
        for (const srcKey of sources) {
            const source = DATA_BUNDLE[srcKey];
            if (!source) continue;
            const matches = findMatches(source, normalizedT);
            if (matches.length) {
                const best = matches.sort((a, b) => b.priority - a.priority)[0];
                const item = best.item;
                const reply = (lang === 'hi' && item.replyHi) ? item.replyHi : item.reply;
                if (reply) {
                    console.log(`✅ MATCH [${srcKey}]`);
                    return { reply, matchType: srcKey, matchPath: best.path };
                }
            }
        }

        // LAYER 5: Product
        if (DATA_BUNDLE.products) {
            for (const [id, p] of Object.entries(DATA_BUNDLE.products)) {
                if (!p) continue;
                const nameLower = (p.name || '').toLowerCase();
                const nameHi = p.nameHi || '';
                if (normalizedT.includes(id.toLowerCase()) ||
                    (nameLower && normalizedT.includes(nameLower)) ||
                    (nameHi && normalizedT.includes(nameHi))) {
                    sessionContext.viewedProducts.push(id);
                    sessionContext.lastIntent = 'product';
                    return { reply: productReply(p), matchType: 'product', productId: id };
                }
            }
        }

        // LAYER 6: Single keyword fallback
        if (keywordsData && keywordsData.keywords) {
            for (const [cat, words] of Object.entries(keywordsData.keywords)) {
                if (!Array.isArray(words)) continue;
                for (const w of words) {
                    if (normalizedT.includes(String(w).toLowerCase())) {
                        const srcs = ['help', 'responses', 'policies'];
                        for (const sk of srcs) {
                            if (!DATA_BUNDLE[sk]) continue;
                            const m = findMatches(DATA_BUNDLE[sk], w);
                            if (m.length) {
                                const item = m[0].item;
                                const reply = (lang === 'hi' && item.replyHi) ? item.replyHi : item.reply;
                                if (reply) {
                                    sessionContext.lastIntent = cat;
                                    return { reply, matchType: cat };
                                }
                            }
                        }
                    }
                }
            }
        }

        // FALLBACK
        const fbList = (DATA_BUNDLE.fallbacks && DATA_BUNDLE.fallbacks.fallbacks) || [];
        const fb = fbList.length ? fbList[Math.floor(Math.random() * fbList.length)] : null;
        const reply = fb
            ? (lang === 'hi' && fb.replyHi ? fb.replyHi : fb.reply)
            : 'Sorry, I didn\'t understand.\n\nTry:\n• Products\n• Pricing\n• Bulk orders\n• Shipping\n• Contact';
        return { reply, matchType: 'fallback' };
    }

    function productReply(p) {
        const name = (lang === 'hi' && p.nameHi) ? p.nameHi : (p.name || '');
        const tag = (lang === 'hi' && p.taglineHi) ? p.taglineHi : (p.tagline || '');
        const feats = (lang === 'hi' && p.featuresHi) ? p.featuresHi : (p.features || []);
        const sizes = (p.sizes || []).join(' / ');
        const desc = (lang === 'hi' && p.descriptionHi) ? p.descriptionHi : (p.description || '');

        let text = `⭐ **${name}**\n\n`;
        if (tag) text += `_${tag}_\n\n`;
        if (desc) text += `${desc}\n\n`;
        if (feats.length) text += `✅ **Features:**\n${feats.map(f => '• ' + f).join('\n')}\n\n`;
        if (sizes) text += `📦 **Sizes:** ${sizes}`;
        return text;
    }

    // ---- BUILD INLINE BUTTONS ----
    function buildInlineButtons(replyText, matchType, matchPath) {
        const buttons = [];
        if (!SMART.smartLinks) return buttons;

        const t = (replyText || '').toLowerCase();
        const path = (matchPath || '').toLowerCase();
        const links = SMART.smartLinks;

        if (t.includes('contact') || t.includes('email') || t.includes('phone') || path.includes('contact')) {
            if (links.contact) buttons.push({ ...links.contact, type: 'primary' });
            if (SMART.emailLinks && SMART.emailLinks.info) {
                buttons.push({ label: 'Send Email', labelHi: 'ईमेल भेजें', icon: '📧', url: `mailto:${SMART.emailLinks.info}`, type: 'warning' });
            }
        }
        if (t.includes('nikolux') || path.includes('nikolux')) {
            if (links.nikolux) buttons.push({ ...links.nikolux, type: 'primary' });
        }
        if (t.includes('life star') || t.includes('lifestar') || path.includes('life')) {
            if (links['life-star']) buttons.push({ ...links['life-star'], type: 'primary' });
        }
        if (t.includes('sanjivni') || path.includes('sanjivni')) {
            if (links.sanjivni) buttons.push({ ...links.sanjivni, type: 'primary' });
        }
        if (t.includes('bulk') || t.includes('distributor') || path.includes('bulk') || path.includes('distributor')) {
            if (SMART.emailLinks && SMART.emailLinks.bulk) {
                buttons.push({ label: 'Bulk Enquiry', labelHi: 'थोक पूछताछ', icon: '📦', url: `mailto:${SMART.emailLinks.bulk}`, type: 'warning' });
            }
            if (links.contact) buttons.push({ ...links.contact, type: 'outline' });
        }
        if (t.includes('shipping') || t.includes('delivery') || path.includes('shipping') || path.includes('delivery')) {
            if (links.shipping) buttons.push({ ...links.shipping, type: 'outline' });
            if (SMART.emailLinks && SMART.emailLinks.orders) {
                buttons.push({ label: 'Track Order', labelHi: 'ऑर्डर ट्रैक', icon: '📍', url: `mailto:${SMART.emailLinks.orders}`, type: 'info' });
            }
        }
        if (t.includes('refund') || t.includes('return') || path.includes('refund')) {
            if (links.refund) buttons.push({ ...links.refund, type: 'outline' });
            if (SMART.emailLinks && SMART.emailLinks.orders) {
                buttons.push({ label: 'Report Issue', labelHi: 'समस्या रिपोर्ट', icon: '📧', url: `mailto:${SMART.emailLinks.orders}`, type: 'warning' });
            }
        }
        if (t.includes('price') || t.includes('pricing') || path.includes('price')) {
            if (SMART.emailLinks && SMART.emailLinks.sales) {
                buttons.push({ label: 'Get Quote', labelHi: 'कोट प्राप्त करें', icon: '💰', url: `mailto:${SMART.emailLinks.sales}`, type: 'warning' });
            }
        }
        if (t.includes('order') || path.includes('buy')) {
            if (SMART.emailLinks && SMART.emailLinks.orders) {
                buttons.push({ label: 'Order Now', labelHi: 'अभी ऑर्डर करें', icon: '🛒', url: `mailto:${SMART.emailLinks.orders}`, type: 'warning' });
            }
        }
        if (t.includes('product') && !buttons.length && links.products) {
            buttons.push({ ...links.products, type: 'primary' });
        }
        if (matchType === 'fallback') {
            if (links.contact) buttons.push({ ...links.contact, type: 'primary' });
            if (SMART.emailLinks && SMART.emailLinks.info) {
                buttons.push({ label: 'Email Us', labelHi: 'ईमेल करें', icon: '📧', url: `mailto:${SMART.emailLinks.info}`, type: 'warning' });
            }
        }

        const seen = new Set();
        return buttons.filter(b => {
            if (seen.has(b.url)) return false;
            seen.add(b.url);
            return true;
        }).slice(0, 3);
    }

    function renderInlineButtons(buttons) {
        if (!buttons.length) return '';
        return `
            <div class="vy-inline-buttons">
                ${buttons.map(b => {
                    const label = (lang === 'hi' && b.labelHi) ? b.labelHi : b.label;
                    return `<a href="${BASE_URL}${b.url}" class="vy-inline-btn ${b.type || 'outline'}" target="_blank" rel="noopener">
                        ${b.icon || ''} ${label}
                    </a>`;
                }).join('')}
            </div>
        `;
    }

    // ---- ADD MESSAGE ----
    function addMessage(from, text, save = true, buttons = []) {
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
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/([\w.+-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');

        const buttonsHtml = from === 'bot' ? renderInlineButtons(buttons) : '';

        div.innerHTML = `
            <div class="vy-msg-avatar">${avatarHtml}</div>
            <div>
                <div class="vy-bubble">${safe}${buttonsHtml}</div>
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

    // ---- SEND ----
    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;
        addMessage('user', text);
        inputEl.value = '';
        inputEl.style.height = 'auto';
        sendBtn.disabled = true;
        showTyping();
        await loadAll();

        // Lead capture
        if (window.SVE_LEADS) {
            try {
                const leadResult = await window.SVE_LEADS.processMessage(text, lang);
                if (leadResult) {
                    setTimeout(() => {
                        addMessage('bot', leadResult.reply);
                        sendBtn.disabled = false;
                        renderQuick('startup');
                    }, 400 + Math.random() * 400);
                    return;
                }
            } catch (e) {}
        }

        setTimeout(() => {
            const match = matchAll(text);
            const buttons = buildInlineButtons(match.reply, match.matchType, match.matchPath);
            addMessage('bot', match.reply, true, buttons);
            sendBtn.disabled = false;

            const chipType = (SMART.autoSuggestAfter || {})[match.matchType] || 'startup';
            renderQuick(chipType);
        }, 400 + Math.random() * 400);
    }

    // ---- QUICK REPLIES ----
    function renderQuick(type = 'startup') {
        if (!quickEl) return;
        const dynChips = SMART.dynamicChips || {};
        let items = dynChips[type] || [];

        if (!items.length && DATA_BUNDLE['quick-replies']) {
            items = DATA_BUNDLE['quick-replies'][type] || DATA_BUNDLE['quick-replies'].initial || [];
        }
        if (!items.length && type === 'startup') {
            const tg = getTimeGreeting();
            items = [
                { label: `👋 ${tg.chip}`, query: tg.chip.toLowerCase() },
                { label: '📦 Products', query: 'products' },
                { label: '💰 Pricing', query: 'price' },
                { label: '📞 Contact', query: 'contact' }
            ];
        }

        quickEl.innerHTML = items.map(i => `
            <button class="vy-chip" data-query="${escapeHtml(i.query)}">
                ${escapeHtml((lang === 'hi' && i.labelHi) ? i.labelHi : i.label)}
            </button>
        `).join('');

        quickEl.querySelectorAll('.vy-chip').forEach(btn => {
            btn.onclick = () => {
                inputEl.value = btn.dataset.query;
                sendMessage();
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

    // ---- CLEAR ----
    function clearHistory() {
        history = [];
        localStorage.removeItem('vy_chat_history');
        if (window.SVE_LEADS) window.SVE_LEADS.reset();
        messagesEl.innerHTML = '';
        showWelcome();
        renderQuick('startup');
    }

    function showWelcome() {
        const tg = getTimeGreeting();
        const welcome = (lang === 'hi' && CONFIG.welcomeMessageHi)
            ? CONFIG.welcomeMessageHi
            : (CONFIG.welcomeMessage || 'Hi! I am Vinayak AI.');
        const greeting = `${tg.emoji} **${tg.greeting}!**\n\n${welcome}`;
        const buttons = buildInlineButtons('', 'welcome', '');
        addMessage('bot', greeting, true, buttons);
    }

    // ---- VOICE INPUT ----
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

    // ---- INIT ----
    async function init() {
        await loadAll();
        applyConfig();

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
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                div.innerHTML = `<div class="vy-msg-avatar">${avatar}</div><div><div class="vy-bubble">${safe}</div></div>`;
                messagesEl.appendChild(div);
            });
            messagesEl.scrollTop = messagesEl.scrollHeight;
        } else {
            showWelcome();
        }
        renderQuick('startup');

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

        window.vyTest = (text) => matchAll(text);
        window.vyData = () => DATA_BUNDLE;
        window.vyGreet = getTimeGreeting;

        console.log('✅ Vinayak AI Full Page ready');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();