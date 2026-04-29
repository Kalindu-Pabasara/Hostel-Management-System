/* ============================================================
   HOSTEL MANAGEMENT SYSTEM – Common JS
   Loads header/footer, manages session, validation helpers
   ============================================================ */

const API = 'http://localhost:5000/api';

// Auto-inject global favicon
(function injectFavicon() {
  if (typeof document !== 'undefined' && !document.querySelector('link[rel="icon"]')) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = '../img/favicon.svg';
      document.head.appendChild(link);
  }
})();

/* ===================== SESSION ===================== */
const Session = {
  save(user, token) { localStorage.setItem('hms_user', JSON.stringify(user)); localStorage.setItem('hms_token', token); },
  getUser() { try { return JSON.parse(localStorage.getItem('hms_user')); } catch { return null; } },
  getToken() { return localStorage.getItem('hms_token'); },
  clear() { localStorage.removeItem('hms_user'); localStorage.removeItem('hms_token'); },
  isAdmin() { const u = this.getUser(); return u && u.role === 'admin'; },
  isLoggedIn() { return !!this.getToken(); }
};

/* ===================== LOCAL STORAGE STORE =====================
   Persists demo data in the browser so changes survive page refresh.
   When MySQL backend is connected, the API calls take over automatically.
   ================================================================ */
const Store = {
  get(key, defaults) {
    try {
      const raw = localStorage.getItem('hms_' + key);
      return raw ? JSON.parse(raw) : defaults;
    } catch { return defaults; }
  },
  set(key, data) {
    try { localStorage.setItem('hms_' + key, JSON.stringify(data)); } catch { }
  },
  push(key, item, defaults) {
    const arr = this.get(key, defaults);
    arr.push(item);
    this.set(key, arr);
    return arr;
  },
  update(key, id, changes, defaults) {
    const arr = this.get(key, defaults);
    const idx = arr.findIndex(i => i.id === id);
    if (idx > -1) arr[idx] = { ...arr[idx], ...changes };
    this.set(key, arr);
    return arr;
  },
  remove(key, id, defaults) {
    const arr = this.get(key, defaults).filter(i => i.id !== id);
    this.set(key, arr);
    return arr;
  },
  clear(key) { localStorage.removeItem('hms_' + key); }
};

