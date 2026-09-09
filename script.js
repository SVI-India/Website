// ===== FIREBASE CONFIG (REPLACE WITH YOURS) =====
const firebaseConfig = {
    apiKey: "AIzaSyBkYgIYg92dLsWpFwChTZj9J-8IIkPstB8",
    authDomain: "siddhivinayak-7f3c4.firebaseapp.com",
    projectId: "siddhivinayak-7f3c4",
    storageBucket: "siddhivinayak-7f3c4.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== AUTH STATE =====
auth.onAuthStateChanged(user => {
    const loginBtn = document.getElementById('loginBtn');
    const userGreeting = document.getElementById('navUser');
    
    if (user) {
        loginBtn.style.display = 'none';
        userGreeting.style.display = 'flex';
        document.getElementById('userAvatar').textContent = (user.displayName || 'U')[0].toUpperCase();
        document.getElementById('userName').textContent = user.displayName || user.email || 'User';
        
        // Save user to Firestore
        db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email,
            phone: user.phoneNumber || '',
            photoURL: user.photoURL || '',
            role: 'user',
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Check if admin
        if (user.email === 'bhakarramuram2@gmail.com') {
            db.collection('users').doc(user.uid).update({ role: 'admin' });
        }
    } else {
        loginBtn.style.display = 'inline-block';
        userGreeting.style.display = 'none';
    }
});

// ===== LOGOUT =====
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut();
        localStorage.removeItem('siddhi_user');
        window.location.reload();
    }
}

// ===== LOAD PRODUCTS FROM FIRESTORE =====
function loadProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#5a7a8e;"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';
    
    db.collection('products').onSnapshot(snapshot => {
        if (snapshot.empty) {
            // Add default products
            addDefaultProducts();
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const p = doc.data();
            html += `
                <div class="product-card" data-aos="zoom-in">
                    <div class="product-image">
                        <img src="${p.image || 'https://images.unsplash.com/photo-1583947584026-5f184ffa7357?w=400&h=400&fit=crop'}" alt="${p.name}" loading="lazy" />
                        <div class="product-badge">${p.badge || 'Popular'}</div>
                    </div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <p>${p.description || ''}</p>
                        <div class="product-footer">
                            <span class="product-price">₹${p.price}</span>
                            <a href="#" class="btn btn-small" onclick="addToCart('${doc.id}')">Buy Now</a>
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
        
        // Re-initialize AOS
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }, error => {
        console.error('Error loading products:', error);
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:#dc3545;">❌ Error loading products</div>';
    });
}

// ===== ADD DEFAULT PRODUCTS =====
function addDefaultProducts() {
    const defaultProducts = [
        {
            name: 'Nikolux Premium Powder',
            brand: 'Nikolux',
            category: 'Powder',
            price: 299,
            stock: 150,
            description: 'Advanced enzyme formula for brilliant whites and vibrant colors.',
            image: 'https://images.unsplash.com/photo-1583947584026-5f184ffa7357?w=400&h=400&fit=crop',
            badge: 'Best Seller'
        },
        {
            name: 'Life Star Eco Liquid',
            brand: 'Life Star',
            category: 'Liquid',
            price: 399,
            stock: 80,
            description: 'Eco-friendly liquid detergent for tough stains and gentle care.',
            image: 'https://images.unsplash.com/photo-1583947584026-5f184ffa7357?w=400&h=400&fit=crop&crop=center',
            badge: 'New'
        },
        {
            name: 'Sanjivni Herbal Cake',
            brand: 'Sanjivni',
            category: 'Cake',
            price: 149,
            stock: 200,
            description: 'Ayurvedic-inspired herbal detergent for safe and effective cleaning.',
            image: 'https://images.unsplash.com/photo-1583947584026-5f184ffa7357?w=400&h=400&fit=crop&crop=right',
            badge: 'Best Value'
        }
    ];
    
    defaultProducts.forEach(p => {
        db.collection('products').add(p);
    });
}

// ===== ADD TO CART (FIREBASE) =====
function addToCart(productId) {
    const user = auth.currentUser;
    if (!user) {
        alert('⚠️ Please login first to add items to cart!');
        window.location.href = 'login.html';
        return;
    }
    
    db.collection('products').doc(productId).get().then(doc => {
        if (doc.exists) {
            const product = doc.data();
            db.collection('carts').add({
                userId: user.uid,
                productId: productId,
                productName: product.name,
                price: product.price,
                quantity: 1,
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('✅ Product added to cart!');
        }
    });
}

// ===== LOAD TESTIMONIALS =====
function loadTestimonials() {
    const grid = document.getElementById('testimonialsGrid');
    db.collection('testimonials').onSnapshot(snapshot => {
        if (snapshot.empty) {
            // Add default testimonials
            addDefaultTestimonials();
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const t = doc.data();
            html += `
                <div class="testimonial-card" data-aos="fade-up">
                    <div class="testimonial-stars">${'★'.repeat(t.rating || 5)}</div>
                    <p>"${t.text}"</p>
                    <div class="testimonial-author">
                        <div class="author-avatar">${(t.name || 'U')[0]}</div>
                        <div>
                            <h4>${t.name || 'Anonymous'}</h4>
                            <span>${t.role || 'Customer'}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
        if (typeof AOS !== 'undefined') AOS.refresh();
    });
}

