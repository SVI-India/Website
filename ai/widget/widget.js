// ============================================================
// VINAYAK AI WIDGET — Complete with Multi-Step Lead Capture
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
    let history = JSON.parse(localStorage.getItem('vyw_history') || '[]');
    let panelOpen = false;
    let dataLoaded = false;
    let messagesRendered = false;
    let currentFlow = 'startup';
    let sessionContext = { viewedProducts: [], lastIntent: null };

    // ---- LOAD ALL DATA ----
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
            console.log('✅ Vinayak AI loaded —', Object.keys(DATA_BUNDLE).length, 'files');
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
            'sentence': 'product_detail'
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
            <div class="vyw-inline-buttons">
                ${buttons.map(b => {
                    const label = (lang === 'hi' && b.labelHi) ? b.labelHi : b.label;
                    const href = b.external ? b.url : (BASE_URL + b.url);
                    return `<a href="${href}" class="vyw-inline-btn ${b.type || 'outline'}" target="_blank" rel="noopener">
                        ${b.icon || ''} ${label}
                    </a>`;
                }).join('')}
            </div>
        `;
    }

    function createWidget() {
        const btn = document.createElement('button');
        btn.id = 'vyWidgetBtn';
        btn.innerHTML = '💬';
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

    function addMessage(from, text, save = true, buttons = []) {
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
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/([\w.+-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');

        const buttonsHtml = from === 'bot' ? renderInlineButtons(buttons) : '';
        div.innerHTML = `
            <div class="vyw-msg-avatar">${avatarHtml}</div>
            <div class="vyw-bubble">${safe}${buttonsHtml}</div>
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

    // ---- SEND ----
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

        // Lead capture (multi-step)
        if (window.SVE_LEADS) {
            try {
                const leadResult = await window.SVE_LEADS.processMessage(text, lang);
                if (leadResult) {
                    setTimeout(() => {
                        addMessage('bot', leadResult.reply);
                        const chipType = (leadResult.type === 'submitted' || leadResult.type === 'cancelled') ? 'startup' : currentFlow;
                        renderQuick(chipType);
                    }, 400 + Math.random() * 400);
                    return;
                }
            } catch (e) { console.warn('Lead flow error:', e); }
        }

        // Normal match
        setTimeout(() => {
            const match = matchAll(text);
            const buttons = buildInlineButtons(match.reply, match.matchType, match.matchPath);
            addMessage('bot', match.reply, true, buttons);
            currentFlow = match.nextFlow || 'startup';
            renderQuick(currentFlow);
        }, 400 + Math.random() * 400);
    }

    function renderQuick(flowType = 'startup') {
        const el = document.getElementById('vywQuick');
        if (!el) return;

        let items = [];
        if (FLOW && FLOW.flows && FLOW.flows[flowType] && FLOW.flows[flowType].chips) {
            items = FLOW.flows[flowType].chips;
        }
        if (!items.length && FLOW && FLOW.flows && FLOW.flows.startup) {
            items = FLOW.flows.startup.chips;
        }
        if (!items.length) {
            const tg = getTimeGreeting();
            items = [
                { label: `👋 ${tg.chip}`, labelHi: `👋 ${tg.chip}`, query: tg.chip.toLowerCase() },
                { label: '📦 Products', labelHi: '📦 उत्पाद', query: 'products' },
                { label: '💰 Pricing', labelHi: '💰 मूल्य', query: 'price' },
                { label: '📞 Contact', labelHi: '📞 संपर्क', query: 'contact' }
            ];
        }

        el.innerHTML = items.map(i => `
            <button class="vyw-chip" data-q="${escapeHtml(i.query)}" data-next="${i.next || ''}">
                ${escapeHtml((lang === 'hi' && i.labelHi) ? i.labelHi : i.label)}
            </button>
        `).join('');

        el.querySelectorAll('.vyw-chip').forEach(b => {
            b.onclick = () => {
                const inp = document.getElementById('vywInput');
                if (inp) inp.value = b.dataset.q;
                if (b.dataset.next) currentFlow = b.dataset.next;
                send();
            };
        });
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function clearChat() {
        history = [];
        localStorage.removeItem('vyw_history');
        if (window.SVE_LEADS) window.SVE_LEADS.reset();
        currentFlow = 'startup';
        const messages = document.getElementById('vywMessages');
        if (messages) messages.innerHTML = '';
        showWelcome();
        renderQuick('startup');
    }

    function showWelcome() {
        const tg = getTimeGreeting();
        const welcome = (lang === 'hi' && CONFIG.welcomeMessageHi) ? CONFIG.welcomeMessageHi : (CONFIG.welcomeMessage || 'Hi! I am Vinayak AI.');
        const greeting = `${tg.emoji} **${tg.greeting}!**\n\n${welcome}`;
        addMessage('bot', greeting, true, []);
    }

    function applyConfig() {
        const nameEl = document.getElementById('vywName');
        if (nameEl && CONFIG) {
            nameEl.textContent = (lang === 'hi' && CONFIG.aiNameHi) ? CONFIG.aiNameHi : (CONFIG.aiName || 'Vinayak AI');
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
            const safe = String(m.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            div.innerHTML = `<div class="vyw-msg-avatar">${avatar}</div><div class="vyw-bubble">${safe}</div>`;
            messages.appendChild(div);
        });
        messages.scrollTop = messages.scrollHeight;
    }

    function getCurrentPageSummary() {
        const s = DATA_BUNDLE['page-summaries'];
        if (!s || !s.summaries) return null;
        const filename = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        return s.summaries[filename] || null;
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
                if (history.length > 0) renderHistory();
                else showWelcome();
                renderQuick('startup');
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
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        });
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 80) + 'px';
        });

        window.vyTest = (text) => matchAll(text);
        window.vyData = () => DATA_BUNDLE;
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();