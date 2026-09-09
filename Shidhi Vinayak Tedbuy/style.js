/* ===== RESET ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: 'Inter', sans-serif;
    background: #f8faff;
    color: #1a2a3a;
    overflow-x: hidden;
}

:root {
    --primary: #0a2a44;
    --primary-light: #1a4a6e;
    --gold: #facc15;
    --gold-light: #fde68a;
    --white: #ffffff;
    --gray: #f0f4f8;
    --shadow: 0 20px 60px rgba(10, 42, 68, 0.12);
    --radius: 20px;
}

.gold { color: var(--gold); }
.container { max-width: 1200px; margin: auto; padding: 0 24px; }

/* ===== PRELOADER ===== */
#preloader {
    position: fixed;
    inset: 0;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: opacity 0.6s ease;
}
#preloader.hidden {
    opacity: 0;
    pointer-events: none;
}
.loader {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255,255,255,0.1);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== NAVBAR ===== */
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(10, 42, 68, 0.92);
    backdrop-filter: blur(16px);
    z-index: 1000;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: 0.3s;
}
.nav-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.logo h1 {
    font-size: 1.6rem;
    font-weight: 900;
    color: white;
}
.logo-tag {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.5);
    display: block;
    letter-spacing: 2px;
    font-weight: 300;
}
.nav-links {
    display: flex;
    gap: 32px;
    list-style: none;
    align-items: center;
}
.nav-links a {
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    transition: 0.3s;
    position: relative;
}
.nav-links a::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--gold);
    transition: 0.3s;
}
.nav-links a:hover {
    color: white;
}
.nav-links a:hover::after {
    width: 100%;
}
.nav-login {
    background: var(--gold);
    color: var(--primary) !important;
    padding: 8px 22px;
    border-radius: 50px;
    font-weight: 700 !important;
}
.nav-login:hover {
    background: white !important;
    color: var(--primary) !important;
}
.nav-login::after { display: none !important; }

.hamburger {
    display: none;
    color: white;
    font-size: 1.8rem;
    cursor: pointer;
}

/* ===== HERO ===== */
.hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #f8faff 0%, #e8f0fe 100%);
    padding-top: 80px;
    position: relative;
    overflow: hidden;
}
.hero-bg-shapes {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.08;
}
.shape1 {
    width: 500px;
    height: 500px;
    background: var(--gold);
    top: -100px;
    right: -100px;
}
.shape2 {
    width: 300px;
    height: 300px;
    background: var(--primary);
    bottom: -50px;
    left: -50px;
}
.shape3 {
    width: 200px;
    height: 200px;
    background: var(--gold);
    top: 40%;
    left: 30%;
}
.hero-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
    position: relative;
    z-index: 2;
}
.hero-text .badge {
    display: inline-block;
    background: var(--gold);
    color: var(--primary);
    padding: 6px 18px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.85rem;
    margin-bottom: 16px;
}
.hero-text h1 {
    font-size: 3.8rem;
    font-weight: 900;
    line-height: 1.1;
    color: var(--primary);
}
.hero-text p {
    font-size: 1.15rem;
    color: #3a5a72;
    margin: 20px 0 30px;
    max-width: 500px;
    line-height: 1.8;
}
.hero-btns {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}
.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--primary);
    color: white;
    padding: 14px 36px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 700;
    transition: 0.3s;
    border: 2px solid var(--primary);
}
.btn-primary:hover {
    background: transparent;
    color: var(--primary);
    transform: translateY(-3px);
    box-shadow: var(--shadow);
}
.btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    color: var(--primary);
    padding: 14px 36px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 700;
    transition: 0.3s;
    border: 2px solid var(--primary);
}
.btn-outline:hover {
    background: var(--primary);
    color: white;
    transform: translateY(-3px);
    box-shadow: var(--shadow);
}
.hero-stats {
    display: flex;
    gap: 50px;
    margin-top: 40px;
}
.stat h3 {
    font-size: 2.4rem;
    font-weight: 900;
    color: var(--primary);
}
.stat p {
    font-size: 0.9rem;
    color: #5a7a8e;
    margin: 0;
}

