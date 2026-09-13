import express from 'express';
import session from 'express-session';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import {
    UPDATES_DIR, stageUpload, applyUpdate, checkUpdateOnBoot,
    consumeLastResult, getUpdateState, listBackups, rollbackTo,
} from './lib/update-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const STATE_FILE = path.join(__dirname, 'mirror-state.json');
const PORT = parseInt(process.env.ADMIN_PORT ?? '3000', 10);

// ── Startup credential validation ────────────────────────────────────────────
// Refuse to start with missing/blank admin credentials or session secret —
// an empty ADMIN_USER/ADMIN_PASS in .env previously meant `'' === ''` would
// authenticate ANY blank login attempt.
const ADMIN_USER      = process.env.ADMIN_USER ?? '';
const ADMIN_PASS      = process.env.ADMIN_PASS ?? '';
const SESSION_SECRET  = process.env.SESSION_SECRET ?? '';
const WEAK_SECRETS    = new Set(['', 'change-me', 'changeme', 'secret']);

if (!ADMIN_USER || !ADMIN_PASS) {
    console.error('[admin] FATAL: ADMIN_USER and ADMIN_PASS must both be set to non-empty values in .env. Refusing to start.');
    process.exit(1);
}
if (WEAK_SECRETS.has(SESSION_SECRET)) {
    console.error('[admin] FATAL: SESSION_SECRET is unset or a well-known placeholder. Set a long random value in .env. Refusing to start.');
    process.exit(1);
}

/** Constant-time string comparison — avoids leaking match-length via timing. */
function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    // Hash both to a fixed length first so comparison time doesn't depend on
    // input length either (crypto.timingSafeEqual requires equal-length buffers).
    const hashA = crypto.createHash('sha256').update(bufA).digest();
    const hashB = crypto.createHash('sha256').update(bufB).digest();
    return crypto.timingSafeEqual(hashA, hashB);
}

// ── Simple login rate limiter (per-IP) ───────────────────────────────────────
const LOGIN_WINDOW_MS   = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map(); // ip -> { count, resetAt }

function isRateLimited(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) return false;
    return entry.count >= LOGIN_MAX_ATTEMPTS;
}
function recordFailedLogin(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    } else {
        entry.count++;
    }
}
function clearLoginAttempts(ip) {
    loginAttempts.delete(ip);
}

export const MIRRORS     = ['quax', 'catbox', 'fileditch', 'videy'];
export const COMMUNITIES = ['theNETWORK', 'spictank'];
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
app.set('trust proxy', 1); // needed for correct `secure` cookie detection behind a reverse proxy
app.use(express.urlencoded({ extended: false }));  // false = faster querystring parser
app.use(express.json());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge:   8 * 60 * 60 * 1000,
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict', // mitigates CSRF on the /toggle, /toggle-all, /logout POST routes
    },
}));

// Basic security headers (clickjacking / MIME sniffing / referrer leakage)
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
});

function requireAuth(req, res, next) {
    if (req.session?.authenticated) return next();
    res.redirect('/login');
}

// ── Self-update: crash-loop watchdog ─────────────────────────────────────────
// If we just booted into a freshly-applied update and it's crash-looping,
// roll back and exit so the supervisor (pm2 / docker) relaunches us clean.
{
    const { rolledBack } = checkUpdateOnBoot();
    if (rolledBack) {
        console.error('[update] Rolled back a bad update at startup — exiting so the supervisor restarts on the restored files.');
        process.exit(1);
    }
}

// ── Update upload handling ───────────────────────────────────────────────────
const UPDATE_MAX_BYTES = 150 * 1024 * 1024; // 150MB cap on the uploaded zip itself
const upload = multer({
    dest: UPDATES_DIR,
    limits: { fileSize: UPDATE_MAX_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
        const okExt = file.originalname.toLowerCase().endsWith('.zip');
        const okMime = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'].includes(file.mimetype);
        cb(null, okExt && okMime);
    },
});

// In-memory only — cleared on process restart, which is fine: an update that
// hasn't been applied yet is meant to be re-uploaded after a restart anyway.
let pendingStaged = null; // { stagingDir, files, uploadedZipPath }
let applyInProgress = false;

