import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const STATE_FILE = path.join(__dirname, 'mirror-state.json');
const PORT = parseInt(process.env.ADMIN_PORT ?? '3000', 10);

export const MIRRORS     = ['quax', 'catbox', 'fileditch'];
export const COMMUNITIES = ['theNETWORK'];
export const FEATURES    = ['watermark', ...COMMUNITIES.map(c => `comments_${c}`)];
const ALL_KEYS = new Set([...MIRRORS, ...FEATURES]);

// ── State helpers ─────────────────────────────────────────────────────────────

export function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
    }
    const defaults = Object.fromEntries([...MIRRORS, ...FEATURES].map(k => [k, true]));
    saveState(defaults);
    return defaults;
}

/** Compact JSON — no indentation, smaller file, faster writes. */
export function saveState(state) {
    const tmp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, STATE_FILE);
}

export function isMirrorEnabled(mirror) {
    return loadState()[mirror] ?? true;
}

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();
app.use(express.urlencoded({ extended: false }));  // false = faster querystring parser
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET ?? 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 8 * 60 * 60 * 1000, httpOnly: true },
}));

function requireAuth(req, res, next) {
    if (req.session?.authenticated) return next();
    res.redirect('/login');
}

// ── Pre-rendered static HTML ──────────────────────────────────────────────────
// Computed once at startup so login GET requests never allocate a new string.

const LOGIN_PAGE_OK = loginPage();

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/login', (req, res) => {
    if (req.session?.authenticated) return res.redirect('/');
    res.send(LOGIN_PAGE_OK);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.authenticated = true;
        req.session.user = username;
        return res.redirect('/');
    }
    res.send(loginPage('Invalid credentials.'));
});

