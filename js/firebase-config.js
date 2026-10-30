// ============================================================
// 🔥 FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyDtuiVW4DTGrzije9thJZ8vKM2lk7MZPnA",
    authDomain: "shidhi-vinayak-industry.firebaseapp.com",
    databaseURL: "https://shidhi-vinayak-industry-default-rtdb.firebaseio.com",
    projectId: "shidhi-vinayak-industry",
    storageBucket: "shidhi-vinayak-industry.firebasestorage.app",
    messagingSenderId: "199726846751",
    appId: "1:199726846751:web:40a62454f02858957dd62a",
    measurementId: "G-93CVGV4GJ2"
};

if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const ADMIN_EMAIL = "shidhivinayakindustry.svi@gmail.com";

window.auth = auth;
window.db = db;
window.storage = storage;
window.ADMIN_EMAIL = ADMIN_EMAIL;

console.log('✅ Firebase Ready!');

// ============================================================
// AUTO-LOAD SVE LEADS SYSTEM
// ============================================================
(function loadSveLeads() {
    if (window.SVE_LEADS) return;
    const s = document.createElement('script');
    s.src = '/ai/js/leads.js';
    s.async = true;
    s.onload = () => {
        console.log('✅ SVE Leads loaded');
        if (window.SVE_LEADS && window.SVE_LEADS.loadConfig) {
            window.SVE_LEADS.loadConfig();
        }
    };
    s.onerror = () => console.warn('⚠️ SVE Leads failed to load');
    document.head.appendChild(s);
})();