# ⚡ Koutix — AI-Powered Frictionless Retail Platform

## Quick Start

### Option A — No server (open directly in browser)
Just open `index.html` in your browser. All pages work with the built-in mock backend.

### Option B — With Node.js server (recommended for production)
```bash
npm install
cp .env.example .env        # edit SESSION_SECRET
npm start                   # http://localhost:3000
# or for development:
npm run dev                 # auto-restarts on change
```

**Demo credentials:**
| Email | Password | Role |
|-------|----------|------|
| admin@koutix.io | admin123 | Admin |
| manager@koutix.io | manager123 | Manager |
| demo@koutix.io | demo123 | Manager |

---

## File Structure
```
koutix/
├── index.html              ← Public landing page
├── server.js               ← Express server (Node.js)
├── package.json
├── .env.example            ← Copy to .env and configure
│
├── css/
│   └── global.css          ← Design system (tokens, components)
│
├── js/
│   └── app.js              ← Shared utilities + mock/real backend switcher
│
├── routes/
│   ├── auth.js             ← POST /auth/login|logout|refresh|me
│   └── api.js              ← All REST endpoints (branches, orders, inventory…)
│
└── pages/
    ├── login.html          ← Sign-in
    ├── onboarding.html     ← Step 1: Business architecture
    ├── configure.html      ← Step 2: Identity + POS setup
    ├── dashboard.html      ← Branch live orders dashboard
    ├── chain.html          ← Chain/multi-branch manager
    ├── analytics.html      ← Revenue & order analytics
    ├── inventory.html      ← Real-time stock management
    ├── admin.html          ← Platform admin console
    ├── 404.html
    └── 403.html
```

---

## Connecting Your Real Backend

### Step 1 — Switch off mock mode
In `js/app.js`, change:
```js
const USE_MOCK = true;   // ← change to false
```

### Step 2 — Point to your API
```js
const KOUTIX_CONFIG = {
  apiBase: 'https://your-api.com/v1',   // ← your URL here
  ...
};
```

### Step 3 — API contract
Your backend must implement these endpoints (already built in `routes/api.js`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | `{email,password}` → `{access_token, refresh_token, user}` |
| POST | /auth/logout | Invalidate session |
| POST | /auth/refresh | `{refresh_token}` → new tokens |
| GET | /auth/me | Current user |
| GET | /api/branches | List branches (filter: status, region) |
| POST | /api/branches | Create branch |
| PATCH | /api/branches/:id | Update branch |
| DELETE | /api/branches/:id | Delete branch (admin) |
| GET | /api/branches/:id/orders | Live orders |
| PATCH | /api/orders/:id | Update order status |
| GET | /api/branches/:id/inventory | Stock items |
| PATCH | /api/inventory/:id | Update stock quantity |
| GET | /api/analytics/branches/:id | Branch KPIs |
| GET | /api/analytics/platform | Platform stats (admin) |
| GET | /api/branches/:id/pos/status | POS terminal status |
| POST | /api/branches/:id/pos/resync | Force POS resync |
| POST | /api/onboarding/configure | Register store setup |

### Supabase integration example
Replace mock data in `routes/api.js` GET /branches:
```js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.get('/branches', auth, async (req, res) => {
  const { data, error } = await supabase.from('branches').select('*');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});
```

---

## Design System
All colors, fonts, and spacing live in `css/global.css` as CSS variables:
```css
--acid: #B7FD50;     /* primary accent */
--black: #080C08;    /* background */
--surface: #111611;  /* sidebar */
--card: #1e241e;     /* card bg */
--border: rgba(183,253,80,0.12);
```