function addDefaultTestimonials() {
    const defaults = [
        { name: 'Rajesh Kumar', text: 'The quality of Nikolux is unmatched. Our entire family has been using it for years.', rating: 5, role: 'Retailer, Jaipur' },
        { name: 'Priya Singh', text: 'Life Star is eco-friendly and works wonders. I recommend it to all my clients.', rating: 5, role: 'Housewife, Mumbai' },
        { name: 'Amit Mehta', text: 'Sanjivni is the best herbal detergent. Safe for kids\' clothes and very effective.', rating: 5, role: 'Distributor, Delhi' }
    ];
    defaults.forEach(t => db.collection('testimonials').add(t));
}

// ===== CONTACT FORM =====
function submitContact(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        alert('⚠️ Please login first to send messages!');
        window.location.href = 'login.html';
        return;
    }
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const message = document.getElementById('contactMessage').value;
    
    db.collection('messages').add({
        userId: user.uid,
        name: name,
        email: email,
        phone: phone,
        message: message,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('✅ Message sent successfully! We\'ll contact you soon.');
        document.getElementById('contactForm').reset();
    }).catch(err => {
        alert('❌ Error: ' + err.message);
    });
}

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.stat-number');
const speed = 200;
let countersStarted = false;

function animateCounters() {
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const increment = target / speed;
        let current = 0;
        const update = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(update);
            } else {
                counter.textContent = target;
            }
        };
        update();
    });
}

// ===== SCROLL EVENTS =====
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && !countersStarted) {
            countersStarted = true;
            animateCounters();
        }
    }
});

// ===== MOBILE MENU =====
document.getElementById('hamburger').addEventListener('click', function() {
    this.classList.toggle('active');
    document.getElementById('navMenu').classList.toggle('open');
});

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('hamburger').classList.remove('active');
        document.getElementById('navMenu').classList.remove('open');
    });
});

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===== PRELOADER =====
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('preloader').classList.add('hidden');
    }, 800);
});

// ===== AOS INIT =====
if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true, offset: 100 });
}

// ===== INIT =====
loadProducts();
loadTestimonials();

// ===== CHECK ADMIN ON LOAD =====
auth.onAuthStateChanged(user => {
    if (user && user.email === 'bhakarramuram2@gmail.com') {
        console.log('✅ Admin logged in:', user.email);
        // Admin can access admin panel
        const adminLink = document.querySelector('.nav-menu');
        if (adminLink && !document.querySelector('.admin-link')) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="admin-panel.html" style="color:#facc15;"><i class="fas fa-user-shield"></i> Admin Panel</a>`;
            adminLink.appendChild(li);
        }
    }
});