app.post('/logout', requireAuth, (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

app.get('/', requireAuth, (req, res) => {
    res.send(dashboardPage(loadState()));
});

app.post('/toggle/:key', requireAuth, (req, res) => {
    const { key } = req.params;
    if (!ALL_KEYS.has(key)) return res.status(400).json({ error: 'Unknown key' });
    const state = loadState();
    state[key] = !state[key];
    saveState(state);
    console.log(`[admin] "${key}" → ${state[key] ? 'ON' : 'OFF'}`);
    res.json({ mirror: key, enabled: state[key] });
});

app.post('/toggle-all', requireAuth, (req, res) => {
    const { enabled } = req.body;
    const state = loadState();
    // Only flips mirrors — watermark is controlled independently
    MIRRORS.forEach(m => { state[m] = !!enabled; });
    saveState(state);
    console.log(`[admin] All mirrors → ${enabled ? 'ON' : 'OFF'}`);
    res.json(state);
});

app.get('/api/state', requireAuth, (req, res) => res.json(loadState()));

// ── HTML helpers ──────────────────────────────────────────────────────────────

function loginPage(error = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mirror Admin · Login</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0f14;font-family:system-ui,sans-serif;color:#e2e8f0}
    .card{background:#1a1d27;border:1px solid #2d3148;border-radius:12px;padding:2.5rem 2rem;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
    h1{font-size:1.3rem;margin-bottom:.25rem;color:#fff}
    p.sub{font-size:.8rem;color:#64748b;margin-bottom:1.75rem}
    label{display:block;font-size:.78rem;color:#94a3b8;margin-bottom:.3rem}
    input{width:100%;padding:.6rem .85rem;border-radius:7px;border:1px solid #2d3148;background:#0d0f14;color:#e2e8f0;font-size:.95rem;margin-bottom:1rem;outline:none;transition:border-color .15s}
    input:focus{border-color:#6366f1}
    button{width:100%;padding:.7rem;border-radius:7px;border:none;background:#6366f1;color:#fff;font-size:.95rem;font-weight:600;cursor:pointer;transition:background .15s}
    button:hover{background:#4f52d9}
    .error{background:#3b1a1a;border:1px solid #7f1d1d;color:#fca5a5;border-radius:7px;padding:.65rem .85rem;font-size:.85rem;margin-bottom:1rem}
  </style>
</head>
<body>
  <div class="card">
    <h1>🔐 Mirror Admin</h1>
    <p class="sub">Sign in to manage upload mirrors</p>
    ${error ? `<div class="error">${error}</div>` : ''}
    <form method="POST" action="/login">
      <label for="u">Username</label>
      <input id="u" name="username" type="text" autocomplete="username" required>
      <label for="p">Password</label>
      <input id="p" name="password" type="password" autocomplete="current-password" required>
      <button type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>`;
}

function dashboardPage(state) {
    const mirrorMeta = {
        quax:        { label: 'Qu.ax',      icon: '🟣' },
        catbox:      { label: 'Catbox',      icon: '📦' },
        fileditch:   { label: 'FileDitch',   icon: '🟢' },
    };

    const makeCard = (key, label, icon) => {
        const on = state[key] !== false;
        return `<div class="mirror-card ${on ? 'on' : 'off'}" id="card-${key}">
        <div class="mirror-info"><span class="icon">${icon}</span><div>
          <div class="mirror-name">${label}</div>
          <div class="mirror-status" id="status-${key}">${on ? 'Enabled' : 'Disabled'}</div>
        </div></div>
        <button class="toggle-btn ${on ? 'btn-on' : 'btn-off'}" id="btn-${key}" onclick="toggle('${key}')">${on ? 'ON' : 'OFF'}</button>
      </div>`;
    };

    const communityMeta = {
        thenetwork: { label: 'c/thenetwork', icon: '💬' },
    };

    const mirrorCards    = MIRRORS.map(m => makeCard(m, mirrorMeta[m].label, mirrorMeta[m].icon)).join('\n');
    const watermarkCard  = makeCard('watermark', 'Watermark (IPLOGO.jpeg)', '🖼️');
    const commentCards   = COMMUNITIES.map(c =>
        makeCard(`comments_${c}`, `Comments · ${communityMeta[c].label}`, communityMeta[c].icon)
    ).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mirror Admin · Dashboard</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;background:#0d0f14;font-family:system-ui,sans-serif;color:#e2e8f0}
    header{background:#1a1d27;border-bottom:1px solid #2d3148;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between}
    header h1{font-size:1.1rem;color:#fff}
    .logout-btn{background:transparent;border:1px solid #2d3148;color:#94a3b8;border-radius:6px;padding:.35rem .85rem;font-size:.82rem;cursor:pointer;transition:all .15s}
    .logout-btn:hover{border-color:#6366f1;color:#a5b4fc}
    main{max-width:540px;margin:2rem auto;padding:0 1rem}
    .section-title{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:.75rem}
    .mirror-card{background:#1a1d27;border:1px solid #2d3148;border-radius:10px;padding:1rem 1.25rem;margin-bottom:.75rem;display:flex;align-items:center;justify-content:space-between;transition:border-color .2s}
    .mirror-card.on{border-left:3px solid #22c55e}
    .mirror-card.off{border-left:3px solid #ef4444;opacity:.75}
    .mirror-info{display:flex;align-items:center;gap:.85rem}
    .icon{font-size:1.4rem}
    .mirror-name{font-size:.95rem;font-weight:600;color:#f1f5f9}
    .mirror-status{font-size:.78rem;color:#64748b;margin-top:.1rem}
    .toggle-btn{padding:.4rem 1.1rem;border-radius:20px;border:none;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .15s;min-width:60px}
    .btn-on{background:#16a34a;color:#fff}
    .btn-off{background:#374151;color:#9ca3af}
    .btn-on:hover{background:#15803d}
    .btn-off:hover{background:#4b5563}
    .global-row{display:flex;gap:.65rem;margin-bottom:1.5rem}
    .global-btn{flex:1;padding:.55rem;border-radius:8px;border:1px solid #2d3148;background:#1a1d27;color:#e2e8f0;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .15s}
    .global-btn:hover{border-color:#6366f1;color:#a5b4fc}
    .toast{position:fixed;bottom:1.5rem;right:1.5rem;background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:.6rem 1.1rem;font-size:.85rem;opacity:0;transition:opacity .25s;pointer-events:none}
    .toast.show{opacity:1}
  </style>
</head>
<body>
  <header>
    <h1>🪞 Mirror Upload Control</h1>
    <form method="POST" action="/logout">
      <button class="logout-btn" type="submit">Sign out</button>
    </form>
  </header>
  <main>
    <div class="section-title">Quick Actions</div>
    <div class="global-row">
      <button class="global-btn" onclick="setAll(true)">✅ Enable All</button>
      <button class="global-btn" onclick="setAll(false)">🚫 Disable All</button>
    </div>
    <div class="section-title">Processing</div>
    ${watermarkCard}
    <div class="section-title" style="margin-top:1.5rem">Community Comments</div>
    ${commentCards}
    <div class="section-title" style="margin-top:1.5rem">Mirrors</div>
    ${mirrorCards}
  </main>
  <div class="toast" id="toast"></div>
  <script>
    function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
    function applyState(m,on){
      document.getElementById('card-'+m).className='mirror-card '+(on?'on':'off');
      document.getElementById('status-'+m).textContent=on?'Enabled':'Disabled';
      const b=document.getElementById('btn-'+m);
      b.className='toggle-btn '+(on?'btn-on':'btn-off');
      b.textContent=on?'ON':'OFF';
    }
    async function toggle(mirror){
      const res=await fetch('/toggle/'+mirror,{method:'POST'});
      if(!res.ok){showToast('Error toggling '+mirror);return}
      const{enabled}=await res.json();
      applyState(mirror,enabled);
      showToast(mirror+' is now '+(enabled?'ON ✅':'OFF 🚫'));
    }
    async function setAll(enabled){
      const res=await fetch('/toggle-all',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled})});
      if(!res.ok){showToast('Error');return}
      const state=await res.json();
      // Only update mirror cards — watermark card is untouched
      ${JSON.stringify(MIRRORS)}.forEach(m=>{if(state[m]!==undefined)applyState(m,state[m])});
      showToast(enabled?'All mirrors enabled ✅':'All mirrors disabled 🚫');
    }
  </script>
</body>
</html>`;
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`[admin] Panel running → http://localhost:${PORT}`));