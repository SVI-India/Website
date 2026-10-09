// ============================================================
// SVE LEADS — AI Chat Lead Capture System
// ============================================================

window.SVE_LEADS = (function() {
    'use strict';

    const BASE_URL = 'https://www.sveindia.mywire.org';
    let CONFIG = null;
    let inConversation = false;
    let currentIntent = null;
    let conversationData = {};

    // ---- LOAD CONFIG ----
    async function loadConfig() {
        if (CONFIG) return CONFIG;
        try {
            const res = await fetch(`${BASE_URL}/ai/data/leads-config.json?v=${Date.now()}`);
            CONFIG = await res.json();
        } catch (e) {
            console.warn('Leads config load failed:', e);
            CONFIG = { enabled: false };
        }
        return CONFIG;
    }

    // ---- DETECT INTENT ----
    function detectIntent(text) {
        const t = text.toLowerCase();
        const intents = {
            buy:          ['buy', 'order', 'purchase', 'want to buy', 'i want', 'place order', 'book order', 'kharidna', 'order karna', 'ऑर्डर', 'खरीदना', 'buy now', 'order now', 'i want to order'],
            bulk:         ['bulk', 'wholesale', 'large quantity', 'minimum', 'bulk order', 'thok', 'थोक', 'bulk order karna'],
            distributor:  ['distributor', 'dealer', 'reseller', 'partnership', 'डिस्ट्रीब्यूटर', 'वितरक', 'become dealer', 'become distributor'],
            grievance:    ['complaint', 'grievance', 'issue', 'problem', 'शिकायत', 'समस्या', 'i have a complaint'],
            quote:        ['quote', 'quotation', 'price list', 'कोट', 'quotation chahiye', 'get a quote']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(k => t.includes(k))) {
                return intent;
            }
        }
        return null;
    }

    // ---- START CONVERSATION ----
    async function startIntent(intent, lang = 'en') {
        const cfg = await loadConfig();
        if (!cfg.enabled) return null;

        const askConfig = (cfg.askForDetailsOn || []).find(a => a.intent === intent);
        if (!askConfig) return null;

        inConversation = true;
        currentIntent = intent;
        conversationData = {
            intent: intent,
            startedAt: Date.now(),
            lang: lang
        };

        return lang === 'hi' && askConfig.messageHi ? askConfig.messageHi : askConfig.message;
    }

    // ---- EXTRACT DETAILS FROM TEXT ----
    function extractDetails(text) {
        const details = {};

        // Email regex
        const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w+/);
        if (emailMatch) details.email = emailMatch[0];

        // Phone regex (Indian format) - 10 digits starting with 6-9
        const phoneMatch = text.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/);
        if (phoneMatch) details.phone = phoneMatch[0].replace(/\s|-/g, '');

        // Name — if it's a short text without email/phone
        if (!details.email && !details.phone) {
            const words = text.trim().split(/\s+/);
            if (words.length >= 1 && words.length <= 5 && !/^\d+$/.test(words[0])) {
                // Only set if name isn't already set
                if (!conversationData.name) {
                    details.name = text.trim();
                }
            }
        }

        return details;
    }

    // ---- SAVE LEAD ----
    async function saveLead(data) {
        const cfg = await loadConfig();
        const leadData = {
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            intent: data.intent || currentIntent || '',
            message: (data.message || '').substring(0, 2000),
            sourcePage: window.location.pathname,
            lang: data.lang || 'en',
            userAgent: navigator.userAgent.substring(0, 200),
            timestamp: new Date().toISOString()
        };

        // 1. Save to Firestore
        if (cfg.saveToFirestore && window.db) {
            try {
                await window.db.collection('ai_leads').add({
                    ...leadData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Lead saved to Firestore');
            } catch (e) {
                console.warn('Firestore save failed:', e);
            }
        }

        // 2. Save to Google Sheets
        if (cfg.saveToGoogleSheet && cfg.googleSheetUrl) {
            try {
                await fetch(cfg.googleSheetUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        name: leadData.name,
                        email: leadData.email,
                        phone: leadData.phone,
                        queryType: leadData.intent,
                        message: leadData.message,
                        sourcePage: leadData.sourcePage,
                        language: leadData.lang
                    })
                });
                console.log('✅ Lead sent to Google Sheet');
            } catch (e) {
                console.warn('Sheet save failed:', e);
            }
        }

        return true;
    }

    // ---- PROCESS MESSAGE ----
    async function processMessage(userText, lang = 'en') {
        const cfg = await loadConfig();
        if (!cfg.enabled) return null;

        // If we're already in a conversation, try to extract details
        if (inConversation) {
            const extracted = extractDetails(userText);
            Object.assign(conversationData, extracted);

            // Append to message history
            if (!conversationData.message) conversationData.message = '';
            conversationData.message += (conversationData.message ? '\n' : '') + userText;

            // Check if we have enough info
            const hasEmail = conversationData.email;
            const hasPhone = conversationData.phone;
            const hasName = conversationData.name;

            // Need at least email OR phone + name
            if ((hasEmail || hasPhone) && hasName) {
                await saveLead(conversationData);
                inConversation = false;
                const thankYou = lang === 'hi' ? cfg.thankYouMessageHi : cfg.thankYouMessage;
                conversationData = {};
                currentIntent = null;
                return { type: 'thank_you', reply: thankYou };
            }

            // Still need more info — ask specifically
            let missing = [];
            if (!hasName) missing.push(lang === 'hi' ? 'नाम' : 'name');
            if (!hasEmail && !hasPhone) missing.push(lang === 'hi' ? 'ईमेल या फ़ोन' : 'email or phone');

            const askMore = lang === 'hi'
                ? `🙏 कृपया ${missing.join(' और ')} साझा करें ताकि हम संपर्क कर सकें।`
                : `🙏 Please share your ${missing.join(' and ')} so we can contact you.`;

            return { type: 'need_more', reply: askMore };
        }

        // Detect new intent
        const intent = detectIntent(userText);
        if (intent) {
            const reply = await startIntent(intent, lang);
            if (reply) {
                conversationData.message = userText;
                return { type: 'ask_details', reply };
            }
        }

        return null;
    }

    // ---- PUBLIC ----
    return {
        loadConfig,
        detectIntent,
        startIntent,
        saveLead,
        processMessage,
        isInConversation: () => inConversation,
        reset: () => { inConversation = false; currentIntent = null; conversationData = {}; }
    };
})();