/* Hero Image Side */
.hero-image {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}
.hero-illustration {
    width: 350px;
    height: 350px;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 40px 80px rgba(10,42,68,0.25);
}
.hero-illustration i {
    font-size: 10rem;
    color: var(--gold);
}
.floating-card {
    position: absolute;
    background: white;
    padding: 12px 24px;
    border-radius: 16px;
    box-shadow: var(--shadow);
    font-weight: 700;
    color: var(--primary);
    animation: float 4s ease-in-out infinite;
}
.floating-card i { color: var(--gold); margin-right: 8px; }
.card1 { top: 10%; right: 0; animation-delay: 0s; }
.card2 { bottom: 20%; left: -10%; animation-delay: 1s; }
.card3 { bottom: 40%; right: -5%; animation-delay: 2s; }

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-16px); }
}

/* ===== SECTION HEADER ===== */
.section-header {
    text-align: center;
    margin-bottom: 50px;
}
.section-tag {
    display: inline-block;
    background: var(--gold);
    color: var(--primary);
    padding: 4px 18px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 1px;
    text-transform: uppercase;
}
.section-header h2 {
    font-size: 2.8rem;
    font-weight: 900;
    color: var(--primary);
    margin: 10px 0;
}
.section-header p {
    color: #5a7a8e;
    font-size: 1.1rem;
}

/* ===== BRANDS ===== */
.brands {
    padding: 80px 0;
    background: white;
}
.brands-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
}
.brand-card {
    background: var(--gray);
    padding: 40px 30px;
    border-radius: var(--radius);
    text-align: center;
    transition: 0.4s;
    border-bottom: 6px solid var(--brand-color, var(--gold));
    position: relative;
    overflow: hidden;
}
.brand-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--brand-color, var(--gold)), transparent);
    opacity: 0.05;
}
.brand-card:hover {
    transform: translateY(-12px);
    box-shadow: var(--shadow);
}
.brand-icon {
    width: 80px;
    height: 80px;
    background: var(--brand-color, var(--gold));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    font-size: 2.2rem;
    color: white;
}
.brand-card h3 {
    font-size: 1.6rem;
    color: var(--primary);
    margin-bottom: 8px;
}
.brand-card p {
    color: #5a7a8e;
    line-height: 1.7;
}
.brand-tag {
    display: inline-block;
    margin-top: 16px;
    padding: 4px 16px;
    background: var(--brand-color, var(--gold));
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--primary);
}

/* ===== FEATURES ===== */
.features {
    padding: 80px 0;
    background: var(--gray);
}
.features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
}
.feature-card {
    background: white;
    padding: 35px 25px;
    border-radius: var(--radius);
    text-align: center;
    transition: 0.4s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
}
.feature-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow);
}
.feature-icon {
    width: 70px;
    height: 70px;
    background: var(--gold);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 2rem;
    color: var(--primary);
}
.feature-card h3 {
    font-size: 1.2rem;
    color: var(--primary);
    margin-bottom: 6px;
}
.feature-card p {
    color: #5a7a8e;
    font-size: 0.95rem;
    line-height: 1.6;
}

/* ===== SOCIAL CONNECT ===== */
.connect {
    padding: 80px 0;
    background: white;
}
.social-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}
.social-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 30px;
    background: var(--gray);
    border-radius: var(--radius);
    text-decoration: none;
    color: var(--primary);
    font-weight: 600;
    transition: 0.4s;
    border: 2px solid transparent;
}
.social-link:hover {
    border-color: var(--social-color, var(--gold));
    transform: scale(1.05);
    box-shadow: var(--shadow);
}
.social-link i {
    font-size: 2.6rem;
    color: var(--social-color, var(--primary));
}
.social-link span {
    font-size: 1rem;
}

/* ===== CONTACT ===== */
.contact {
    padding: 80px 0;
    background: var(--gray);
}
.contact-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 50px;
    background: white;
    padding: 50px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}
