
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
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
 
