// ═══════════════════════════════════════════════════════
//  KOUTIX — Shared Utilities & Backend Connector
// ═══════════════════════════════════════════════════════

// ── CONFIG ──────────────────────────────────────────────
const KOUTIX_CONFIG = {
  // Local Backend API base (Port 5000 as per server.js)
  apiBase: 'https://koutix-backend-1.onrender.com/api',
  // Firebase Web SDK Config (Update with your real API Key)
  firebase: {
  apiKey: "AIzaSyAThZnQ4mOykeLsSkFuwG-zXVMwfei0AM4",
  authDomain: "koutix-57444.firebaseapp.com",
  projectId: "koutix-57444",
  storageBucket: "koutix-57444.firebasestorage.app",
  messagingSenderId: "399645935240",
  appId: "1:399645935240:web:5688425b57ece367a1c13d",
  measurementId: "G-KQG6G2VSF7"
  },
  jwtKey: 'koutix_jwt',
  userKey: 'koutix_user',
};

// ── FIREBASE INIT ────────────────────────────────────────
let auth;
if (typeof firebase !== 'undefined') {
  const app = firebase.initializeApp(KOUTIX_CONFIG.firebase);
  auth = firebase.auth();
}

// ── BACKEND CONNECTOR ────────────────────────────────────
const Backend = {
  async request(method, endpoint, body = null, authRequired = true) {
    const headers = { 'Content-Type': 'application/json' };
    
    const options = {
      method,
      headers,
      credentials: 'include', // Crucial for session cookies
      body: body ? JSON.stringify(body) : null,
    };

    // Ensure we use the correct API prefix (v1 for non-auth routes)
    const url = endpoint.startsWith('/auth') 
      ? KOUTIX_CONFIG.apiBase + endpoint 
      : KOUTIX_CONFIG.apiBase + '/v1' + endpoint;

    const res = await fetch(url, options);
    
    if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'API Request Failed' }));
        throw new Error(errData.message || 'Error ' + res.status);
    }
    
    return res.json();
  },

  async login(email, password) {
    if (!auth) throw new Error('Firebase SDK not loaded');
    
    // 1. Authenticate with Firebase
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // 2. Exchange idToken for Backend Session Cookie
    const res = await this.request('POST', '/auth/login', { idToken }, false);
    
    if (res.success) {
      const user = { 
        uid: res.data.uid, 
        role: res.data.role,
        email: email 
      };
      sessionStorage.setItem(KOUTIX_CONFIG.userKey, JSON.stringify(user));
      return { user };
    }
    throw new Error(res.message || 'Login failed');
  },

  async logout() {
    try {
      if (auth) await auth.signOut();
      await this.request('POST', '/auth/logout');
    } finally {
      sessionStorage.clear();
      window.location.href = '/login';
    }
  },

  async getMe() {
    return this.request('GET', '/auth/me');
  },

  // ── Registration Flows ────────────────────────────────
  registerChain: (data) => Backend.request('POST', '/auth/chain/register', data, false),
  registerStore: (data) => Backend.request('POST', '/auth/store/register', data, false),
  activateBranch: (data) => Backend.request('POST', '/auth/branch/activate', data, false),

  // ── Data Endpoints (Mapped to Backend Models) ─────────
  getBranches: () => Backend.request('GET', '/stores'), // Backend calls them stores
  getMyBranches: () => Backend.request('GET', '/stores/my-branches'), // Chain manager's branches
  getBranchSales: () => Backend.request('GET', '/stores/branch-sales'), // Sales stats for chain manager
  getOrders: () => Backend.request('GET', '/orders'),
  getBranchStats: () => Backend.request('GET', '/stats/branch'),
  
  // ── Superadmin Control ────────────────────────────────
  getPlatformStats: () => Backend.request('GET', '/admin/stats'),
  getAllChains:    () => Backend.request('GET', '/admin/chains'),
  getAllUsers:      () => Backend.request('GET', '/admin/users'),
  getPendingStores: () => Backend.request('GET', '/admin/stores/pending'),
  getAdminStores:   (params = '') => Backend.request('GET', `/admin/stores${params}`),
  getAdminOrders:   (params = '') => Backend.request('GET', `/admin/orders${params}`),
  getStoreDetail:   (id) => Backend.request('GET', `/stores/${id}`),
  approveStore:     (id) => Backend.request('PATCH', `/admin/stores/${id}/approve`),
  rejectStore:      (id, reason) => Backend.request('PATCH', `/admin/stores/${id}/reject`, { reason }),
  suspendStore:     (id) => Backend.request('PATCH', `/admin/stores/${id}/suspend`),

  // ── Network Operations ────────────────────────────────
  inviteBranch: (data) => Backend.request('POST', '/auth/branch/invite', { branchName: data.branchName, branchAddress: data.branchAddress, branchEmail: data.branchEmail }),

  // ── Profile ───────────────────────────────────────────
  updateProfile: (data) => Backend.request('PATCH', '/auth/me', data),
};

const Session = {
  get() { try { return JSON.parse(sessionStorage.getItem(KOUTIX_CONFIG.userKey)); } catch { return null; } },
  require(redirect = '/login') { if (!this.get()) { window.location.href = redirect; return false; } return true; },
};

const Toast = {
  _c: null,
  _container() {
    if (!this._c) { this._c = Object.assign(document.createElement('div'), { className: 'toast-container' }); document.body.appendChild(this._c); }
    return this._c;
  },
  show(msg, type = 'info') {
    const el = Object.assign(document.createElement('div'), { className: `toast ${type}` });
    el.innerHTML = `<span style="margin-right:8px;color:var(--acid)">${type==='success'?'✓':type==='error'?'✕':'ℹ'}</span>${msg}`;
    this._container().appendChild(el);
    setTimeout(() => { el.style.cssText += 'opacity:0;transition:.3s'; setTimeout(() => el.remove(), 300); }, 3500);
  },
  success: (m) => Toast.show(m, 'success'),
  error: (m) => Toast.show(m, 'error'),
};

const Loader = {
  show(btn) { if (!btn) return; btn._orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>`; },
  hide(btn) { if (!btn || !btn._orig) return; btn.disabled = false; btn.innerHTML = btn._orig; },
};

const Utils = {
  formatMoney: (n, sym = '$') => sym + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0 }),
  formatNum: (n) => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n),
};