function clearPendingStaged() {
    if (pendingStaged) {
        try { fs.rmSync(pendingStaged.stagingDir, { recursive: true, force: true }); } catch {}
        try { if (pendingStaged.uploadedZipPath) fs.unlinkSync(pendingStaged.uploadedZipPath); } catch {}
    }
    pendingStaged = null;
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
    const ip = req.ip;
    if (isRateLimited(ip)) {
        console.log(`[admin] Login blocked — too many attempts from ${ip}`);
        return res.status(429).send(loginPage('Too many attempts. Try again later.'));
    }

    const { username = '', password = '' } = req.body ?? {};
    // Reject blank submissions outright, and use constant-time comparison
    // so neither presence, correctness, nor length of a guess leaks via timing.
    const ok = username !== '' && password !== ''
        && timingSafeEqual(username, ADMIN_USER)
        && timingSafeEqual(password, ADMIN_PASS);

    if (ok) {
        clearLoginAttempts(ip);
        req.session.regenerate(err => {
            if (err) return res.status(500).send(loginPage('Server error.'));
            req.session.authenticated = true;
            req.session.user = username;
            res.redirect('/');
        });
        return;
    }

    recordFailedLogin(ip);
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

// ── Self-update routes ───────────────────────────────────────────────────────

app.get('/update', requireAuth, (req, res) => {
    res.send(updatePage({
        lastResult: consumeLastResult(),
        updateState: getUpdateState(),
        backups: listBackups(),
        staged: pendingStaged ? pendingStaged.files : null,
    }));
});

app.get('/update/status', requireAuth, (req, res) => {
    res.json({
        updateState: getUpdateState(),
        staged: pendingStaged ? pendingStaged.files : null,
        applyInProgress,
    });
});

app.post('/update/upload', requireAuth, (req, res) => {
    upload.single('package')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large.' : err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Please choose a .zip file to upload.' });
        }
        clearPendingStaged(); // only one staged update at a time
        try {
            const { stagingDir, files } = stageUpload(req.file.path);
            // The zip has been extracted; we no longer need the raw upload.
            fs.unlink(req.file.path, () => {});
            pendingStaged = { stagingDir, files, uploadedZipPath: null };
            console.log(`[update] Staged ${files.length} file(s) from upload.`);
            res.json({ files });
        } catch (e) {
            fs.unlink(req.file.path, () => {});
            res.status(400).json({ error: e.message });
        }
    });
});

app.post('/update/apply', requireAuth, async (req, res) => {
    if (applyInProgress) return res.status(409).json({ error: 'An update is already being applied.' });
    if (!pendingStaged) return res.status(400).json({ error: 'No package staged. Upload one first.' });

    const { password = '' } = req.body ?? {};
    if (!password || !timingSafeEqual(password, ADMIN_PASS)) {
        return res.status(401).json({ error: 'Incorrect password.' });
    }

    applyInProgress = true;
    const { stagingDir, files } = pendingStaged;
    try {
        const result = await applyUpdate(stagingDir, files);
        pendingStaged = null; // staging dir already cleaned up by applyUpdate
        console.log(`[update] Applied update ${result.backupId} — restarting to load it.`);
        res.json({ success: true, ...result, restarting: true });
        // Let the response flush before we go down.
        setTimeout(() => process.exit(0), 750);
    } catch (e) {
        applyInProgress = false;
        console.error(`[update] Apply failed: ${e.message}`);
        res.status(400).json({ error: e.message });
    }
});

app.post('/update/discard', requireAuth, (req, res) => {
    clearPendingStaged();
    res.json({ success: true });
});

