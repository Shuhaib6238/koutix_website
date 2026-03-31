const express = require('express');
const router = express.Router();

// ── Auth middleware ─────────────────────────────────────────
function auth(req, res, next) {
  if (req.session && req.session.user) return next();
  // Also accept Bearer token for API clients
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith('mock_jwt_')) return next(); // dev bypass
  return res.status(401).json({ message: 'Authentication required' });
}

function adminOnly(req, res, next) {
  if (req.session?.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
}

// ── Mock Data Store (replace with DB queries) ───────────────
const db = {
  branches: [
    { id: 'b1', name: 'London Flagship', address: 'Regent St, W1B 5AH', region: 'eu',
      status: 'joined', weekly_revenue: 142500, footfall: 12400,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
      manager_email: 'london@koutix.io', created_at: '2024-01-15' },
    { id: 'b2', name: 'Berlin Hub', address: 'Mitte District, 10117', region: 'eu',
      status: 'invited', weekly_revenue: 0, footfall: 0, image: null,
      manager_email: 'h.muller@koutix.de', created_at: '2024-03-01' },
    { id: 'b3', name: 'NYC Midtown', address: '5th Ave, NY 10019', region: 'na',
      status: 'joined', weekly_revenue: 285900, footfall: 28100,
      image: 'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?w=400&q=80',
      manager_email: 'nyc@koutix.io', created_at: '2024-02-10' },
    { id: 'b4', name: 'Tokyo Express', address: 'Shibuya, Tokyo 150-0002', region: 'apac',
      status: 'joined', weekly_revenue: 198400, footfall: 31200,
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
      manager_email: 'tokyo@koutix.io', created_at: '2024-03-20' },
  ],
  orders: [
    { id: 24, branch_id: 'b1', customer: 'Johnathan Wick', items: 3, total: 84.00, status: 'priority', ordered_at: new Date(Date.now()-4*60000).toISOString() },
    { id: 25, branch_id: 'b1', customer: 'Sarah Connor', items: 1, total: 12.50, status: 'standard', ordered_at: new Date(Date.now()-12*60000).toISOString() },
    { id: 26, branch_id: 'b1', customer: 'Bruce Wayne', items: 12, total: 420.00, status: 'delayed', ordered_at: new Date(Date.now()-35*60000).toISOString() },
    { id: 27, branch_id: 'b3', customer: 'Clark Kent', items: 5, total: 67.50, status: 'standard', ordered_at: new Date(Date.now()-8*60000).toISOString() },
  ],
  inventory: [
    { id: 'p1', branch_id: 'b1', name: 'Organic Milk 2L', sku: 'MLK-002', category: 'Dairy', stock: 42, reorder_level: 20, price: 3.49 },
    { id: 'p2', branch_id: 'b1', name: 'Sourdough Bread', sku: 'BRD-001', category: 'Bakery', stock: 8, reorder_level: 15, price: 4.99 },
    { id: 'p3', branch_id: 'b1', name: 'Free Range Eggs 12', sku: 'EGG-012', category: 'Dairy', stock: 31, reorder_level: 10, price: 5.99 },
    { id: 'p4', branch_id: 'b1', name: 'Sparkling Water 6pk', sku: 'WAT-006', category: 'Beverages', stock: 3, reorder_level: 12, price: 6.49 },
    { id: 'p5', branch_id: 'b1', name: 'Avocados x3', sku: 'AVO-003', category: 'Produce', stock: 22, reorder_level: 10, price: 2.99 },
  ],
  storeIdCounter: 9001,
};

// ════════════════════════════════════════════════════════════
//  BRANCHES
// ════════════════════════════════════════════════════════════
router.get('/branches', auth, (req, res) => {
  let list = [...db.branches];
  if (req.query.status) list = list.filter(b => b.status === req.query.status);
  if (req.query.region) list = list.filter(b => b.region === req.query.region);
  res.json(list);
});

router.get('/branches/:id', auth, (req, res) => {
  const b = db.branches.find(x => x.id === req.params.id);
  if (!b) return res.status(404).json({ message: 'Branch not found' });
  res.json(b);
});

router.post('/branches', auth, (req, res) => {
  const { name, address, manager_email, region = 'na' } = req.body;
  if (!name || !address) return res.status(400).json({ message: 'name and address required' });
  const branch = {
    id: 'b' + Date.now(),
    name, address, region,
    status: 'invited',
    weekly_revenue: 0,
    footfall: 0,
    image: null,
    manager_email: manager_email || '',
    created_at: new Date().toISOString().split('T')[0],
  };
  db.branches.push(branch);
  res.status(201).json(branch);
});

router.patch('/branches/:id', auth, (req, res) => {
  const b = db.branches.find(x => x.id === req.params.id);
  if (!b) return res.status(404).json({ message: 'Branch not found' });
  Object.assign(b, req.body);
  res.json(b);
});

router.delete('/branches/:id', auth, adminOnly, (req, res) => {
  const idx = db.branches.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Branch not found' });
  db.branches.splice(idx, 1);
  res.json({ ok: true });
});

router.post('/branches/:id/resend-invite', auth, (req, res) => {
  const b = db.branches.find(x => x.id === req.params.id);
  if (!b) return res.status(404).json({ message: 'Branch not found' });
  // TODO: integrate email service (SendGrid, Resend, etc.)
  res.json({ ok: true, message: `Invitation resent to ${b.manager_email}` });
});

// ════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════
router.get('/branches/:branchId/orders', auth, (req, res) => {
  let orders = db.orders.filter(o => o.branch_id === req.params.branchId);
  if (req.query.status) orders = orders.filter(o => o.status === req.query.status);
  // Add human-readable time
  const now = Date.now();
  res.json(orders.map(o => ({
    ...o,
    ordered_ago: Math.round((now - new Date(o.ordered_at).getTime()) / 60000) + 'm ago',
  })));
});

router.patch('/orders/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const order = db.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  Object.assign(order, req.body);
  res.json(order);
});