.contact-info h3 {
    font-size: 1.6rem;
    color: var(--primary);
    margin-bottom: 20px;
}
.contact-info p {
    margin: 12px 0;
    color: #3a5a72;
    font-size: 1.05rem;
}
.contact-info .gold { color: var(--gold); margin-right: 10px; }
.contact-warning {
    margin-top: 25px;
    padding: 16px 20px;
    background: #fff3cd;
    border-radius: 12px;
    border-left: 6px solid #ffc107;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    font-size: 0.9rem;
}
.contact-warning i { color: #d39e00; font-size: 1.4rem; }
.contact-warning strong { color: #b22222; }

.contact-form input,
.contact-form textarea {
    width: 100%;
    padding: 14px 18px;
    margin: 8px 0;
    border: 2px solid #e0e8f0;
    border-radius: 12px;
    font-size: 1rem;
    transition: 0.3s;
}
.contact-form input:focus,
.contact-form textarea:focus {
    border-color: var(--primary);
    outline: none;
    box-shadow: 0 0 0 4px rgba(10,42,68,0.08);
}
.contact-form button {
    background: var(--primary);
    color: white;
    padding: 14px 40px;
    border: none;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1.05rem;
    cursor: pointer;
    transition: 0.3s;
    margin-top: 8px;
}
.contact-form button:hover {
    background: var(--gold);
    color: var(--primary);
}

/* ===== FOOTER ===== */
footer {
    background: var(--primary);
    color: rgba(255,255,255,0.7);
    padding: 50px 0 20px;
}
.footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 40px;
    padding-bottom: 30px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
}
.footer-brand h2 {
    font-size: 1.6rem;
    color: white;
}
.footer-brand p { margin: 4px 0; }
.footer-links h4,
.footer-contact h4 {
    color: white;
    margin-bottom: 12px;
}
.footer-links a {
    display: block;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    margin: 6px 0;
    transition: 0.3s;
}
.footer-links a:hover { color: var(--gold); }
.footer-social a {
    display: inline-block;
    color: white;
    margin-right: 12px;
    font-size: 1.4rem;
    transition: 0.3s;
}
.footer-social a:hover { color: var(--gold); }
.footer-bottom {
    text-align: center;
    padding-top: 20px;
    font-size: 0.9rem;
}

/* ===== WHATSAPP FLOAT ===== */
.whatsapp-float {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: #25D366;
    color: white;
    padding: 16px 24px;
    border-radius: 60px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    font-weight: 700;
    box-shadow: 0 8px 30px rgba(37,211,102,0.4);
    transition: 0.3s;
    z-index: 999;
}
.whatsapp-float:hover {
    transform: scale(1.08);
    box-shadow: 0 12px 40px rgba(37,211,102,0.5);
}
.whatsapp-float i { font-size: 1.8rem; }

/* ===== RESPONSIVE ===== */
@media (max-width: 992px) {
    .hero-grid { grid-template-columns: 1fr; text-align: center; }
    .hero-text p { margin: 20px auto; }
    .hero-stats { justify-content: center; }
    .hero-illustration { width: 280px; height: 280px; }
    .hero-illustration i { font-size: 7rem; }
    .brands-grid { grid-template-columns: 1fr 1fr; }
    .features-grid { grid-template-columns: 1fr 1fr; }
    .social-grid { grid-template-columns: 1fr 1fr; }
    .contact-grid { grid-template-columns: 1fr; padding: 30px; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
    .nav-links {
        display: none;
        flex-direction: column;
        background: var(--primary);
        padding: 30px;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        gap: 16px;
    }
    .nav-links.open { display: flex; }
    .hamburger { display: block; }
    .hero-text h1 { font-size: 2.6rem; }
    .brands-grid { grid-template-columns: 1fr; }
    .features-grid { grid-template-columns: 1fr; }
    .social-grid { grid-template-columns: 1fr 1fr; }
    .footer-grid { grid-template-columns: 1fr; }
    .contact-grid { padding: 20px; }
    .hero-stats { gap: 30px; flex-wrap: wrap; }
    .whatsapp-float { padding: 12px 18px; font-size: 0.9rem; }
    .whatsapp-float span { display: none; }
    .floating-card { display: none; }
}

@media (max-width: 480px) {
    .hero-text h1 { font-size: 2rem; }
    .section-header h2 { font-size: 2rem; }
    .hero-illustration { width: 200px; height: 200px; }
    .hero-illustration i { font-size: 5rem; }
    .social-grid { grid-template-columns: 1fr 1fr; }
    .btn-primary, .btn-outline { padding: 10px 24px; font-size: 0.9rem; }
}