/* ===================== FETCH HELPER ===================== */
async function apiFetch(endpoint, options = {}) {
  const token = Session.getToken();
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  
  // Anti-cache bust for all GET requests natively
  if (!options.method || options.method === 'GET') {
      const glue = endpoint.includes('?') ? '&' : '?';
      endpoint += `${glue}t=${Date.now()}`;
      options.cache = 'no-store';
  }

  try {
    const res = await fetch(API + endpoint, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    throw err;
  }
}

/* ===================== HEADER & FOOTER BUILDER ===================== */
function getRelPath() {
  const p = window.location.pathname;
  if (p.includes('/pages/')) return '../';
  return '';
}

/* ===================== DARK MODE ===================== */
const Theme = {
  init() {
    const saved = localStorage.getItem('hms_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateIcon(saved);
  },
  toggle() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hms_theme', next);
    this.updateIcon(next);
  },
  updateIcon(t) {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  }
};
Theme.init();

function buildHeader() {
  const user = Session.getUser();
  const rel = getRelPath();
  const currentPage = window.location.pathname.split('/').pop();

  const navLinks = [
    { href: `${rel}pages/rooms.html`, label: '🏠 Rooms' },
    { href: `${rel}pages/fee-structure.html`, label: '💰 Fees' },
    { href: `${rel}pages/visitor-register.html`, label: '👥 Visitors' },
    { href: `${rel}pages/about.html`, label: 'ℹ️ About' },
  ];

  const navHTML = navLinks.map(l => {
    const file = l.href.split('/').pop();
    return `<a href="${l.href}" class="${currentPage === file ? 'active' : ''}">${l.label}</a>`;
  }).join('');

  const authHTML = user
    ? `<div class="user-badge">
        <div class="user-avatar" title="${user.name}">${user.name.charAt(0).toUpperCase()}</div>
        <span style="color:rgba(255,255,255,.8);font-size:14px;">${user.name.split(' ')[0]}</span>
       </div>
       <button id="themeToggle" onclick="Theme.toggle()" title="Toggle theme" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px;"></button>
       <button class="btn btn-outline btn-sm" onclick="logout()" style="color:white;border-color:rgba(255,255,255,.4);">Logout</button>`
    : `<button id="themeToggle" onclick="Theme.toggle()" title="Toggle theme" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px;"></button>
       <a href="${rel}pages/login.html" class="btn btn-outline btn-sm" style="color:white;border-color:rgba(255,255,255,.4);">Login</a>
       <a href="${rel}pages/register.html" class="btn btn-primary btn-sm">Register</a>`;

  const html = `
    <header class="site-header">
      <a class="header-logo" href="${rel}pages/${user?.role === 'admin' ? 'dashboard' : 'my-dashboard'}.html">
        <div class="logo-icon">🏨</div>
        <span style="color:white;">Hostel</span><span style="color:var(--teal);">MS</span>
      </a>
      <nav class="header-nav">${navHTML}</nav>
      <div class="header-actions">${authHTML}</div>
    </header>`;

  const el = document.getElementById('site-header');
  if (el) el.outerHTML = html;
  else document.body.insertAdjacentHTML('afterbegin', html);
  Theme.updateIcon(localStorage.getItem('hms_theme') || 'dark');
}

function buildSidebar(active = '') {
  const rel = getRelPath();
  const user = Session.getUser();
  const isAdmin = user && user.role === 'admin';

  const adminGroups = [
    {
      title: '📊 Overview', items: [
        { icon: '📊', label: 'Dashboard',       href: `${rel}pages/dashboard.html`,    key: 'dashboard' },
        { icon: '📋', label: 'Audit Log',        href: `${rel}pages/audit-log.html`,   key: 'audit-log' },
      ]
    },
    {
      title: '🏠 Rooms', items: [
        { icon: '🏠', label: 'Room Availability', href: `${rel}pages/rooms.html`,         key: 'rooms' },
        { icon: '⚙️', label: 'Manage Rooms',      href: `${rel}pages/admin-rooms.html`,   key: 'admin-rooms' },
        { icon: '🛏️', label: 'Room Allocation',   href: `${rel}pages/room-allocate.html`, key: 'room-allocate' },
      ]
    },
    {
      title: '💰 Financials', items: [
        { icon: '💰', label: 'Fee Structure', href: `${rel}pages/fee-structure.html`, key: 'fee-structure' },
        { icon: '💳', label: 'Fee Payments',  href: `${rel}pages/fee-payment.html`,   key: 'fee-payment' },
        { icon: '📝', label: 'Service Requests', href: `${rel}pages/service-requests.html`, key: 'service-requests' },
      ]
    },
    {
      title: '👥 Visitors', items: [
        { icon: '📋', label: 'Register Visitor', href: `${rel}pages/visitor-register.html`, key: 'visitor-register' },
        { icon: '📜', label: 'Visitor History',  href: `${rel}pages/visitor-history.html`,  key: 'visitor-history' },
      ]
    },
    {
      title: '🔧 Operations', items: [
        { icon: '🔧', label: 'Maintenance',   href: `${rel}pages/maintenance.html`,  key: 'maintenance' },
        { icon: '⚙️', label: 'Manage Users',  href: `${rel}pages/admin-users.html`,  key: 'admin-users' },
        { icon: '🗄️', label: 'Data Viewer',   href: `${rel}pages/data-viewer.html`, key: 'data-viewer' },
      ]
    },
    {
      title: '👤 Account', items: [
        { icon: '👤', label: 'My Profile', href: `${rel}pages/profile.html`, key: 'profile' },
      ]
    },
  ];

  const studentGroups = [
    {
      title: '🏠 My Hostel', items: [
        { icon: '📊', label: 'My Dashboard', href: `${rel}pages/my-dashboard.html`,    key: 'my-dashboard' },
        { icon: '🏠', label: 'Browse Rooms', href: `${rel}pages/rooms.html`,           key: 'rooms' },
        { icon: '🔧', label: 'Maintenance',  href: `${rel}pages/maintenance.html`,     key: 'maintenance' },
      ]
    },
    {
      title: '💰 Financials', items: [
        { icon: '💰', label: 'Fee Structure', href: `${rel}pages/fee-structure.html`, key: 'fee-structure' },
        { icon: '💳', label: 'Fee Payments',  href: `${rel}pages/fee-payment.html`,   key: 'fee-payment' },
      ]
    },
    {
      title: '👥 Visitors', items: [
        { icon: '📋', label: 'Register Visitor', href: `${rel}pages/visitor-register.html`, key: 'visitor-register' },
        { icon: '📜', label: 'Visitor History',  href: `${rel}pages/visitor-history.html`,  key: 'visitor-history' },
      ]
    },
    {
      title: '👤 Account', items: [
        { icon: '👤', label: 'My Profile', href: `${rel}pages/profile.html`, key: 'profile' },
      ]
    },
  ];

  const groups = isAdmin ? adminGroups : studentGroups;

  const html = `
    <aside class="layout-sidebar" id="sidebar">
      <nav class="sidebar-nav">
        ${groups.map(g => `
          <div class="sidebar-section-title">${g.title}</div>
          ${g.items.map(i => `
            <a href="${i.href}" class="${i.key === active ? 'active' : ''}">
              <span class="nav-icon">${i.icon}</span>${i.label}
            </a>`).join('')}
        `).join('')}
        <div class="sidebar-section-title">Info</div>
        <a href="${rel}pages/about.html" class="${active === 'about' ? 'active' : ''}">
          <span class="nav-icon">ℹ️</span>About Us
        </a>
        <a href="#" onclick="logout()" style="margin-top:8px;">
          <span class="nav-icon">🚪</span>Logout
        </a>
      </nav>
    </aside>`;



  const el = document.getElementById('sidebar-placeholder');
  if (el) el.outerHTML = html;
}

function buildFooter() {
  const rel = getRelPath();
  const hasSidebar = document.getElementById('sidebar') || document.getElementById('sidebar-placeholder');
  const footerClass = hasSidebar ? '' : 'no-sidebar';

  const html = `
    <footer class="site-footer ${footerClass}">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">🏨 Hostel<span>MS</span></div>
          <p>Modern hostel management system providing seamless accommodation, fee, and visitor management for students.</p>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="${rel}pages/rooms.html">Rooms</a></li>
            <li><a href="${rel}pages/fee-structure.html">Fees</a></li>
            <li><a href="${rel}pages/visitor-register.html">Visitors</a></li>
            <li><a href="${rel}pages/about.html">About Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Account</h4>
          <ul>
            <li><a href="${rel}pages/register.html">Register</a></li>
            <li><a href="${rel}pages/login.html">Login</a></li>
            <li><a href="${rel}pages/profile.html">Profile</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="#">📍 123 Hostel Lane</a></li>
            <li><a href="#">📞 +94 11 234 5678</a></li>
            <li><a href="#">✉️ info@hostelms.lk</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        © ${new Date().getFullYear()} HostelMS. All rights reserved. Built for SLIIT ITP Project.
      </div>
    </footer>`;

  const el = document.getElementById('site-footer');
  if (el) el.outerHTML = html;
  else document.body.insertAdjacentHTML('beforeend', html);
}

function logout() {
  Session.clear();
  const rel = getRelPath();
  window.location.href = rel + 'pages/login.html';
}

/* ===================== VALIDATION HELPERS ===================== */
const Validate = {
  required(val) { return val && val.toString().trim().length > 0; },
  minLen(val, n) { return val && val.trim().length >= n; },
  maxLen(val, n) { return val && val.trim().length <= n; },
  email(val) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); },
  phone(val) { return /^[0-9]{10}$/.test(val.replace(/\s/g, '')); },
  number(val) { return !isNaN(parseFloat(val)) && isFinite(val); },
  positive(val) { return parseFloat(val) > 0; },
  nic(val) { return /^([0-9]{9}[vVxX]|[0-9]{12})$/.test(val.trim()); },
  futureOrToday(val) {
    if (!val || typeof val !== 'string') return false;
    try {
        const d = new Date();
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const localToday = `${yy}-${mm}-${dd}`;
        
        // <input type="date"> passes purely "YYYY-MM-DD"
        return val >= localToday;
    } catch(e) { return false; }
  },
  password(val) { return val && val.length >= 8; },
  match(a, b) { return a === b; },
};