// ════════════════════════════════════════════════════════════
//  INVENTORY
// ════════════════════════════════════════════════════════════
router.get('/branches/:branchId/inventory', auth, (req, res) => {
  const items = db.inventory.filter(i => i.branch_id === req.params.branchId);
  res.json(items.map(i => ({ ...i, low_stock: i.stock <= i.reorder_level })));
});

router.patch('/inventory/:productId', auth, (req, res) => {
  const item = db.inventory.find(i => i.id === req.params.productId);
  if (!item) return res.status(404).json({ message: 'Product not found' });
  if (req.body.quantity !== undefined) item.stock = req.body.quantity;
  res.json(item);
});

// ════════════════════════════════════════════════════════════
//  POS
// ════════════════════════════════════════════════════════════
router.get('/branches/:branchId/pos/status', auth, (req, res) => {
  res.json({
    terminals: [
      { id: 'T01', name: 'Terminal 01', status: 'linked', last_sync: new Date().toISOString() },
      { id: 'T02', name: 'Terminal 02', status: 'offline', last_sync: new Date(Date.now()-3600000).toISOString() },
    ],
    cloud_db: { status: 'synced', last_sync: new Date().toISOString() },
  });
});

router.post('/branches/:branchId/pos/resync', auth, (req, res) => {
  setTimeout(() => {}, 500); // simulate delay
  res.json({ status: 'resyncing', estimated_completion: '30s' });
});

// ════════════════════════════════════════════════════════════
//  ANALYTICS
// ════════════════════════════════════════════════════════════
router.get('/analytics/platform', auth, adminOnly, (req, res) => {
  res.json({
    active_stores: 12482,
    active_stores_change: 8.4,
    total_users: 1200000,
    active_now: 42000,
    users_change: 12,
    api_health: 99.9,
    api_latency_ms: 42,
    volume_24h: 4200000,
    volume_change: -1.2,
    geographic: {
      north_america: { throughput: 65, capacity: 100 },
      europe: { throughput: 80, capacity: 100 },
      asia: { throughput: 55, capacity: 100 },
      oceania: { throughput: 30, capacity: 100 },
    },
    stores: [
      { id: '#KX-9920', chain: 'Lumina Lifestyle', location: 'London, UK', last_sync: '2m ago', status: 'active' },
      { id: '#KX-8122', chain: 'Vertex Market', location: 'New York, US', last_sync: '14m ago', status: 'active' },
      { id: '#KX-7701', chain: 'Atlas Provisions', location: 'Berlin, DE', last_sync: 'Offline', status: 'inactive' },
    ],
  });
});

router.get('/analytics/branches/:id', auth, (req, res) => {
  const { period = '7d' } = req.query;
  res.json({
    branch_id: req.params.id,
    period,
    total_sales: 14280.50,
    sales_change: 12.4,
    avg_prep_time: 14.5,
    prep_change: 2.1,
    active_orders: 28,
    out_for_delivery: 8,
    daily_revenue: [4200, 5100, 3800, 6200, 4900, 5800, 14280],
  });
});

// ════════════════════════════════════════════════════════════
//  ONBOARDING
// ════════════════════════════════════════════════════════════
router.post('/onboarding/architecture', auth, (req, res) => {
  const { type } = req.body;
  if (!['single', 'chain'].includes(type)) return res.status(400).json({ message: 'type must be single or chain' });
  if (req.session.user) req.session.user.arch_type = type;
  res.json({ ok: true, type });
});

router.post('/onboarding/configure', auth, (req, res) => {
  const { name, email, store, pos, gateway } = req.body;
  if (!name || !email || !store) return res.status(400).json({ message: 'name, email, store required' });
  const storeId = `KX-${db.storeIdCounter++}`;
  res.status(201).json({ ok: true, store_id: storeId, message: 'Configuration saved' });
});

module.exports = router;
