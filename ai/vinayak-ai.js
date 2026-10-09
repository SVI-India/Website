// ============================================================
// VINAYAK AI — Full Page Chat (Complete with Flow + Leads)
// ============================================================

(function() {
    'use strict';

    const BASE_URL = 'https://www.sveindia.mywire.org';
    const DATA_PATH = BASE_URL + '/ai/data';

    let CONFIG = null;
    let SMART = null;
    let FLOW = null;
    let DATA_BUNDLE = {};
    let lang = localStorage.getItem('lang') || 'en';
    let history = JSON.parse(localStorage.getItem('vy_chat_history') || '[]');
    let dataLoaded = false;
    let currentFlow = 'startup';
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
            'config', 'smart-config', 'conversation-flow',
            'responses', 'fallbacks', 'quick-replies', 'keywords', 'sentence-patterns',
            'faq', 'products', 'help', 'policies', 'greetings',
            'contact', 'company', 'catalog', 'page-summaries', 'leads-config'
        ];
        try {
            const results = await Promise.all(
                files.map(f => fetch(`${DATA_PATH}/${f}.json?v=${Date.now()}`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null))
            );
            files.forEach((f, i) => { if (results[i]) DATA_BUNDLE[f] = results[i]; });
            CONFIG = DATA_BUNDLE.config || { aiName: 'Vinayak AI', aiNameHi: 'विनयक AI', welcomeMessage: 'Hi! I am Vinayak AI 👋', welcomeMessageHi: 'नमस्ते! मैं विनयक AI हूँ 👋' };
            SMART = DATA_BUNDLE['smart-config'] || {};
            FLOW = DATA_BUNDLE['conversation-flow'] || {};
            dataLoaded = true;
            console.log('✅ Vinayak AI FULL PAGE ready:', Object.keys(DATA_BUNDLE).length, 'files');
            console.log('📋 Flow loaded:', FLOW && FLOW.flows ? Object.keys(FLOW.flows).length : 0, 'flows');
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
                return { greeting: lang === 'hi' ? val.hi : val.en, emoji: val.emoji, chip: val.chip, key };
            }
        }
        return { greeting: 'Hello', emoji: '👋', chip: 'Hi', key: 'default' };
    }

    // ---- PATTERN WALKER ----
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
            if (Array.isArray(node)) node.forEach((item, i) => walk(item, `${path}[${i}]`));
            else Object.entries(node).forEach(([k, v]) => {
                if (['patterns', 'reply', 'replyHi', 'examples'].includes(k)) return;
                walk(v, path ? `${path}.${k}` : k);
            });
        }
        walk(obj, '');
        return matches;
    }

    function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function findBestSentencePattern(text, patterns) {
        let best = null, bestScore = 0;
        for (const p of patterns) {
            if (!p.examples) continue;
            for (const example of p.examples) {
                const score = computeSimilarity(text, example.toLowerCase());
                if (score > bestScore && score >= 0.65) { bestScore = score; best = { ...p, score }; }
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
                    if (w.length > 3 && bw.length > 3 && (w.startsWith(bw.substring(0, 4)) || bw.startsWith(w.substring(0, 4)))) { matches += 0.5; break; }
                }
            }
        }
        const baseScore = matches / Math.max(wordsA.length, wordsB.length);
        const lenRatio = Math.min(wordsA.length, wordsB.length) / Math.max(wordsA.length, wordsB.length);
        return baseScore * 0.75 + lenRatio * 0.25;
    }

    function detectAllKeywords(text, kd) {
        const found = new Set();
        if (!kd.keywords) return [];
        for (const [cat, words] of Object.entries(kd.keywords)) {
            if (!Array.isArray(words)) continue;
            for (const w of words) { if (text.includes(String(w).toLowerCase())) found.add(cat); }
        }
        return Array.from(found);
    }

    function normalizeWithFuzzy(text) {
        const kd = DATA_BUNDLE.keywords;
        if (!kd || !kd.fuzzy) return text;
        let n = text;
        for (const [correct, misspellings] of Object.entries(kd.fuzzy)) {
            for (const wrong of misspellings) {
                n = n.replace(new RegExp('\\b' + escapeRegex(wrong) + '\\b', 'gi'), correct);
            }
        }
        return n;
    }

    // ---- MAIN MATCH ----
    function matchAll(text) {
        const t = text.toLowerCase().trim();
        if (!t) return { reply: '...', matchType: null, nextFlow: 'startup' };

        const sd = DATA_BUNDLE['sentence-patterns'];
        if (sd && sd.patterns) {
            const bp = findBestSentencePattern(t, sd.patterns);
            if (bp) {
                return {
                    reply: (lang === 'hi' && bp.replyHi) ? bp.replyHi : bp.reply,
                    matchType: 'sentence', matchPath: bp.id,
                    nextFlow: bp.next || 'product_detail'
                };
            }
        }

        const normalizedT = normalizeWithFuzzy(t);
        const kd = DATA_BUNDLE.keywords;

        if (kd && kd.combos) {
            const detected = detectAllKeywords(normalizedT, kd);
            for (const combo of kd.combos) {
                if (combo.must_have.every(k => detected.includes(k))) {
                    return {
                        reply: (lang === 'hi' && combo.replyHi) ? combo.replyHi : combo.reply,
                        matchType: 'combo', matchPath: combo.id,
                        nextFlow: combo.next || 'product_detail'
                    };
                }
            }
        }

        const sources = ['greetings', 'help', 'policies', 'contact', 'company', 'catalog', 'responses', 'faq'];
        for (const sk of sources) {
            const source = DATA_BUNDLE[sk];
            if (!source) continue;
            const matches = findMatches(source, normalizedT);
            if (matches.length) {
                const best = matches.sort((a, b) => b.priority - a.priority)[0];
                const item = best.item;
                const reply = (lang === 'hi' && item.replyHi) ? item.replyHi : item.reply;
                if (reply) {
                    return { reply, matchType: sk, matchPath: best.path, nextFlow: flowFromMatchType(sk) };
                }
            }
        }

        if (DATA_BUNDLE.products) {
            for (const [id, p] of Object.entries(DATA_BUNDLE.products)) {
                if (!p) continue;
                const nameLower = (p.name || '').toLowerCase();
                const nameHi = p.nameHi || '';
                if (normalizedT.includes(id.toLowerCase()) || (nameLower && normalizedT.includes(nameLower)) || (nameHi && normalizedT.includes(nameHi))) {
                    sessionContext.viewedProducts.push(id);
                    sessionContext.lastIntent = 'product';
                    return { reply: productReply(p), matchType: 'product', productId: id, nextFlow: 'product_detail' };
                }
            }
        }

        if (kd && kd.keywords) {
            for (const [cat, words] of Object.entries(kd.keywords)) {
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
                                    return { reply, matchType: cat, nextFlow: flowFromMatchType(sk) };
                                }
                            }
                        }
                    }
                }
            }
        }

        const fbList = (DATA_BUNDLE.fallbacks && DATA_BUNDLE.fallbacks.fallbacks) || [];
        const fb = fbList.length ? fbList[Math.floor(Math.random() * fbList.length)] : null;
        const reply = fb ? (lang === 'hi' && fb.replyHi ? fb.replyHi : fb.reply) : 'Sorry, I didn\'t understand.\n\nTry:\n• Products\n• Pricing\n• Bulk orders\n• Shipping\n• Contact';
        return { reply, matchType: 'fallback', nextFlow: 'startup' };
    }

    function flowFromMatchType(matchType) {
        const map = {
            'greetings': 'startup', 'help': 'startup', 'policies': 'refund_flow',
            'contact': 'contact_menu', 'company': 'startup', 'catalog': 'product_menu',
            'responses': 'startup', 'faq': 'startup', 'product': 'product_detail',
            'sentence': 'product_detail', 'combo': 'product_detail'
        };
        return map[matchType] || 'startup';
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

    function buildInlineButtons(replyText, matchType, matchPath) {
        const buttons = [];
        if (!SMART.smartLinks) return buttons;
        const t = (replyText || '').toLowerCase();
        const path = (matchPath || '').toLowerCase();
        const links = SMART.smartLinks;

        if (t.includes('contact') || path.includes('contact')) {
            if (links.contact) buttons.push({ ...links.contact, type: 'primary' });
            if (SMART.whatsappLink) buttons.push({ label: 'WhatsApp', labelHi: 'WhatsApp', icon: '💬', url: SMART.whatsappLink, type: 'success', external: true });
        }
        if (t.includes('nikolux') || path.includes('nikolux')) { if (links.nikolux) buttons.push({ ...links.nikolux, type: 'primary' }); }
        if (t.includes('life star') || path.includes('life')) { if (links['life-star']) buttons.push({ ...links['life-star'], type: 'primary' }); }
        if (t.includes('sanjivni') || path.includes('sanjivni')) { if (links.sanjivni) buttons.push({ ...links.sanjivni, type: 'primary' }); }
        if (t.includes('bulk') || path.includes('bulk')) {
            if (SMART.emailLinks && SMART.emailLinks.bulk) buttons.push({ label: 'Bulk Enquiry', labelHi: 'थोक पूछताछ', icon: '📦', url: `mailto:${SMART.emailLinks.bulk}`, type: 'warning', external: true });
        }
        if (t.includes('shipping') || path.includes('shipping')) { if (links.shipping) buttons.push({ ...links.shipping, type: 'outline' }); }
        if (t.includes('refund') || path.includes('refund')) { if (links.refund) buttons.push({ ...links.refund, type: 'outline' }); }
        if (t.includes('price') || path.includes('price')) {
            if (SMART.emailLinks && SMART.emailLinks.sales) buttons.push({ label: 'Get Quote', labelHi: 'कोट प्राप्त करें', icon: '💰', url: `mailto:${SMART.emailLinks.sales}`, type: 'warning', external: true });
        }
        if (matchType === 'fallback') {
            if (links.contact) buttons.push({ ...links.contact, type: 'primary' });
        }
        const seen = new Set();
        return buttons.filter(b => { if (seen.has(b.url)) return false; seen.add(b.url); return true; }).slice(0, 3);
    }

    function renderInlineButtons(buttons) {
        if (!buttons.length) return '';
        return `
            <div class="vy-inline-buttons">
                ${buttons.map(b => {
                    const label = (lang === 'hi' && b.labelHi) ? b.labelHi : b.label;
                    const href = b.external ? b.url : (BASE_URL + b.url);
                    return `<a href="${href}" class="vy-inline-btn ${b.type || 'outline'}" target="_blank" rel="noopener">
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
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
                        const chipType = (leadResult.type === 'submitted' || leadResult.type === 'cancelled') ? 'startup' : currentFlow;
                        renderQuick(chipType);
                    }, 400 + Math.random() * 400);
                    return;
                }
            } catch (e) { console.warn('Lead flow error:', e); }
        }

        setTimeout(() => {
            const match = matchAll(text);
            const buttons = buildInlineButtons(match.reply, match.matchType, match.matchPath);
            addMessage('bot', match.reply, true, buttons);
            sendBtn.disabled = false;
            currentFlow = match.nextFlow || 'startup';
            console.log('🔄 Flow →', currentFlow);
            renderQuick(currentFlow);
        }, 400 + Math.random() * 400);
    }

    // ---- RENDER QUICK REPLIES (from conversation flow) ----
    function renderQuick(flowType) {
        if (!quickEl) return;

        if (!flowType || typeof flowType !== 'string') flowType = 'startup';

        const flows = (FLOW && FLOW.flows) ? FLOW.flows : {};
        let items = [];

        // Try requested flow
        if (flows[flowType] && Array.isArray(flows[flowType].chips)) {
            items = flows[flowType].chips;
        }

        // Fallback to startup
        if (!items.length && flows.startup && Array.isArray(flows.startup.chips)) {
            items = flows.startup.chips;
        }

        // Final fallback
        if (!items.length) {
            const tg = getTimeGreeting();
            items = [
                { label: `👋 ${tg.chip}`, labelHi: `👋 ${tg.chip}`, query: tg.chip.toLowerCase(), next: 'startup' },
                { label: '📦 Products', labelHi: '📦 उत्पाद', query: 'products', next: 'product_menu' },
                { label: '💰 Pricing', labelHi: '💰 मूल्य', query: 'price', next: 'pricing_flow' },
                { label: '📞 Contact', labelHi: '📞 संपर्क', query: 'contact', next: 'contact_menu' }
            ];
        }

        quickEl.innerHTML = items.map(i => {
            const label = (lang === 'hi' && i.labelHi) ? i.labelHi : i.label;
            const query = i.query || '';
            const next = i.next || '';
            return `<button class="vy-chip" data-query="${escapeHtml(query)}" data-next="${escapeHtml(next)}">${escapeHtml(label)}</button>`;
        }).join('');

        quickEl.querySelectorAll('.vy-chip').forEach(btn => {
            btn.onclick = () => {
                inputEl.value = btn.dataset.query;
                if (btn.dataset.next) {
                    currentFlow = btn.dataset.next;
                    console.log('🔄 Flow changing to:', currentFlow);
                }
                sendMessage();
            };
        });

        console.log('🎨 Chips rendered for flow:', flowType, '| Count:', items.length);
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function clearHistory() {
        history = [];
        localStorage.removeItem('vy_chat_history');
        if (window.SVE_LEADS) window.SVE_LEADS.reset();
        currentFlow = 'startup';
        messagesEl.innerHTML = '';
        showWelcome();
        renderQuick('startup');
    }

    function showWelcome() {
        const tg = getTimeGreeting();
        const welcome = (lang === 'hi' && CONFIG.welcomeMessageHi) ? CONFIG.welcomeMessageHi : (CONFIG.welcomeMessage || 'Hi! I am Vinayak AI.');
        const greeting = `${tg.emoji} **${tg.greeting}!**\n\n${welcome}`;
        addMessage('bot', greeting, true, []);
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

        if (history.length > 0) {
            history.forEach(m => {
                const div = document.createElement('div');
                div.className = `vy-msg ${m.from}`;
                const avatar = m.from === 'bot'
                    ? `<img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span>`
                    : '<span>You</span>';
                const safe = String(m.text)
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
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
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();