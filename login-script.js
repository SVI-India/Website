// ===== DEFAULT CREDENTIALS =====
const USERS = {
    admin: {
        email: 'bhakarramuram2@gmail.com',
        password: 'abcd._.1234',
        role: 'admin',
        name: 'Admin',
        permissions: ['all']
    },
    distributor: {
        email: 'distributor@siddhivinayak.in',
        password: 'dist123',
        role: 'distributor',
        name: 'Distributor',
        permissions: ['view_products', 'manage_orders']
    },
    user: {
        email: 'user@siddhivinayak.in',
        password: 'user123',
        role: 'user',
        name: 'User',
        permissions: ['view_products', 'buy_products']
    }
};

// ===== SELECT ROLE =====
let selectedRole = 'admin';

function selectRole(role) {
    selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.role === role);
    });
    document.getElementById('roleDisplay').textContent = `🔑 ${role.charAt(0).toUpperCase() + role.slice(1)} Login`;
    
    // Auto-fill credentials for demo
    const creds = USERS[role];
    if (creds) {
        document.getElementById('emailInput').value = creds.email;
        document.getElementById('passwordInput').value = creds.password;
    }
}

// ===== TOGGLE PASSWORD VISIBILITY =====
function togglePassword() {
    const input = document.getElementById('passwordInput');
    const icon = document.querySelector('.toggle-password i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ===== HANDLE LOGIN =====
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    
    if (!email || !password) {
        alert('⚠️ Please enter email and password');
        return;
    }
    
    // Check credentials
    let user = null;
    for (const [key, value] of Object.entries(USERS)) {
        if (value.email === email && value.password === password) {
            user = { ...value, role: key };
            break;
        }
    }
    
    if (!user) {
        alert('❌ Invalid credentials. Please try again.');
        return;
    }
    
    // Save user session
    localStorage.setItem('siddhi_user', JSON.stringify(user));
    localStorage.setItem('siddhi_role', user.role);
    
    alert(`✅ Welcome ${user.name}! Redirecting to dashboard...`);
    
    // Redirect based on role
    switch(user.role) {
        case 'admin':
            window.location.href = 'admin-panel.html';
            break;
        case 'distributor':
            window.location.href = 'distributor-dashboard.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

// ===== CHECK EXISTING SESSION =====
window.onload = function() {
    const user = localStorage.getItem('siddhi_user');
    if (user) {
        try {
            const data = JSON.parse(user);
            // Redirect if already logged in
            if (data.role === 'admin') {
                window.location.href = 'admin-panel.html';
            } else if (data.role === 'distributor') {
                window.location.href = 'distributor-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        } catch(e) {}
    }
    
    // Auto-select admin and fill credentials
    selectRole('admin');
};