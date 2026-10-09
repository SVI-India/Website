// ============================================================
// SVE LEADS — Step-by-Step Lead Capture with Validation
// ============================================================

window.SVE_LEADS = (function() {
    'use strict';

    const BASE_URL = 'https://www.sveindia.mywire.org';

    let CONFIG = null;
    let flowState = null;

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
            buy: ['buy', 'order', 'purchase', 'want to buy', 'i want to', 'place order', 'book order',
                  'kharidna', 'order karna', 'ऑर्डर', 'खरीदना', 'buy now', 'order now',
                  'i want to order', 'i want to buy', 'i need', 'chahiye', 'mujhe chahiye'],
            bulk: ['bulk', 'wholesale', 'large quantity', 'minimum order', 'bulk order', 'thok', 'थोक',
                   'bulk karna', 'bulk me', 'wholesale rate'],
            distributor: ['distributor', 'dealer', 'reseller', 'partnership', 'डिस्ट्रीब्यूटर',
                          'वितरक', 'become dealer', 'become distributor', 'distributor banna'],
            grievance: ['complaint', 'complain', 'grievance', 'issue with', 'problem with',
                        'शिकायत', 'समस्या', 'i have a complaint', 'complaint karna'],
            quote: ['quote', 'quotation', 'price list', 'कोट', 'quotation chahiye', 'get a quote',
                    'quote chahiye', 'best price']
        };
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(k => t.includes(k))) return intent;
        }
        return null;
    }

    // ---- VALIDATORS ----
    function validateName(text) {
        const cleaned = String(text).trim();
        if (cleaned.length < 2 || cleaned.length > 50) return null;
        // Must be letters (allow spaces, dots, hyphens for names)
        if (!/^[a-zA-Z\u0900-\u097F\s.\-']+$/.test(cleaned)) return null;
        // No numbers
        if (/\d/.test(cleaned)) return null;
        // Title case for English names
        if (/^[a-zA-Z]/.test(cleaned)) {
            return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
        return cleaned;
    }

    function validateEmail(text) {
        const cleaned = String(text).trim();
        const m = cleaned.match(/^[\w.+-]+@[\w-]+\.[\w.-]+$/);
        if (!m) return null;
        return cleaned.toLowerCase();
    }

    function validatePhone(text) {
        const cleaned = String(text).replace(/[\s\-\(\)]/g, '');
        // Indian mobile: starts with 6-9, 10 digits
        const m = cleaned.match(/(?:\+?91)?([6-9]\d{9})/);
        if (!m) return null;
        return '+91' + m[1];
    }

    function validateQuery(text) {
        const cleaned = String(text).trim();
        if (cleaned.length < 3 || cleaned.length > 500) return null;
        return cleaned;
    }

    // ---- START FLOW ----
    async function startIntent(intent, lang = 'en') {
        const cfg = await loadConfig();
        if (!cfg.enabled || !cfg.stepByStep || !cfg.stepByStep.enabled) return null;

        flowState = {
            intent: intent,
            lang: lang,
            startedAt: Date.now(),
            currentStep: 0,
            data: {},
            awaitingConfirmation: false,
            awaitingEdit: false
        };

        // Return first step's prompt
        return getStepPrompt(cfg, 0, lang);
    }

    // ---- GET STEP PROMPT ----
    function getStepPrompt(cfg, stepIndex, lang) {
        const steps = cfg.stepByStep.steps;
        if (stepIndex >= steps.length) return null;

        const step = steps[stepIndex];
        let prompt = lang === 'hi' ? step.promptHi : step.prompt;
        // Replace {{name}} placeholder
        prompt = prompt.replace(/\{\{name\}\}/g, flowState.data.name || '');
        return prompt;
    }

    // ---- PROCESS MESSAGE (MAIN) ----
    async function processMessage(userText, lang = 'en') {
        const cfg = await loadConfig();
        if (!cfg.enabled) return null;

        // If in flow, continue step-by-step
        if (flowState) {
            return await handleFlowStep(userText, cfg, lang);
        }

        // Not in flow → check for new intent
        const intent = detectIntent(userText);
        if (intent) {
            const reply = await startIntent(intent, lang);
            if (reply) return { type: 'ask_step', reply };
        }

        return null;
    }

    // ---- HANDLE FLOW STEP ----
    async function handleFlowStep(userText, cfg, lang) {
        const t = userText.trim().toLowerCase();

        // Check for CANCEL
        if (['cancel', 'stop', 'exit', 'quit', 'रद्द', 'बंद'].includes(t)) {
            const reply = lang === 'hi' ? cfg.cancelledMessageHi : cfg.cancelledMessage;
            flowState = null;
            return { type: 'cancelled', reply };
        }

        // Check for EDIT (during confirmation)
        if (flowState.awaitingConfirmation) {
            if (['yes', 'y', 'confirm', 'ok', 'submit', 'हाँ', 'हां', 'ठीक'].includes(t)) {
                await saveLead(flowState.data);
                const reply = (lang === 'hi' ? cfg.thankYouMessageHi : cfg.thankYouMessage)
                    .replace(/\{\{name\}\}/g, flowState.data.name || '')
                    .replace(/\{\{email\}\}/g, flowState.data.email || '')
                    .replace(/\{\{phone\}\}/g, flowState.data.phone || '');
                flowState = null;
                return { type: 'submitted', reply };
            }
            if (['edit', 'change', 'no', 'n', 'बदलें', 'नहीं'].includes(t)) {
                const reply = lang === 'hi' ? cfg.editMessageHi : cfg.editMessage;
                flowState.currentStep = 0;
                flowState.data = {};
                flowState.awaitingConfirmation = false;
                const prompt = getStepPrompt(cfg, 0, lang);
                return { type: 'ask_step', reply: reply + '\n\n' + prompt };
            }
            // Any other input → re-ask
            const reply = lang === 'hi' ? cfg.confirmation.messageHi : cfg.confirmation.message;
            return { type: 'confirm', reply: fillTemplate(reply, flowState.data) };
        }

        // Get current step
        const steps = cfg.stepByStep.steps;
        const stepIndex = flowState.currentStep;
        if (stepIndex >= steps.length) {
            flowState = null;
            return null;
        }

        const step = steps[stepIndex];
        let validated = null;

        // Validate based on field type
        switch (step.field) {
            case 'name': validated = validateName(userText); break;
            case 'email': validated = validateEmail(userText); break;
            case 'phone': validated = validatePhone(userText); break;
            case 'query': validated = validateQuery(userText); break;
        }

        // If invalid, re-ask
        if (!validated) {
            const retry = lang === 'hi' ? step.retryHi : step.retry;
            return { type: 'retry', reply: retry };
        }

        // Save value
        flowState.data[step.field] = validated;
        flowState.currentStep++;

        // If all steps done, ask for confirmation
        if (flowState.currentStep >= steps.length) {
            flowState.awaitingConfirmation = true;
            const confirmMsg = lang === 'hi' ? cfg.confirmation.messageHi : cfg.confirmation.message;
            return { type: 'confirm', reply: fillTemplate(confirmMsg, flowState.data) };
        }

        // Ask next step
        const nextPrompt = getStepPrompt(cfg, flowState.currentStep, lang);
        return { type: 'ask_step', reply: nextPrompt };
    }

    // ---- FILL TEMPLATE ----
    function fillTemplate(template, data) {
        return String(template)
            .replace(/\{\{name\}\}/g, data.name || '—')
            .replace(/\{\{email\}\}/g, data.email || '—')
            .replace(/\{\{phone\}\}/g, data.phone || '—')
            .replace(/\{\{query\}\}/g, data.query || '—');
    }

    // ---- SAVE LEAD ----
    async function saveLead(data) {
        const cfg = await loadConfig();
        const leadData = {
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            intent: flowState ? flowState.intent : 'unknown',
            message: data.query || '',
            sourcePage: window.location.pathname,
            lang: flowState ? flowState.lang : 'en',
            userAgent: navigator.userAgent.substring(0, 200),
            timestamp: new Date().toISOString()
        };

        // 1. Firestore
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

        // 2. Google Sheets
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

    // ---- PUBLIC API ----
    return {
        loadConfig,
        detectIntent,
        startIntent,
        processMessage,
        saveLead,
        isInConversation: () => flowState !== null,
        getCurrentState: () => flowState,
        reset: () => { flowState = null; }
    };
})();