function showError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + '_err');
  if (field) field.classList.add('error');
  if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
}
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + '_err');
  if (field) { field.classList.remove('error'); field.classList.add('success'); }
  if (errEl) errEl.classList.remove('show');
}
function clearAllErrors(form) {
  form.querySelectorAll('.form-control').forEach(f => { f.classList.remove('error', 'success'); });
  form.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
}

function showAlert(containerId, type, msg) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.innerHTML = `${type === 'success' ? '✅' : type === 'danger' ? '❌' : 'ℹ️'} ${msg}`;
  el.classList.add('show');
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 4000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Processing...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.orig || btn.innerHTML;
    btn.disabled = false;
  }
}

/* ===================== REAL-TIME VALIDATION ===================== */
function attachLiveValidation(rules) {
  // rules: [{id, fn, msg}]
  rules.forEach(rule => {
    const el = document.getElementById(rule.id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (rule.fn(el.value)) clearError(rule.id);
      else showError(rule.id, rule.msg);
    });
    el.addEventListener('blur', () => {
      if (rule.fn(el.value)) clearError(rule.id);
      else showError(rule.id, rule.msg);
    });
  });
}

/* ===================== PASSWORD STRENGTH ===================== */
function checkPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

/* ===================== TABLES ===================== */
function renderTable(tbodyId, rows, cols) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;color:var(--text-muted);padding:30px;">No records found.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows;
}

