require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'koutix_dev_secret_change_in_prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// ── Serve static files ────────────────────────────────────
// Serve /css, /js, /pages folders directly
app.use('/css',   express.static(path.join(__dirname, 'css')));
app.use('/js',    express.static(path.join(__dirname, 'js')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/assets',express.static(path.join(__dirname, 'assets')));

// ── API Routes ────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const apiRoutes  = require('./routes/api');
app.use('/auth', authRoutes);
app.use('/api',  apiRoutes);

// ── Auth helpers ──────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  res.redirect('/pages/login.html');
}
function requireAdmin(req, res, next) {
  if (req.session?.user?.role === 'admin') return next();
  res.redirect('/pages/403.html');
}

// ── Page Routes ───────────────────────────────────────────
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'index.html')));

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

app.get('/onboarding', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'onboarding.html')));

app.get('/configure', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'configure.html')));

app.get('/dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html')));

app.get('/branch-dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'branch-dashboard.html')));

app.get('/store-dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'store-dashboard.html')));

app.get('/chain', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'chain.html')));

app.get('/inventory', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'inventory.html')));

app.get('/analytics', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'analytics.html')));

app.get('/admin', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'admin.html')));

app.get('/activate', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'activate.html')));

app.get('/pos', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'pos.html')));

app.get('/pos-events', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'pos-events.html')));

app.get('/profile', (req, res) =>
  res.sendFile(path.join(__dirname, 'pages', 'profile.html')));

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).sendFile(path.join(__dirname, 'pages', '404.html')));

// ── Error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ Koutix running → http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n   Demo credentials:`);
  console.log(`   admin@koutix.io   / admin123`);
  console.log(`   manager@koutix.io / manager123`);
  console.log(`   demo@koutix.io    / demo123\n`);
});

module.exports = app;
