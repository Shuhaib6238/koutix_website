const express = require('express');
const router = express.Router();

// ── In-memory user store (swap with DB: PostgreSQL / Supabase / MongoDB) ──
const USERS = [
  { id: 'u1', email: 'admin@koutix.io',   password: 'admin123',   name: 'Alex Sterling',  role: 'admin',   plan: 'enterprise' },
  { id: 'u2', email: 'manager@koutix.io', password: 'manager123', name: 'Sarah Connor',   role: 'manager', plan: 'growth' },
  { id: 'u3', email: 'demo@koutix.io',    password: 'demo123',    name: 'Demo User',      role: 'manager', plan: 'enterprise' },
];

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan };
  res.json({
    access_token: `mock_jwt_${user.id}_${Date.now()}`,
    refresh_token: `mock_refresh_${user.id}`,
    user: req.session.user,
  });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// GET /auth/me
router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not authenticated' });
  res.json(req.session.user);
});

// POST /auth/refresh
router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token || !refresh_token.startsWith('mock_refresh_')) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  const userId = refresh_token.replace('mock_refresh_', '');
  const user = USERS.find(u => u.id === userId);
  if (!user) return res.status(401).json({ message: 'User not found' });
  req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan };
  res.json({
    access_token: `mock_jwt_${user.id}_${Date.now()}`,
    refresh_token: `mock_refresh_${user.id}`,
  });
});

// POST /auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = USERS.find(u => u.email === email);
  // Always return success (security: don't reveal if email exists)
  res.json({ message: user ? 'Reset email sent' : 'If that email exists, a reset link was sent.' });
});

module.exports = router;