/* ===================== FORMAT HELPERS ===================== */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatCurrency(amount) {
  return 'LKR ' + parseFloat(amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 });
}

/* ===================== CSV EXPORT ===================== */
function exportCSV(data, filename) {
  if (!data || !data.length) { alert('No data to export.'); return; }
  const keys = Object.keys(data[0]);
  const rows = [
    keys.join(','),
    ...data.map(row => keys.map(k => {
      const v = row[k] == null ? '' : String(row[k]).replace(/"/g, '""');
      return `"${v}"`;
    }).join(','))
  ];
  const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename || 'export.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ===================== ACCESS HELPERS ===================== */
function requireLogin() {
  if (!Session.isLoggedIn()) {
    const rel = getRelPath();
    window.location.href = rel + 'pages/login.html';
  }
}
function requireAdmin() {
  requireLogin();
  if (!Session.isAdmin()) {
    const rel = getRelPath();
    window.location.href = rel + 'pages/rooms.html';
  }
}

/* ===================== PRINT RECEIPT ===================== */
function printReceipt(payment, student) {
  const w = window.open('', '_blank', 'width=600,height=700');
  w.document.write(`<!DOCTYPE html><html><head>
    <title>Payment Receipt</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
      .logo { font-size: 22px; font-weight: 800; color: #00b4d8; margin-bottom: 4px; }
      .divider { border-top: 2px dashed #e2e8f0; margin: 20px 0; }
      .row { display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px; }
      .label { color:#64748b; } .value { font-weight:600; }
      .total { font-size:20px; font-weight:800; color:#00b4d8; }
      .badge { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; background:#d1fae5; color:#065f46; }
      @media print { button { display:none !important; } }
    </style>
  </head><body>
    <div class="logo">🏨 HostelMS</div>
    <p style="color:#64748b;font-size:12px;">Hostel Management System · Official Receipt</p>
    <div class="divider"></div>
    <div class="row"><span class="label">Receipt No.</span><span class="value">#REC-${payment.id || '000'}</span></div>
    <div class="row"><span class="label">Student</span><span class="value">${student || payment.studentName || '—'}</span></div>
    <div class="row"><span class="label">Fee Type</span><span class="value">${payment.fee_type}</span></div>
    <div class="row"><span class="label">Billing Month</span><span class="value">${payment.billing_month || '—'}</span></div>
    <div class="row"><span class="label">Payment Method</span><span class="value">${payment.payment_method}</span></div>
    <div class="row"><span class="label">Payment Date</span><span class="value">${payment.payment_date}</span></div>
    ${payment.reference_no ? `<div class="row"><span class="label">Reference No.</span><span class="value">${payment.reference_no}</span></div>` : ''}
    <div class="divider"></div>
    <div class="row"><span class="label total">Amount Paid</span><span class="value total">LKR ${Number(payment.amount).toLocaleString()}</span></div>
    <div class="row" style="margin-top:12px;"><span></span><span class="badge">✅ ${payment.status?.toUpperCase() || 'PAID'}</span></div>
    <div class="divider"></div>
    <p style="font-size:11px;color:#94a3b8;text-align:center;">Printed on ${new Date().toLocaleString()} · HostelMS</p>
    <button onclick="window.print()" style="margin-top:20px;padding:10px 24px;background:#00b4d8;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Print / Save PDF</button>
  </body></html>`);
  w.document.close();
}

/* AUTO-INIT header & footer on DOMContentLoaded */
document.addEventListener('DOMContentLoaded', () => {
  // Auth pages (login / register) have their own layout — skip global header/footer
  const authPages = ['login.html', 'register.html'];
  const currentPage = window.location.pathname.split('/').pop();
  if (authPages.includes(currentPage)) return;
  buildHeader();
  buildFooter();
});