app.post('/update/rollback/:backupId', requireAuth, async (req, res) => {
    const { password = '' } = req.body ?? {};
    if (!password || !timingSafeEqual(password, ADMIN_PASS)) {
        return res.status(401).json({ error: 'Incorrect password.' });
    }
    try {
        await rollbackTo(req.params.backupId);
        console.log(`[update] Manually rolled back to backup ${req.params.backupId} — restarting.`);
        res.json({ success: true, restarting: true });
        setTimeout(() => process.exit(0), 750);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

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
        videy:       { label: 'Videy',       icon: '🎬' },
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
    theNETWORK: { label: 'c/theNETWORK', icon: '💬' },
    spictank:   { label: 'c/spictank',   icon: '💬' },
};

    const mirrorCards    = MIRRORS.map(m => makeCard(m, mirrorMeta[m].label, mirrorMeta[m].icon)).join('\n');
    const watermarkCard  = makeCard('watermark', 'Watermark', '🖼️');
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
    <h1>Mirror Upload Control</h1>
    <div style="display:flex;gap:.5rem">
      <a href="/update" class="logout-btn" style="text-decoration:none;display:inline-block">Update</a>
      <form method="POST" action="/logout">
        <button class="logout-btn" type="submit">Sign out</button>
      </form>
    </div>
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

function updatePage({ lastResult, updateState, backups, staged }) {
    const banner = (() => {
        if (updateState?.pending) {
            return `<div class="banner banner-warn">⏳ An update (${updateState.backupId}) is pending verification — boot attempt ${updateState.bootAttempts}.</div>`;
        }
        if (lastResult?.result === 'verified') {
            return `<div class="banner banner-ok">✅ Update ${lastResult.backupId} applied and verified.</div>`;
        }
        if (lastResult?.result === 'rolled_back') {
            return `<div class="banner banner-warn">↩️ Automatically rolled back to ${lastResult.backupId}. Reason: ${lastResult.reason}</div>`;
        }
        if (lastResult?.result === 'rollback_failed') {
            return `<div class="banner banner-err">⚠️ Rollback itself failed — check the server logs immediately: ${lastResult.reason}</div>`;
        }
        return '';
    })();

    const stagedList = staged
        ? `<ul class="file-list">${staged.map(f => `<li>${f.relPath} <span class="muted">${f.existedBefore ? '(overwrite)' : '(new)'}</span></li>`).join('')}</ul>
           <form id="applyForm">
             <label for="pw">Confirm your admin password to apply</label>
             <input id="pw" name="password" type="password" required autocomplete="current-password">
             <div class="row">
               <button type="submit" class="global-btn primary">Apply update (${staged.length} file${staged.length === 1 ? '' : 's'})</button>
               <button type="button" class="global-btn" onclick="discardStaged()">Discard</button>
             </div>
           </form>`
        : `<p class="muted">No package staged yet.</p>`;

    const backupRows = backups.length
        ? backups.map(id => `<li>${id} <button class="link-btn" onclick="rollback('${id}')">Roll back to this</button></li>`).join('')
        : `<li class="muted">No backups yet.</li>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mirror Admin · Update</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;background:#0d0f14;font-family:system-ui,sans-serif;color:#e2e8f0}
    header{background:#1a1d27;border-bottom:1px solid #2d3148;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between}
    header h1{font-size:1.1rem;color:#fff}
    a.back{color:#a5b4fc;text-decoration:none;font-size:.85rem}
    main{max-width:560px;margin:2rem auto;padding:0 1rem}
    .section{background:#1a1d27;border:1px solid #2d3148;border-radius:10px;padding:1.25rem;margin-bottom:1.25rem}
    .section h2{font-size:.9rem;color:#f1f5f9;margin-bottom:.85rem}
    .banner{border-radius:8px;padding:.75rem 1rem;font-size:.85rem;margin-bottom:1.25rem}
    .banner-ok{background:#0f2e1c;border:1px solid #166534;color:#86efac}
    .banner-warn{background:#3b2f0f;border:1px solid #92660b;color:#fcd34d}
    .banner-err{background:#3b1a1a;border:1px solid #7f1d1d;color:#fca5a5}
    .dropzone{border:2px dashed #2d3148;border-radius:8px;padding:2rem 1rem;text-align:center;color:#64748b;font-size:.85rem;cursor:pointer;transition:border-color .15s}
    .dropzone:hover, .dropzone.drag{border-color:#6366f1;color:#a5b4fc}
    input[type=file]{display:none}
    label{display:block;font-size:.78rem;color:#94a3b8;margin:.75rem 0 .3rem}
    input[type=password]{width:100%;padding:.6rem .85rem;border-radius:7px;border:1px solid #2d3148;background:#0d0f14;color:#e2e8f0;font-size:.95rem;outline:none}
    .row{display:flex;gap:.65rem;margin-top:1rem}
    .global-btn{flex:1;padding:.55rem;border-radius:8px;border:1px solid #2d3148;background:#1a1d27;color:#e2e8f0;font-size:.85rem;font-weight:600;cursor:pointer}
    .global-btn:hover{border-color:#6366f1;color:#a5b4fc}
    .global-btn.primary{background:#6366f1;border-color:#6366f1;color:#fff}
    .global-btn.primary:hover{background:#4f52d9}
    .file-list{list-style:none;max-height:200px;overflow-y:auto;font-size:.82rem;margin-bottom:.5rem}
    .file-list li{padding:.25rem 0;border-bottom:1px solid #2d3148}
    .muted{color:#64748b;font-size:.8rem}
    ul.backups{list-style:none;font-size:.85rem}
    ul.backups li{display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid #2d3148}
    .link-btn{background:none;border:none;color:#a5b4fc;font-size:.78rem;cursor:pointer;text-decoration:underline}
    .toast{position:fixed;bottom:1.5rem;right:1.5rem;background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:.6rem 1.1rem;font-size:.85rem;opacity:0;transition:opacity .25s;pointer-events:none;max-width:320px}
    .toast.show{opacity:1}
  </style>
</head>
<body>
  <header>
    <h1>Site Update</h1>
    <a class="back" href="/">← Back to dashboard</a>
  </header>
  <main>
    ${banner}
    <div class="section">
      <h2>1. Upload package</h2>
      <p class="muted" style="margin-bottom:.75rem">Accepts either a full package or a partial (changed-files-only) package — whatever files are in the zip are the ones that get updated.</p>
      <div class="dropzone" id="dropzone">Click to choose a .zip, or drag one here</div>
      <input type="file" id="fileInput" accept=".zip">
      <div id="uploadArea">${stagedList}</div>
    </div>
    <div class="section">
      <h2>2. Backups (auto-created on every apply)</h2>
      <ul class="backups">${backupRows}</ul>
    </div>
  </main>
  <div class="toast" id="toast"></div>
  <script>
    function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)}
    const dz = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    dz.addEventListener('click', () => fileInput.click());
    ['dragover','dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.toggle('drag', ev==='dragover'); }));
    dz.addEventListener('drop', e => { if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) uploadFile(fileInput.files[0]); });

    async function uploadFile(file) {
      const fd = new FormData();
      fd.append('package', file);
      showToast('Uploading…');
      const res = await fetch('/update/upload', { method:'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { showToast('Error: ' + data.error); return; }
      showToast('Staged ' + data.files.length + ' file(s).');
      setTimeout(() => location.reload(), 600);
    }

    async function discardStaged() {
      await fetch('/update/discard', { method:'POST' });
      location.reload();
    }

    document.getElementById('applyForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('pw').value;
      if (!confirm('This will back up current files, apply the update, and restart the service. Continue?')) return;
      const res = await fetch('/update/apply', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) { showToast('Error: ' + data.error); return; }
      showToast('Applying and restarting…');
      pollForRestart();
    });

    async function rollback(backupId) {
      const password = prompt('Confirm admin password to roll back to ' + backupId + ':');
      if (!password) return;
      const res = await fetch('/update/rollback/' + backupId, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) { showToast('Error: ' + data.error); return; }
      showToast('Rolling back and restarting…');
      pollForRestart();
    }

    function pollForRestart() {
      let tries = 0;
      const iv = setInterval(async () => {
        tries++;
        try {
          const res = await fetch('/update/status', { cache: 'no-store' });
          if (res.ok) { clearInterval(iv); location.href = '/update'; }
        } catch {}
        if (tries > 40) clearInterval(iv); // ~2 min timeout
      }, 3000);
    }
  </script>
</body>
</html>`;
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`[admin] Panel running → http://localhost:${PORT}`));