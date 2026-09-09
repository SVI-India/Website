// ===== CHECK ADMIN SESSION =====
(function checkAdminSession() {
    const userData = localStorage.getItem('siddhi_user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    try {
        const user = JSON.parse(userData);
        if (user.role !== 'admin') {
            alert('❌ Access denied! Admin only.');
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('adminName').textContent = user.name || 'Admin';
        document.getElementById('adminAvatar').textContent = (user.name || 'A')[0].toUpperCase();
    } catch(e) {
        window.location.href = 'login.html';
    }
})();

// ===== PRODUCTS DATA (LocalStorage) =====
let products = [];
let orders = [];
let users = [];

function loadData() {
    try {
        products = JSON.parse(localStorage.getItem('siddhi_products')) || [];
        orders = JSON.parse(localStorage.getItem('siddhi_orders')) || [];
        users = JSON.parse(localStorage.getItem('siddhi_users')) || [];
    } catch(e) {
        products = [];
        orders = [];
        users = [];
    }
    
    // If no products, add default products
    if (products.length === 0) {
        products = [
            { id: Date.now() + 1, name: 'Nikolux Premium Powder', brand: 'Nikolux', category: 'Powder', price: 299, stock: 150, description: 'Advanced enzyme formula for brilliant whites', image: 'https://images.unsplash.com/photo-1583947584026-5f184ffa7357?w=200&h=200&fit=crop' },
            { id: Date.now() + 2, name: 'Life Star Eco Liquid', brand: 'Life Star', category: 'Liquid', price: 399, stock: 80, description: 'Eco-friendly liquid detergent for tough stains', image: 'https://images.unsplash.com/photo-1583947584026-5f184ffa7357?w=200&h=200&fit=crop&crop=center' },
            { id: Date.now() + 3, name: 'Sanjivni Herbal Cake', brand: 'Sanjivni', category: 'Cake', price: 149, stock: 200, description: 'Ayurvedic-inspired herbal detergent cake', image: 'https://images.unsplash.com/photo-1583947584026-5f184ffa7357?w=200&h=200&fit=crop&crop=right' },
        ];
        saveProducts();
    }
    
    if (users.length === 0) {
        users = [
            { id: 1, name: 'Admin', email: 'admin@siddhivinayak.in', role: 'admin', joined: '2024-01-01' },
            { id: 2, name: 'Distributor One', email: 'distributor@siddhivinayak.in', role: 'distributor', joined: '2024-02-15' },
            { id: 3, name: 'Rajesh Kumar', email: 'rajesh@email.com', role: 'user', joined: '2024-03-10' },
        ];
        saveUsers();
    }
    
    if (orders.length === 0) {
        orders = [
            { id: 1, product: 'Nikolux Premium Powder', quantity: 5, total: 1495, status: 'Delivered', date: '2024-05-20', customer: 'Rajesh Kumar' },
            { id: 2, product: 'Life Star Eco Liquid', quantity: 3, total: 1197, status: 'Processing', date: '2024-05-22', customer: 'Priya Singh' },
        ];
        saveOrders();
    }
}

function saveProducts() {
    localStorage.setItem('siddhi_products', JSON.stringify(products));
}

function saveOrders() {
    localStorage.setItem('siddhi_orders', JSON.stringify(orders));
}

function saveUsers() {
    localStorage.setItem('siddhi_users', JSON.stringify(users));
}

// ===== SHOW PAGE =====
function showPage(page) {
    document.querySelectorAll('.sidebar-nav a').forEach(el => el.classList.remove('active'));
    document.querySelector(`.sidebar-nav a[data-page="${page}"]`)?.classList.add('active');
    
    document.querySelectorAll('[id^="page-"]').forEach(el => el.style.display = 'none');
    document.getElementById(`page-${page}`).style.display = 'block';
    
    const titles = {
        dashboard: '📊 Dashboard',
        products: '📦 Products',
        orders: '🛒 Orders',
        users: '👥 Users',
        inventory: '🏪 Inventory'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
    
    if (page === 'dashboard') renderDashboard();
    if (page === 'products') renderProducts();
    if (page === 'orders') renderOrders();
    if (page === 'users') renderUsers();
    if (page === 'inventory') renderInventory();
}

// ===== RENDER DASHBOARD =====
function renderDashboard() {
    loadData();
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('lowStockItems').textContent = products.filter(p => p.stock < 20).length;
    
    const activity = document.getElementById('recentActivity');
    if (orders.length === 0 && products.length === 0) {
        activity.innerHTML = `<div class="empty-state"><i class="fas fa-clock"></i><h4>No recent activity</h4><p>Start adding products and managing your inventory</p></div>`;
    } else {
        let html = '<ul style="list-style:none;padding:0;">';
        const recent = [...orders].slice(-5).reverse();
        recent.forEach(o => {
            html += `<li style="padding:8px 0;border-bottom:1px solid #f0f4f8;display:flex;justify-content:space-between;">
                <span>🛒 ${o.customer} ordered <strong>${o.product}</strong></span>
                <span style="color:#5a7a8e;font-size:0.85rem;">${o.date}</span>
            </li>`;
        });
        html += '</ul>';
        activity.innerHTML = html;
    }
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
    loadData();
    const wrapper = document.getElementById('productsTableWrapper');
    if (products.length === 0) {
        wrapper.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><h4>No products yet</h4><p>Click "Add Product" to get started</p></div>`;
        return;
    }
    let html = `<table>
        <thead><tr>
            <th>Image</th><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
        </tr></thead><tbody>`;
    products.forEach(p => {
        const statusClass = p.stock > 50 ? 'in-stock' : p.stock > 10 ? 'low-stock' : 'out-of-stock';
        const statusLabel = p.stock > 50 ? 'In Stock' : p.stock > 10 ? 'Low Stock' : 'Out of Stock';
        html += `<tr>
            <td><img src="${p.image || 'https://via.placeholder.com/50'}" class="product-img-thumb" alt="${p.name}" /></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.brand}</td>
            <td>${p.category}</td>
            <td>₹${p.price}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel} (${p.stock})</span></td>
            <td>
                <button class="btn-warning btn-sm" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-danger btn-sm" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    wrapper.innerHTML = html;
}

// ===== RENDER ORDERS =====
function renderOrders() {
    loadData();
    const wrapper = document.getElementById('ordersTableWrapper');
    if (orders.length === 0) {
        wrapper.innerHTML = `<div class="empty-state"><i class="fas fa-shopping-cart"></i><h4>No orders yet</h4></div>`;
        return;
    }
    let html = `<table>
        <thead><tr>
            <th>Order ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th>
        </tr></thead><tbody>`;
    orders.forEach(o => {
        html += `<tr>
            <td>#${o.id}</td>
            <td>${o.customer}</td>
            <td>${o.product}</td>
            <td>${o.quantity}</td>
            <td>₹${o.total}</td>
            <td><span class="status-badge ${o.status === 'Delivered' ? 'in-stock' : 'low-stock'}">${o.status}</span></td>
            <td>${o.date}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    wrapper.innerHTML = html;
}

// ===== RENDER USERS =====
function renderUsers() {
    loadData();
    const wrapper = document.getElementById('usersTableWrapper');
    if (users.length === 0) {
        wrapper.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><h4>No users yet</h4></div>`;
        return;
    }
    let html = `<table>
        <thead><tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Joined</th>
        </tr></thead><tbody>`;
    users.forEach(u => {
        const roleEmoji = u.role === 'admin' ? '🛡️' : u.role === 'distributor' ? '🚚' : '👤';
        html += `<tr>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td>${roleEmoji} ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}</td>
            <td>${u.joined}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    wrapper.innerHTML = html;
}

// ===== RENDER INVENTORY =====
function renderInventory() {
    loadData();
    const wrapper = document.getElementById('inventoryWrapper');
    if (products.length === 0) {
        wrapper.innerHTML = `<div class="empty-state"><i class="fas fa-warehouse"></i><h4>No inventory items</h4></div>`;
        return;
    }
    let html = `<div style="display:grid;gap:12px;">`;
    products.forEach(p => {
        const percentage = Math.min((p.stock / 200) * 100, 100);
        const color = p.stock > 50 ? '#28a745' : p.stock > 10 ? '#ffc107' : '#dc3545';
        html += `
            <div style="background:white;padding:16px;border-radius:12px;border:1px solid #e8f0f8;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <div>
                        <strong>${p.name}</strong>
                        <span style="color:#5a7a8e;font-size:0.85rem;margin-left:12px;">${p.brand}</span>
                    </div>
                    <span style="font-weight:700;color:${color};">${p.stock} units</span>
                </div>
                <div style="background:#e8f0f8;border-radius:8px;height:8px;margin-top:8px;overflow:hidden;">
                    <div style="background:${color};height:100%;width:${percentage}%;border-radius:8px;transition:width 0.5s;"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    wrapper.innerHTML = html;
}

// ===== ADD / EDIT PRODUCT =====
function openAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('editProductId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').classList.add('active');
}

function editProduct(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('editProductId').value = id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodBrand').value = product.brand;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodStock').value = product.stock;
    document.getElementById('prodDesc').value = product.description || '';
    document.getElementById('prodImage').value = product.image || '';
    document.getElementById('productModal').classList.add('active');
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const product = {
        id: id || Date.now(),
        name: document.getElementById('prodName').value.trim(),
        brand: document.getElementById('prodBrand').value,
        category: document.getElementById('prodCategory').value,
        price: parseInt(document.getElementById('prodPrice').value),
        stock: parseInt(document.getElementById('prodStock').value),
        description: document.getElementById('prodDesc').value.trim(),
        image: document.getElementById('prodImage').value.trim()
    };
    
    if (!product.name || !product.price || product.stock === undefined) {
        alert('⚠️ Please fill all required fields');
        return;
    }
    
    if (id) {
        const index = products.findIndex(p => p.id == id);
        if (index !== -1) products[index] = product;
    } else {
        products.push(product);
    }
    
    saveProducts();
    closeModal();
    renderProducts();
    renderDashboard();
    alert('✅ Product saved successfully!');
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    products = products.filter(p => p.id != id);
    saveProducts();
    renderProducts();
    renderDashboard();
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('siddhi_user');
        localStorage.removeItem('siddhi_role');
        window.location.href = 'login.html';
    }
}

// ===== INIT =====
loadData();
renderDashboard();

// Close modal on outside click
document.getElementById('productModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});