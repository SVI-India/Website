// ============================================================
// VINAYAK AI — Full Page Chat (25 Features Complete)
// ============================================================

(function() {
    'use strict';

    const BASE_URL = 'https://www.sveindia.mywire.org';
    const DATA_PATH = BASE_URL + '/ai/data';

    let CONFIG = null, SMART = null, FLOW = null, FEATURE = null, DATA_BUNDLE = {};
    let lang = localStorage.getItem('lang') || 'en';
    let history = JSON.parse(localStorage.getItem('vy_chat_history') || '[]');
    let dataLoaded = false;
    let currentFlow = 'startup';
    let sessionContext = { viewedProducts: [], lastIntent: null };
    let messageCount = 0, ratingShown = false;
    let userLocation = null, askedLocation = false;

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
            'config', 'smart-config', 'conversation-flow', 'feature-config',
            'responses', 'fallbacks', 'quick-replies', 'keywords', 'sentence-patterns',
            'faq', 'products', 'orders', 'smart-suggestions', 'help', 'policies', 'greetings',
            'contact', 'company', 'catalog', 'page-summaries', 'leads-config'
        ];
        try {
            const results = await Promise.all(files.map(f =>
                fetch(`${DATA_PATH}/${f}.json?v=${Date.now()}`)
                    .then(r => r.ok ? r.json() : null).catch(() => null)
            ));
            files.forEach((f, i) => { if (results[i]) DATA_BUNDLE[f] = results[i]; });
            CONFIG = DATA_BUNDLE.config || { aiName: 'Vinayak AI' };
            SMART = DATA_BUNDLE['smart-config'] || {};
            FLOW = DATA_BUNDLE['conversation-flow'] || {};
            FEATURE = DATA_BUNDLE['feature-config'] || {};
            dataLoaded = true;
            console.log('✅ Vinayak AI FULL PAGE loaded:', Object.keys(DATA_BUNDLE).length, 'files');
            applyTimeTheme();
        } catch (e) { console.error(e); dataLoaded = true; }
    }

    // ---- TIME GREETING ----
    function getTimeGreeting() {
        const h = new Date().getHours();
        const tg = SMART.timeGreetings || {};
        for (const [key, val] of Object.entries(tg)) {
            if (h >= val.from && h < val.to)
                return { greeting: lang === 'hi' ? val.hi : val.en, emoji: val.emoji, chip: val.chip, key };
        }
        return { greeting: 'Hello', emoji: '👋', chip: 'Hi', key: 'default' };
    }

    function applyTimeTheme() {
        if (!FEATURE.timeThemes || !FEATURE.timeThemes.enabled) return;
        const h = new Date().getHours();
        const themes = FEATURE.timeThemes.themes || {};
        for (const [key, val] of Object.entries(themes)) {
            if (h >= val.from && h < val.to) { document.body.classList.add('vy-theme-' + key); break; }
        }
    }

    // ---- PATTERN WALKER ----
    function findMatches(obj, text) {
        const matches = [], t = text.toLowerCase().trim();
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
                    if (priority > 0) { matches.push({ path, item: node, pattern: p, priority }); break; }
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

    // ---- SENTIMENT ----
    function analyzeSentiment(text) {
        if (!FEATURE.sentiment || !FEATURE.sentiment.enabled) return null;
        const t = text.toLowerCase();
        const kw = FEATURE.sentiment.keywords || {};
        const neg = (kw.negative || []).filter(k => t.includes(k.toLowerCase())).length;
        const pos = (kw.positive || []).filter(k => t.includes(k.toLowerCase())).length;
        const urg = (kw.urgent || []).filter(k => t.includes(k.toLowerCase())).length;
        if (urg > 0) return 'urgent';
        if (neg > pos && neg >= 1) return 'negative';
        if (pos > neg && pos >= 1) return 'positive';
        return null;
    }

    // ---- ORDER TRACKING ----
    function detectOrderId(text) {
        const m = text.match(/\b(SVE\d{6,})\b/i);
        return m ? m[1].toUpperCase() : null;
    }

    function renderTrackingResult(orderId) {
        const orders = DATA_BUNDLE.orders?.orders;
        if (!orders) return null;
        const o = orders[orderId];
        if (!o) return null;
        const sClass = o.status.toLowerCase();
        const sText = lang === 'hi' && o.statusHi ? o.statusHi : o.status;
        let rows = '';
        if (o.product) rows += `<div class="row"><span class="label">Product</span><span class="value">${o.product}</span></div>`;
        if (o.quantity) rows += `<div class="row"><span class="label">Quantity</span><span class="value">${o.quantity}</span></div>`;
        if (o.orderDate) rows += `<div class="row"><span class="label">Order Date</span><span class="value">${o.orderDate}</span></div>`;
        if (o.deliveryDate) rows += `<div class="row"><span class="label">Delivered</span><span class="value">${o.deliveryDate}</span></div>`;
        if (o.expectedDate) rows += `<div class="row"><span class="label">Expected</span><span class="value">${o.expectedDate}</span></div>`;
        if (o.location) rows += `<div class="row"><span class="label">Location</span><span class="value">${o.location}</span></div>`;
        return `<div class="vy-track-result"><span class="status ${sClass}">${sText}</span><div style="font-weight:800;color:#fff;margin-bottom:10px;">📦 Order ${orderId}</div>${rows}</div>`;
    }

    // ---- BULK CALC ----
    function isBulkCalcQuery(text) { return /bulk.*(price|rate|calc|cost)|calc.*bulk|calculate.*price/i.test(text); }

    function renderBulkCalculator() {
        const cfg = FEATURE.bulkCalculator || {}, products = cfg.products || {};
        const options = Object.entries(products).map(([id, p]) =>
            `<option value="${id}">${id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ')} — ₹${p.rate}/${p.unit}</option>`).join('');
        return `<div class="vy-calc" id="vyBulkCalc">
            <label>Select Product</label>
            <select id="vyCalcProduct">${options}</select>
            <label>Quantity (kg)</label>
            <input type="number" id="vyCalcQty" value="500" min="100" step="50">
            <button class="vy-product-btn primary" style="width:100%;padding:10px;" onclick="window.vyCalcSubmit()">📊 Calculate</button>
            <div class="result" id="vyCalcResult" style="display:none;"></div>
        </div>`;
    }

    window.vyCalcSubmit = function() {
        const cfg = FEATURE.bulkCalculator || {};
        const productId = document.getElementById('vyCalcProduct')?.value;
        const qty = parseFloat(document.getElementById('vyCalcQty')?.value) || 0;
        const p = (cfg.products || {})[productId];
        if (!p || !qty) return;
        const subtotal = p.rate * qty;
        const gst = (subtotal * (cfg.gstPercent || 18)) / 100;
        const shipping = subtotal >= (cfg.freeShippingAbove || 5000) ? 0 : (cfg.shippingCharge || 200);
        const total = subtotal + gst + shipping;
        const fmt = n => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        const res = document.getElementById('vyCalcResult');
        res.style.display = 'block';
        res.innerHTML = `
            <div class="line"><span>Rate</span><span>${fmt(p.rate)}/${p.unit}</span></div>
            <div class="line"><span>Quantity</span><span>${qty} ${p.unit}</span></div>
            <div class="line"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
            <div class="line"><span>GST</span><span>${fmt(gst)}</span></div>
            <div class="line"><span>Shipping</span><span>${shipping === 0 ? '✅ FREE' : fmt(shipping)}</span></div>
            <div class="line total"><span>Total</span><span>${fmt(total)}</span></div>
            <a href="mailto:${FEATURE.email?.bulk || 'bulk@sve-in.xubi.org'}?subject=Bulk Order&body=Product: ${productId}%0AQty: ${qty}kg%0ATotal: ${fmt(total)}" class="vy-product-btn primary" style="display:block;margin-top:12px;padding:10px;text-align:center;">📦 Place Order</a>`;
    };

    // ---- VOICE OUTPUT ----
    function speak(text) {
        if (!FEATURE.voiceOutput?.enabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const clean = String(text).replace(/[*_#`]/g, '').substring(0, 500);
        const utt = new SpeechSynthesisUtterance(clean);
        utt.lang = FEATURE.voiceOutput.preferredVoice?.[lang] || (lang === 'hi' ? 'hi-IN' : 'en-IN');
        utt.rate = FEATURE.voiceOutput.rate || 1.0;
        window.speechSynthesis.speak(utt);
    }

    window.vySpeak = function(btn, text) {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            btn.classList.remove('speaking'); btn.textContent = '🔊'; return;
        }
        if (!('speechSynthesis' in window)) return;
        const clean = String(text).replace(/[*_#`]/g, '').substring(0, 500);
        const utt = new SpeechSynthesisUtterance(clean);
        utt.lang = FEATURE.voiceOutput?.preferredVoice?.[lang] || (lang === 'hi' ? 'hi-IN' : 'en-IN');
        utt.onend = () => { btn.classList.remove('speaking'); btn.textContent = '🔊'; };
        btn.classList.add('speaking'); btn.textContent = '⏸';
        window.speechSynthesis.speak(utt);
    };

    // ---- PRODUCT CARD ----
    function renderProductCard(p) {
        const name = (lang === 'hi' && p.nameHi) ? p.nameHi : p.name;
        const tag = (lang === 'hi' && p.taglineHi) ? p.taglineHi : (p.tagline || '');
        const badge = p.badge || '';
        const badgeClass = badge.toLowerCase() === 'new' ? 'new' : '';
        const price = p.price ? Object.entries(p.price)[0] : null;
        const rating = p.rating || 0;
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        return `<div class="vy-product-card">
            ${p.image ? `<img src="${p.image}" alt="${name}" class="vy-product-image" onerror="this.style.display='none'">` : ''}
            <div class="vy-product-body">
                <div class="vy-product-title-row">
                    <div class="vy-product-name">${name}</div>
                    ${badge ? `<span class="vy-product-badge ${badgeClass}">${badge}</span>` : ''}
                </div>
                ${tag ? `<div class="vy-product-desc">${tag}</div>` : ''}
                ${price ? `<div class="vy-product-price"><span class="from">From</span> ₹${price[1]}</div>` : ''}
                ${rating ? `<div class="vy-product-rating">${stars} <span class="count">(${p.ratingCount || 0})</span></div>` : ''}
                <div class="vy-product-actions">
                    <a href="${BASE_URL}${p.page || '/products.html'}" target="_blank" class="vy-product-btn primary">🔗 Details</a>
                    <a href="mailto:${FEATURE.email?.sales || 'sales@sve-in.xubi.org'}?subject=Enquiry: ${p.name}" class="vy-product-btn outline">📧 Enquire</a>
                </div>
            </div>
        </div>`;
    }

    // ---- MAIN MATCH ----
    function matchAll(text) {
        const t = text.toLowerCase().trim();
        if (!t) return { reply: '...', matchType: null, nextFlow: 'startup' };

        const orderId = detectOrderId(text);
        if (orderId) {
            const result = renderTrackingResult(orderId);
            if (result) return { reply: result, matchType: 'order_track', html: true, nextFlow: 'startup' };
        }

        if (isBulkCalcQuery(text))
            return { reply: renderBulkCalculator(), matchType: 'bulk_calc', html: true, nextFlow: 'bulk_flow' };

        const sd = DATA_BUNDLE['sentence-patterns'];
        if (sd?.patterns) {
            const bp = findBestSentencePattern(t, sd.patterns);
            if (bp) return { reply: (lang === 'hi' && bp.replyHi) ? bp.replyHi : bp.reply, matchType: 'sentence', nextFlow: bp.next || 'product_detail' };
        }

        const normalizedT = normalizeWithFuzzy(t);
        const kd = DATA_BUNDLE.keywords;

        if (kd?.combos) {
            const detected = detectAllKeywords(normalizedT, kd);
            for (const combo of kd.combos) {
                if (combo.must_have.every(k => detected.includes(k)))
                    return { reply: (lang === 'hi' && combo.replyHi) ? combo.replyHi : combo.reply, matchType: 'combo', nextFlow: combo.next || 'product_detail' };
            }
        }

        if (DATA_BUNDLE.products) {
            for (const [id, p] of Object.entries(DATA_BUNDLE.products)) {
                if (!p) continue;
                const nameLower = (p.name || '').toLowerCase();
                if (normalizedT.includes(id.toLowerCase()) || (nameLower && normalizedT.includes(nameLower)) || (p.nameHi && normalizedT.includes(p.nameHi))) {
                    sessionContext.viewedProducts.push(id);
                    return { reply: renderProductCard(p), matchType: 'product', productId: id, html: true, nextFlow: 'product_detail' };
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
                if (reply) return { reply, matchType: sk, nextFlow: flowFromMatchType(sk) };
            }
        }

        if (kd?.keywords) {
            for (const [cat, words] of Object.entries(kd.keywords)) {
                if (!Array.isArray(words)) continue;
                for (const w of words) {
                    if (normalizedT.includes(String(w).toLowerCase())) {
                        for (const sk of ['help', 'responses', 'policies']) {
                            if (!DATA_BUNDLE[sk]) continue;
                            const m = findMatches(DATA_BUNDLE[sk], w);
                            if (m.length) {
                                const item = m[0].item;
                                const reply = (lang === 'hi' && item.replyHi) ? item.replyHi : item.reply;
                                if (reply) return { reply, matchType: cat, nextFlow: flowFromMatchType(sk) };
                            }
                        }
                    }
                }
            }
        }

        const fbList = DATA_BUNDLE.fallbacks?.fallbacks || [];
        const fb = fbList.length ? fbList[Math.floor(Math.random() * fbList.length)] : null;
        const reply = fb ? (lang === 'hi' && fb.replyHi ? fb.replyHi : fb.reply) : 'Sorry, I didn\'t understand.';
        return { reply, matchType: 'fallback', nextFlow: 'startup' };
    }

    function flowFromMatchType(m) {
        const map = {
            'greetings': 'startup', 'help': 'startup', 'policies': 'refund_flow',
            'contact': 'contact_menu', 'company': 'startup', 'catalog': 'product_menu',
            'responses': 'startup', 'faq': 'startup', 'product': 'product_detail',
            'sentence': 'product_detail', 'combo': 'product_detail'
        };
        return map[m] || 'startup';
    }

    // ---- INLINE BUTTONS ----
    function buildInlineButtons(replyText, matchType, matchPath) {
        const buttons = [];
        if (!SMART.smartLinks) return buttons;
        const t = (replyText || '').toLowerCase();
        const path = (matchPath || '').toLowerCase();
        const links = SMART.smartLinks;
        const wa = FEATURE.whatsapp || {};
        const em = FEATURE.email || {};

        if (t.includes('contact') || path.includes('contact')) {
            if (links.contact) buttons.push({ ...links.contact, type: 'primary' });
            if (wa.enabled && wa.number) buttons.push({ label: 'WhatsApp', icon: '💬', url: `https://wa.me/${wa.number}`, type: 'success', external: true });
        }
        if (t.includes('bulk') || path.includes('bulk')) {
            if (em.bulk) buttons.push({ label: 'Bulk Enquiry', icon: '📦', url: `mailto:${em.bulk}`, type: 'warning', external: true });
        }
        if (t.includes('shipping') || path.includes('shipping')) { if (links.shipping) buttons.push({ ...links.shipping, type: 'outline' }); }
        if (t.includes('refund') || path.includes('refund')) { if (links.refund) buttons.push({ ...links.refund, type: 'outline' }); }
        if (matchType === 'fallback') {
            if (links.contact) buttons.push({ ...links.contact, type: 'primary' });
            if (wa.enabled && wa.number) buttons.push({ label: 'WhatsApp', icon: '💬', url: `https://wa.me/${wa.number}`, type: 'success', external: true });
        }
        const seen = new Set();
        return buttons.filter(b => { if (seen.has(b.url)) return false; seen.add(b.url); return true; }).slice(0, 3);
    }

    function renderInlineButtons(buttons) {
        if (!buttons.length) return '';
        return `<div class="vy-inline-buttons">${buttons.map(b => {
            const label = (lang === 'hi' && b.labelHi) ? b.labelHi : b.label;
            const href = b.external ? b.url : (BASE_URL + b.url);
            return `<a href="${href}" class="vy-inline-btn ${b.type || 'outline'}" target="_blank" rel="noopener">${b.icon || ''} ${label}</a>`;
        }).join('')}</div>`;
    }

    // ---- EXPORT ----
    function exportChatJSON() {
        const data = {
            ai: 'Vinayak AI', company: 'Siddhi Vinayak Enterprises',
            exportedAt: new Date().toISOString(), language: lang,
            messages: history.map(m => ({ from: m.from, text: m.text, time: new Date(m.ts).toLocaleString('en-IN') }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `vinayak-ai-chat-${Date.now()}.json`;
        a.click(); URL.revokeObjectURL(url);
    }

    function exportChatPDF() {
        const cfg = FEATURE.pdfExport || {};
        const title = cfg.title || 'Vinayak AI Chat';
        const win = window.open('', '_blank');
        if (!win) return;
        const rows = history.map(m => `
            <div style="margin-bottom:12px;">
                <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:2px;">
                    ${m.from === 'bot' ? '🤖 Vinayak AI' : '👤 You'} • ${new Date(m.ts).toLocaleString('en-IN')}
                </div>
                <div style="padding:10px 14px;background:${m.from === 'bot' ? '#f1f5f9' : '#dbeafe'};border-radius:8px;font-size:13px;line-height:1.5;white-space:pre-wrap;">
                    ${String(m.text).replace(/</g, '&lt;').replace(/\n/g, '<br>')}
                </div>
            </div>`).join('');
        win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
            <style>body{font-family:Arial,sans-serif;padding:30px;color:#0f172a;}
            .header{display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:2px solid #1e40af;margin-bottom:20px;}
            .header img{height:50px;}.header h1{font-size:20px;margin:0;}
            .header .sub{font-size:12px;color:#64748b;}
            .footer{margin-top:30px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b;}</style>
            </head><body>
            <div class="header">
                <img src="${cfg.logo || BASE_URL + '/images/logo.png'}" onerror="this.style.display='none'">
                <div><h1>${title}</h1><div class="sub">Exported: ${new Date().toLocaleString('en-IN')}</div></div>
            </div>
            ${rows}
            <div class="footer">© ${new Date().getFullYear()} Siddhi Vinayak Enterprises • ${BASE_URL}</div>
            <script>window.onload=function(){setTimeout(()=>window.print(),500);}<\/script>
            </body></html>`);
        win.document.close();
    }

    // ---- RATING ----
    function showRatingPrompt() {
        if (ratingShown || !FEATURE.rating?.enabled || messageCount < (FEATURE.rating.askAfterMessages || 5)) return;
        ratingShown = true;
        const div = document.createElement('div');
        div.className = 'vy-msg bot';
        div.innerHTML = `
            <div class="vy-msg-avatar"><img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span></div>
            <div><div class="vy-bubble">
                <div style="font-weight:700;margin-bottom:8px;">⭐ How was your experience?</div>
                <div class="vy-rating-stars">${[1,2,3,4,5].map(n => `<span data-star="${n}">☆</span>`).join('')}</div>
            </div></div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        div.querySelectorAll('.vy-rating-stars span').forEach(star => {
            star.onmouseenter = () => highlightStars(div, parseInt(star.dataset.star));
            star.onmouseleave = () => highlightStars(div, 0);
            star.onclick = () => submitRating(div, parseInt(star.dataset.star));
        });
    }

    function highlightStars(c, count) {
        c.querySelectorAll('.vy-rating-stars span').forEach(s => {
            s.textContent = parseInt(s.dataset.star) <= count ? '★' : '☆';
            s.classList.toggle('active', parseInt(s.dataset.star) <= count);
        });
    }

    async function submitRating(c, stars) {
        highlightStars(c, stars);
        try { if (window.db) await window.db.collection('ai_ratings').add({
            stars, page: window.location.pathname, lang, messageCount,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }); } catch (e) {}
        c.querySelector('.vy-bubble').innerHTML = `<div style="font-weight:700;">⭐ Thanks for rating! (${stars}/5)</div>
            <div style="color:#94a3b8;font-size:13px;margin-top:6px;">${stars >= 4 ? '😊 Glad you liked it!' : '🙏 We\'ll improve!'}</div>`;
    }

    // ---- ADD MESSAGE ----
    function addMessage(from, text, save = true, buttons = [], options = {}) {
        if (!messagesEl) return;
        const typing = messagesEl.querySelector('.vy-typing');
        if (typing) typing.remove();

        const div = document.createElement('div');
        div.className = `vy-msg ${from}`;
        const avatarHtml = from === 'bot'
            ? `<img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span>`
            : '<span>You</span>';
        const isHtml = options.html;
        let safe;
        if (isHtml) safe = text;
        else safe = String(text)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/([\w.+-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');

        const buttonsHtml = from === 'bot' ? renderInlineButtons(buttons) : '';
        const speakBtn = (from === 'bot' && !isHtml && text.length > 20)
            ? `<div style="margin-top:6px;"><button class="vy-speak-btn" onclick='window.vySpeak(this, ${JSON.stringify(String(text).substring(0, 500))})' title="Read aloud">🔊</button></div>` : '';
        const feedbackHtml = (from === 'bot' && FEATURE.feedback?.enabled && !isHtml)
            ? `<div class="vy-feedback" data-msg="${messageCount}"><span>Was this helpful?</span>
               <button onclick="window.vyFeedback(this, 'up')">👍</button>
               <button onclick="window.vyFeedback(this, 'down')">👎</button></div>` : '';

        div.innerHTML = `<div class="vy-msg-avatar">${avatarHtml}</div>
            <div><div class="vy-bubble">${safe}${buttonsHtml}${speakBtn}${feedbackHtml}</div>
            <span class="vy-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span></div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        if (save) {
            history.push({ from, text, ts: Date.now() });
            try { localStorage.setItem('vy_chat_history', JSON.stringify(history.slice(-50))); } catch(e) {}
        }
        if (from === 'bot') { messageCount++; trackAnalytics('bot_message'); setTimeout(showRatingPrompt, 2000); }
    }

    window.vyFeedback = async function(btn, type) {
        const p = btn.parentElement;
        if (p.classList.contains('thanks')) return;
        p.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); p.classList.add('thanks');
        p.innerHTML = `<span>${type === 'up' ? '😊 Thanks!' : '🙏 We\'ll improve!'}</span>`;
        try { if (window.db) await window.db.collection('ai_feedback').add({
            type, page: window.location.pathname, lang,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }); } catch (e) {}
    };

    async function trackAnalytics(type, data = {}) {
        if (!FEATURE.analytics?.enabled) return;
        try { if (window.db) await window.db.collection('ai_analytics').add({
            type, data, page: window.location.pathname, lang, timestamp: new Date().toISOString()
        }); } catch (e) {}
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'vy-msg bot vy-typing';
        div.innerHTML = `<div class="vy-msg-avatar"><img src="${BASE_URL}/images/logo.png" onerror="this.style.display='none'"><span>V</span></div>
            <div class="vy-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // ---- LOCATION ----
    function askLocation() {
        if (askedLocation || !FEATURE.location?.enabled || !navigator.geolocation) return;
        askedLocation = true;
        navigator.geolocation.getCurrentPosition(
            pos => { userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
            () => { askedLocation = true; },
            { timeout: 5000, enableHighAccuracy: false }
        );
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
        trackAnalytics('user_message', { text: text.substring(0, 200) });

        const t = text.toLowerCase();

        // Handover shortcuts
        if (t.includes('whatsapp') || t.includes('human') || t.includes('insaan')) {
            setTimeout(() => {
                const wa = FEATURE.whatsapp || {};
                const waLink = wa.number ? `https://wa.me/${wa.number}?text=${encodeURIComponent(lang === 'hi' ? wa.defaultMessageHi : wa.defaultMessage)}` : '#';
                addMessage('bot', '💬 **Connecting to WhatsApp...**', true, [{ label: 'Open WhatsApp', labelHi: 'WhatsApp खोलें', icon: '💬', url: waLink, type: 'success', external: true }]);
                sendBtn.disabled = false;
            }, 400);
            return;
        }
        if (t.includes('send email') || t.includes('email karo')) {
            setTimeout(() => {
                addMessage('bot', '📧 **Opening email...**', true, [{ label: 'Send Email', labelHi: 'ईमेल भेजें', icon: '📧', url: `mailto:${FEATURE.email?.default || 'info@sve-in.xubi.org'}?subject=Enquiry from Vinayak AI`, type: 'warning', external: true }]);
                sendBtn.disabled = false;
            }, 400);
            return;
        }
        if (t.includes('export chat') || t.includes('download chat') || t.includes('pdf chat')) {
            setTimeout(() => {
                addMessage('bot', '📄 **Export chat:**', true, [
                    { label: 'Download PDF', labelHi: 'PDF डाउनलोड', icon: '📄', url: 'javascript:window.vyExportPDF()', type: 'primary', external: true },
                    { label: 'Download JSON', labelHi: 'JSON डाउनलोड', icon: '💾', url: 'javascript:window.vyExportJSON()', type: 'outline', external: true }
                ]);
                sendBtn.disabled = false;
            }, 400);
            return;
        }

        const sentiment = analyzeSentiment(text);
        if (sentiment === 'negative' || sentiment === 'urgent') {
            setTimeout(() => {
                addMessage('bot', lang === 'hi' ? (FEATURE.sentiment.negativeReplyHi || FEATURE.sentiment.negativeReply) : FEATURE.sentiment.negativeReply);
                renderQuick('contact_menu');
                sendBtn.disabled = false;
            }, 300);
            return;
        }

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
            } catch (e) {}
        }

        setTimeout(() => {
            const match = matchAll(text);
            const buttons = match.html ? [] : buildInlineButtons(match.reply, match.matchType, '');
            addMessage('bot', match.reply, true, buttons, { html: match.html, matchType: match.matchType });
            sendBtn.disabled = false;
            currentFlow = match.nextFlow || 'startup';
            renderQuick(currentFlow);
            if (FEATURE.voiceOutput?.autoSpeak && !match.html) speak(match.reply);
        }, 400 + Math.random() * 400);
    }

    // ---- QUICK REPLIES ----
    function renderQuick(flowType) {
        if (!quickEl) return;
        if (!flowType || typeof flowType !== 'string') flowType = 'startup';
        const flows = FLOW?.flows || {};
        let items = [];
        if (flows[flowType]?.chips) items = flows[flowType].chips;
        if (!items.length && flows.startup?.chips) items = flows.startup.chips;
        if (!items.length) {
            const tg = getTimeGreeting();
            items = [
                { label: `👋 ${tg.chip}`, query: tg.chip.toLowerCase(), next: 'startup' },
                { label: '📦 Products', query: 'products', next: 'product_menu' },
                { label: '💰 Pricing', query: 'price', next: 'pricing_flow' },
                { label: '📞 Contact', query: 'contact', next: 'contact_menu' }
            ];
        }
        quickEl.innerHTML = items.map(i => {
            const label = (lang === 'hi' && i.labelHi) ? i.labelHi : i.label;
            return `<button class="vy-chip" data-query="${escapeHtml(i.query)}" data-next="${escapeHtml(i.next || '')}">${escapeHtml(label)}</button>`;
        }).join('');
        quickEl.querySelectorAll('.vy-chip').forEach(b => {
            b.onclick = () => {
                inputEl.value = b.dataset.query;
                if (b.dataset.next) currentFlow = b.dataset.next;
                sendMessage();
            };
        });
    }

    function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    function clearHistory() {
        history = [];
        localStorage.removeItem('vy_chat_history');
        if (window.SVE_LEADS) window.SVE_LEADS.reset();
        currentFlow = 'startup'; messageCount = 0; ratingShown = false;
        messagesEl.innerHTML = '';
        showWelcome();
        renderQuick('startup');
    }

    function showWelcome() {
        const tg = getTimeGreeting();
        const welcome = (lang === 'hi' && CONFIG.welcomeMessageHi) ? CONFIG.welcomeMessageHi : (CONFIG.welcomeMessage || 'Hi! I am Vinayak AI.');
        addMessage('bot', `${tg.emoji} **${tg.greeting}!**\n\n${welcome}`, true, []);
    }

    function initVoice() {
        if (!voiceBtn) return;
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceBtn.style.display = 'none'; return;
        }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recog = new SR();
        recog.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        recog.interimResults = false;
        let listening = false;
        voiceBtn.onclick = () => { if (listening) { recog.stop(); return; } recog.start(); listening = true; voiceBtn.textContent = '🔴'; };
        recog.onresult = (e) => { inputEl.value = e.results[0][0].transcript; sendMessage(); };
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
        askLocation();

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
        window.vyExportPDF = exportChatPDF;
        window.vyExportJSON = exportChatJSON;

        console.log('✅ Vinayak AI Full Page ready');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();