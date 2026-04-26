Readme · HTML
Copy

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Scored Mirror Bot — README</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg:        #080b10;
      --surface:   #0e1118;
      --surface2:  #141923;
      --border:    #1e2535;
      --border2:   #29354a;
      --text:      #cdd6e8;
      --muted:     #4e637a;
      --accent:    #3ae0a0;
      --accent2:   #5b8fff;
      --accent3:   #f5a623;
      --red:       #ff5370;
      --green:     #3ae0a0;
      --glow:      rgba(58,224,160,.12);
      --glow2:     rgba(91,143,255,.10);
      --mono:      'JetBrains Mono', monospace;
      --display:   'Syne', sans-serif;
    }
 
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 
    html { scroll-behavior: smooth; }
 
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--mono);
      font-size: 14px;
      line-height: 1.75;
      min-height: 100vh;
      overflow-x: hidden;
    }
 
    /* ── Grid noise texture overlay ── */
    body::before {
      content: '';
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(58,224,160,.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(58,224,160,.015) 1px, transparent 1px);
      background-size: 48px 48px;
    }
 
    /* ── scanline ── */
    body::after {
      content: '';
      position: fixed; inset: 0; z-index: 1; pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,.04) 2px,
        rgba(0,0,0,.04) 4px
      );
    }
 
    /* ─── Layout wrapper ─────────────────────────────── */
    .wrapper { position: relative; z-index: 2; max-width: 900px; margin: 0 auto; padding: 0 1.5rem 5rem; }
 
    /* ─── Hero ───────────────────────────────────────── */
    .hero {
      padding: 4rem 0 3rem;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
 
    .hero-label {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1rem;
      display: flex; align-items: center; gap: .5rem;
    }
    .hero-label::before {
      content: '';
      display: inline-block;
      width: 24px; height: 1px;
      background: var(--accent);
    }
 
    .hero h1 {
      font-family: var(--display);
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -.02em;
      color: #fff;
      margin-bottom: 1.25rem;
    }
 
    .hero h1 .mirror { color: var(--accent); }
    .hero h1 .bot    { color: var(--accent2); }
 
    .hero-desc {
      font-size: 14px;
      color: var(--muted);
      max-width: 560px;
      line-height: 1.8;
      margin-bottom: 2rem;
    }
 
    /* badges */
    .badges { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 2.5rem; }
    .badge {
      display: inline-flex; align-items: center; gap: .35rem;
      font-size: 11px; font-family: var(--mono); font-weight: 600;
      letter-spacing: .05em; text-transform: uppercase;
      padding: .25rem .7rem; border-radius: 4px;
      border: 1px solid;
    }
    .badge-green  { color: var(--green);  border-color: rgba(58,224,160,.3);  background: rgba(58,224,160,.06); }
    .badge-blue   { color: var(--accent2);border-color: rgba(91,143,255,.3); background: rgba(91,143,255,.06); }
    .badge-orange { color: var(--accent3);border-color: rgba(245,166,35,.3);  background: rgba(245,166,35,.06); }
    .badge-red    { color: var(--red);    border-color: rgba(255,83,112,.3);  background: rgba(255,83,112,.06); }
 
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
 
    /* ─── Section ────────────────────────────────────── */
    .section { margin-top: 3.5rem; }
 
    .section-header {
      display: flex; align-items: center; gap: .75rem;
      margin-bottom: 1.5rem; padding-bottom: .75rem;
      border-bottom: 1px solid var(--border);
    }
 
    .section-icon {
      width: 32px; height: 32px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; flex-shrink: 0;
    }
    .icon-green  { background: rgba(58,224,160,.12);  border: 1px solid rgba(58,224,160,.2); }
    .icon-blue   { background: rgba(91,143,255,.12);  border: 1px solid rgba(91,143,255,.2); }
    .icon-orange { background: rgba(245,166,35,.12);  border: 1px solid rgba(245,166,35,.2); }
    .icon-red    { background: rgba(255,83,112,.12);  border: 1px solid rgba(255,83,112,.2); }
 
    .section-title {
      font-family: var(--display);
      font-size: 1.1rem; font-weight: 700;
      color: #fff; letter-spacing: -.01em;
    }
 
    /* ─── Cards ──────────────────────────────────────── */
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
 
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem 1.25rem 1.1rem;
      transition: border-color .2s, background .2s;
      position: relative; overflow: hidden;
    }
 
    .card::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, var(--glow) 0%, transparent 70%);
      opacity: 0; transition: opacity .25s;
    }
    .card:hover::before { opacity: 1; }
    .card:hover { border-color: var(--border2); }
 
    .card-icon { font-size: 1.4rem; margin-bottom: .65rem; }
    .card-title { font-family: var(--display); font-weight: 700; color: #fff; font-size: .95rem; margin-bottom: .35rem; }
    .card-desc  { color: var(--muted); font-size: 12.5px; line-height: 1.7; }
 
    /* ─── Pipeline flow ──────────────────────────────── */
    .pipeline {
      display: flex; gap: 0; flex-wrap: wrap;
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      overflow: hidden;
    }
    .pipeline-step {
      flex: 1; min-width: 130px;
      padding: 1.1rem 1rem;
      border-right: 1px solid var(--border);
      position: relative; text-align: center;
    }
    .pipeline-step:last-child { border-right: none; }
    .pipeline-step::after {
      content: '›';
      position: absolute; right: -9px; top: 50%; transform: translateY(-50%);
      color: var(--muted); font-size: 1.1rem; z-index: 1;
    }
    .pipeline-step:last-child::after { display: none; }
    .step-num {
      font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
      color: var(--muted); margin-bottom: .25rem; font-family: var(--mono);
    }
    .step-label { font-family: var(--display); font-weight: 700; color: #fff; font-size: .8rem; }
    .step-sub { font-size: 11px; color: var(--muted); margin-top: .2rem; }
 
    /* ─── Architecture table ─────────────────────────── */
    .arch-table { width: 100%; border-collapse: collapse; }
    .arch-table th {
      font-size: 10px; text-transform: uppercase; letter-spacing: .12em;
      color: var(--muted); text-align: left; padding: .5rem 1rem;
      border-bottom: 1px solid var(--border); font-weight: 600;
    }
    .arch-table td {
      padding: .75rem 1rem; border-bottom: 1px solid var(--border);
      font-size: 13px; color: var(--text); vertical-align: top;
    }
    .arch-table tr:last-child td { border-bottom: none; }
    .arch-table tr:hover td { background: rgba(255,255,255,.015); }
    .arch-table .tech { color: var(--accent2); font-weight: 600; }
    .arch-table .role { color: var(--muted); font-size: 12px; }
 
    .table-wrap {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
    }
 
    /* ─── Code block ─────────────────────────────────── */
    .code-block {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; overflow: hidden;
    }
    .code-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .6rem 1rem; border-bottom: 1px solid var(--border);
      background: var(--surface2);
    }
    .code-dots { display: flex; gap: .35rem; }
    .code-dot { width: 10px; height: 10px; border-radius: 50%; }
    .cd-red { background: #ff5f57; } .cd-yellow { background: #febc2e; } .cd-green { background: #28c840; }
    .code-filename { font-size: 11px; color: var(--muted); letter-spacing: .04em; }
    pre {
      padding: 1.25rem 1.5rem; overflow-x: auto;
      font-family: var(--mono); font-size: 12.5px; line-height: 1.8;
      color: var(--text);
    }
    .kw  { color: var(--accent2); }
    .str { color: var(--accent); }
    .cm  { color: var(--muted); }
    .num { color: var(--accent3); }
    .fn  { color: #d7baff; }
 
    /* ─── Env var list ───────────────────────────────── */
    .env-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    .env-item {
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
      padding: .85rem 1rem;
    }
    .env-key { font-family: var(--mono); font-size: 12px; color: var(--accent); font-weight: 600; margin-bottom: .2rem; }
    .env-desc { font-size: 11.5px; color: var(--muted); }
 
    /* ─── Mirror list ────────────────────────────────── */
    .mirror-list { display: flex; flex-direction: column; gap: .5rem; }
    .mirror-row {
      display: flex; align-items: center; gap: 1rem;
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
      padding: .75rem 1rem;
    }
    .mirror-icon { font-size: 1.2rem; flex-shrink: 0; }
    .mirror-name { font-weight: 600; color: #fff; font-size: 13px; flex: 1; }
    .mirror-cap { font-size: 11px; color: var(--muted); }
    .mirror-badge {
      font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
      padding: .15rem .55rem; border-radius: 20px;
    }
    .mb-unlimited { background: rgba(58,224,160,.12); color: var(--green); border: 1px solid rgba(58,224,160,.25); }
    .mb-200mb     { background: rgba(245,166,35,.12);  color: var(--accent3); border: 1px solid rgba(245,166,35,.25); }
 
    /* ─── Safeguards ─────────────────────────────────── */
    .guard-list { display: flex; flex-direction: column; gap: .5rem; }
    .guard-item {
      display: flex; gap: .9rem; align-items: flex-start;
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
      padding: .85rem 1rem;
    }
    .guard-icon { color: var(--accent); font-size: 1rem; flex-shrink: 0; margin-top: .1rem; }
    .guard-title { font-weight: 600; color: #fff; font-size: 13px; }
    .guard-desc { font-size: 12px; color: var(--muted); margin-top: .1rem; }
 
    /* ─── Footer ─────────────────────────────────────── */
    .footer {
      margin-top: 5rem; padding-top: 2rem;
      border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
    }
    .footer-brand { font-family: var(--display); font-weight: 700; color: #fff; font-size: .85rem; }
    .footer-links { display: flex; gap: 1.25rem; }
    .footer-links a { color: var(--muted); font-size: 12px; text-decoration: none; transition: color .15s; }
    .footer-links a:hover { color: var(--accent); }
    .footer-note { font-size: 11px; color: var(--muted); }
 
    /* ─── Misc ───────────────────────────────────────── */
    code {
      font-family: var(--mono); font-size: 12px;
      background: rgba(58,224,160,.08); color: var(--accent);
      padding: .1rem .4rem; border-radius: 4px;
      border: 1px solid rgba(58,224,160,.15);
    }
 
    a { color: var(--accent2); text-decoration: none; }
    a:hover { text-decoration: underline; }
 
    @media (max-width: 600px) {
      .env-grid { grid-template-columns: 1fr; }
      .pipeline-step { min-width: 100px; }
      .hero h1 { font-size: 1.9rem; }
    }
  </style>
</head>
<body>
<div class="wrapper">
 
  <!-- ─── HERO ─────────────────────────────────────────── -->
  <header class="hero">
    <div class="hero-label"><span class="dot"></span> Active · Node.js 18+</div>
    <h1>🪞 Scored <span class="mirror">Mirror</span> &amp;<br><span class="bot">Automation</span> Suite</h1>
    <p class="hero-desc">
      A high-performance automated pipeline for discovering, watermarking, and redistributing video content from Scored.co communities — with a real-time admin control panel.
    </p>
    <div class="badges">
      <span class="badge badge-green"><span class="dot"></span> Active</span>
      <span class="badge badge-blue">Node.js 18+</span>
      <span class="badge badge-orange">FFmpeg</span>
      <span class="badge badge-blue">Express.js</span>
      <span class="badge badge-red">MIT License</span>
    </div>
  </header>
 
  <!-- ─── CONTENT LIFECYCLE ─────────────────────────────── -->
  <section class="section">
    <div class="section-header">
      <div class="section-icon icon-green">🔄</div>
      <div class="section-title">Content Lifecycle</div>
    </div>
    <div class="pipeline">
      <div class="pipeline-step">
        <div class="step-num">01</div>
        <div class="step-label">Discovery</div>
        <div class="step-sub">Poll Scored feeds every 90s</div>
      </div>
      <div class="pipeline-step">
        <div class="step-num">02</div>
        <div class="step-label">Validation</div>
        <div class="step-sub">ID dedup · size ≤ 2048 MB</div>
      </div>
      <div class="pipeline-step">
        <div class="step-num">03</div>
        <div class="step-label">Processing</div>
        <div class="step-sub">FFmpeg watermark overlay</div>
      </div>
      <div class="pipeline-step">
        <div class="step-num">04</div>
        <div class="step-label">Distribution</div>
        <div class="step-sub">Concurrent mirror uploads</div>
      </div>
      <div class="pipeline-step">
        <div class="step-num">05</div>
        <div class="step-label">Notification</div>
        <div class="step-sub">Post mirror links as comment</div>
      </div>
    </div>
  </section>
 
  <!-- ─── CORE CAPABILITIES ─────────────────────────────── -->
  <section class="section">
    <div class="section-header">
      <div class="section-icon icon-blue">⚡</div>
      <div class="section-title">Core Capabilities</div>
    </div>
    <div class="card-grid">
      <div class="card">
        <div class="card-icon">📡</div>
        <div class="card-title">Automated Polling</div>
        <div class="card-desc">Monitors <code>c/spictank</code> and <code>c/thenetwork</code> every 90 seconds for new video posts. Concurrent polling of all communities with reentrancy protection.</div>
      </div>
      <div class="card">
        <div class="card-icon">🖼️</div>
        <div class="card-title">Rapid Watermarking</div>
        <div class="card-desc">FFmpeg <code>ultrafast</code> preset with <code>IPLOGO.jpeg</code> overlay at position (0,0). Audio stream is copied directly — no re-encode, maximum quality.</div>
      </div>
      <div class="card">
        <div class="card-icon">📦</div>
        <div class="card-title">Multi-Mirror Redundancy</div>
        <div class="card-desc">Concurrent uploads to Qu.ax, Catbox, BuzzHeavier, and FileDitch via <code>Promise.all</code>. Each mirror can be independently enabled/disabled at runtime.</div>
      </div>
      <div class="card">
        <div class="card-icon">🛡️</div>
        <div class="card-title">Admin Dashboard</div>
        <div class="card-desc">Session-authenticated Express web panel. Toggle mirrors, watermark processing, and per-community comments in real-time without restarting the bot.</div>
      </div>
      <div class="card">
        <div class="card-icon">🗃️</div>
        <div class="card-title">Atomic Persistence</div>
        <div class="card-desc">State written via <code>.tmp</code> file rename — crash-safe. Mirror state cached with a 5 s TTL to minimize disk I/O across concurrent uploads.</div>
      </div>
      <div class="card">
        <div class="card-icon">🔁</div>
        <div class="card-title">Smart Retry Logic</div>
        <div class="card-desc">Up to 3 retries with exponential back-off (max 60 s). 4xx client errors are not retried. Every upload and feed fetch is independently fault-tolerant.</div>
      </div>
    </div>
  </section>
 
  <!-- ─── MIRRORS ───────────────────────────────────────── -->
  <section class="section">
    <div class="section-header">
      <div class="section-icon icon-orange">🪞</div>
      <div class="section-title">Upload Mirrors</div>
    </div>
    <div class="mirror-list">
      <div class="mirror-row">
        <div class="mirror-icon">🟣</div>
        <div class="mirror-name">Qu.ax</div>
        <div class="mirror-cap">Multipart form upload · env: <code>QUAX_API</code></div>
        <span class="mirror-badge mb-unlimited">Unlimited</span>
      </div>
      <div class="mirror-row">
        <div class="mirror-icon">🟠</div>
        <div class="mirror-name">BuzzHeavier</div>
        <div class="mirror-cap">API key + parent folder · env: <code>BUZZHEAVIER_API_KEY</code></div>
        <span class="mirror-badge mb-unlimited">Unlimited</span>
      </div>
      <div class="mirror-row">
        <div class="mirror-icon">🟢</div>
        <div class="mirror-name">FileDitch</div>
        <div class="mirror-cap">Raw PUT stream to <code>new.fileditch.com</code></div>
        <span class="mirror-badge mb-unlimited">Unlimited</span>
      </div>
      <div class="mirror-row">
        <div class="mirror-icon">📦</div>
        <div class="mirror-name">Catbox</div>
        <div class="mirror-cap">Userhash auth · env: <code>CATBOX_USERHASH</code></div>
        <span class="mirror-badge mb-200mb">≤ 200 MB</span>
      </div>
    </div>
  </section>
 
  <!-- ─── ARCHITECTURE ──────────────────────────────────── -->
  <section class="section">
    <div class="section-header">
      <div class="section-icon icon-blue">🔧</div>
      <div class="section-title">Technical Architecture</div>
    </div>
    <div class="table-wrap">
      <table class="arch-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Technology</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Runtime</td>
            <td class="tech">Node.js (ESM)</td>
            <td class="role">Core execution environment — native ES module support</td>
          </tr>
          <tr>
            <td>Web Server</td>
            <td class="tech">Express.js</td>
            <td class="role">Admin dashboard HTTP server and toggle API</td>
          </tr>
          <tr>
            <td>Media Engine</td>
            <td class="tech">FFmpeg</td>
            <td class="role">Ultrafast watermark overlay; audio stream copy (no re-encode)</td>
          </tr>
          <tr>
            <td>HTTP Client</td>
            <td class="tech">Axios</td>
            <td class="role">Feed polling, streaming downloads, multipart uploads</td>
          </tr>
          <tr>
            <td>Database</td>
            <td class="tech">Atomic JSON</td>
            <td class="role">Crash-safe state via <code>.tmp</code> rename; 5 s read cache</td>
          </tr>
          <tr>
            <td>Auth</td>
            <td class="tech">express-session</td>
            <td class="role">8-hour httpOnly session cookies; env-driven credentials</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
 
  <!-- ─── SETUP ─────────────────────────────────────────── -->
  <section class="section">
    <div class="section-header">
      <div class="section-icon icon-green">⚙️</div>
      <div class="section-title">Setup &amp; Configuration</div>
    </div>
 
    <!-- install -->
    <div class="code-block" style="margin-bottom:1rem;">
      <div class="code-header">
        <div class="code-dots"><div class="code-dot cd-red"></div><div class="code-dot cd-yellow"></div><div class="code-dot cd-green"></div></div>
        <span class="code-filename">terminal</span>
      </div>
      <pre><span class="cm"># Clone and install dependencies</span>
<span class="kw">git</span> clone https://github.com/Riotcoke123/scored.co.bot
<span class="kw">cd</span> scored.co.bot
<span class="kw">npm</span> install
 
<span class="cm"># Start the polling bot</span>
<span class="kw">node</span> bot.js
 
<span class="cm"># Start the admin dashboard (separate terminal)</span>
<span class="kw">node</span> admin.js</pre>
    </div>
 
    <!-- .env -->
    <div class="code-block" style="margin-bottom:1.5rem;">
      <div class="code-header">
        <div class="code-dots"><div class="code-dot cd-red"></div><div class="code-dot cd-yellow"></div><div class="code-dot cd-green"></div></div>
        <span class="code-filename">.env</span>
      </div>
      <pre><span class="cm"># ── Admin Panel ──────────────────────────</span>
<span class="kw">ADMIN_PORT</span>=<span class="num">3000</span>
<span class="kw">ADMIN_USER</span>=<span class="str">admin</span>
<span class="kw">ADMIN_PASS</span>=<span class="str">secure_password</span>
<span class="kw">SESSION_SECRET</span>=<span class="str">change-me</span>
 
<span class="cm"># ── Scored API ────────────────────────────</span>
<span class="kw">SCORED_API_KEY</span>=<span class="str">your_key</span>
<span class="kw">SCORED_API_SECRET</span>=<span class="str">your_secret</span>
<span class="kw">SCORED_XSRF_TOKEN</span>=<span class="str">your_token</span>
<span class="kw">USER_AGENT</span>=<span class="str">YourBot/1.0</span>
 
<span class="cm"># ── Mirror Auth ───────────────────────────</span>
<span class="kw">CATBOX_USERHASH</span>=<span class="str">your_hash</span>
<span class="kw">CATBOX_API</span>=<span class="str">https://catbox.moe/user/api.php</span>
<span class="kw">BUZZHEAVIER_API_KEY</span>=<span class="str">your_key</span>
<span class="kw">BUZZHEAVIER_PARENT_ID</span>=<span class="str">your_folder_id</span>
<span class="kw">QUAX_API</span>=<span class="str">https://qu.ax/upload.php</span></pre>
    </div>
 
    <div class="env-grid">
      <div class="env-item">
        <div class="env-key">ADMIN_PORT</div>
        <div class="env-desc">Port for the admin web panel (default: 3000)</div>
      </div>
      <div class="env-item">
        <div class="env-key">SESSION_SECRET</div>
        <div class="env-desc">Random string used to sign session cookies — keep secret</div>
      </div>
      <div class="env-item">
        <div class="env-key">SCORED_API_KEY / SECRET</div>
        <div class="env-desc">Credentials for the Scored.co API</div>
      </div>
      <div class="env-item">
        <div class="env-key">SCORED_XSRF_TOKEN</div>
        <div class="env-desc">XSRF token required for posting comments</div>
      </div>
      <div class="env-item">
        <div class="env-key">CATBOX_USERHASH</div>
        <div class="env-desc">Catbox.moe user hash for authenticated uploads</div>
      </div>
      <div class="env-item">
        <div class="env-key">BUZZHEAVIER_PARENT_ID</div>
        <div class="env-desc">Target folder ID on BuzzHeavier for uploaded files</div>
      </div>
    </div>
  </section>
 
  <!-- ─── SAFEGUARDS ────────────────────────────────────── -->
  <section class="section">
    <div class="section-header">
      <div class="section-icon icon-red">🛡️</div>
      <div class="section-title">Performance Safeguards</div>
    </div>
    <div class="guard-list">
      <div class="guard-item">
        <div class="guard-icon">⏱️</div>
        <div>
          <div class="guard-title">Process Timeouts</div>
          <div class="guard-desc">All downloads, FFmpeg encodes, and uploads are capped at 600,000 ms (10 min) to prevent indefinite hangs.</div>
        </div>
      </div>
      <div class="guard-item">
        <div class="guard-icon">💾</div>
        <div>
          <div class="guard-title">File Size Guard</div>
          <div class="guard-desc">Content-Length header checked pre-download and enforced mid-stream. Maximum 2,048 MB per file; Catbox limited to 200 MB.</div>
        </div>
      </div>
      <div class="guard-item">
        <div class="guard-icon">🧹</div>
        <div>
          <div class="guard-title">Atomic Temp Cleanup</div>
          <div class="guard-desc">Temporary <code>.mp4</code> files unlinked in the <code>finally</code> block. On startup, any leftover temp files from a previous crashed run are removed.</div>
        </div>
      </div>
      <div class="guard-item">
        <div class="guard-icon">🔒</div>
        <div>
          <div class="guard-title">URL Allowlist</div>
          <div class="guard-desc">Only HTTPS URLs from a strict allowlist of known hosts (Catbox, Qu.ax, FileDitch, BuzzHeavier, Videy) are ever downloaded. Social platforms are explicitly skipped.</div>
        </div>
      </div>
      <div class="guard-item">
        <div class="guard-icon">⚡</div>
        <div>
          <div class="guard-title">State Cache TTL</div>
          <div class="guard-desc">Mirror state cached in-memory with a 5 s TTL. A single state snapshot is shared across all concurrent uploads in a processing run — no redundant disk reads.</div>
        </div>
      </div>
      <div class="guard-item">
        <div class="guard-icon">🔁</div>
        <div>
          <div class="guard-title">Reentrancy Lock</div>
          <div class="guard-desc"><code>isFetching</code> flag prevents overlapping poll runs if processing takes longer than the 90 s interval. The scheduler never stacks itself.</div>
        </div>
      </div>
    </div>
  </section>
 
  <!-- ─── FOOTER ────────────────────────────────────────── -->
  <footer class="footer">
    <div>
      <div class="footer-brand">🪞 scored.co.bot</div>
      <div class="footer-note" style="margin-top:.25rem">MIT License · Node.js 18+ · FFmpeg required</div>
    </div>
    <div class="footer-links">
      <a href="https://github.com/Riotcoke123/scored.co.bot">GitHub →</a>
      <a href="https://scored.co">Scored.co →</a>
    </div>
  </footer>
 
</div>
</body>
</html>
 
