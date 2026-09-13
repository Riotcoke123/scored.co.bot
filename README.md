<div align="center">
  <h1>🌐 DaNetworkCode Streamer Scraper</h1>
  <p><b>A high-performance, multi-platform livestream monitoring service.</b></p>
  <p>Actively tracks live status, viewer counts, metadata, categories, and VODs across Kick, Twitch, YouTube, TikTok, <b>Pump.fun</b>, and <b>Rumble</b>.</p>

  <br>

  <a href="https://github.com/Riotcoke123/danetworkcode"><img src="https://img.shields.io/badge/GitHub-Repository-181717.svg?style=for-the-badge&logo=github" alt="GitHub Repository"></a>
  <img src="https://img.shields.io/badge/Node.js-22-green.svg?style=for-the-badge&logo=node.js" alt="Node.js 22">
  <img src="https://img.shields.io/badge/Express-Backend-black.svg?style=for-the-badge&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/Puppeteer-Scraper-04D361.svg?style=for-the-badge&logo=puppeteer" alt="Puppeteer">
  <img src="https://img.shields.io/badge/Playwright-Scraper-2EAD33.svg?style=for-the-badge&logo=playwright" alt="Playwright">
  <img src="https://img.shields.io/badge/SQLite-Database-003B57.svg?style=for-the-badge&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/Docker-Supported-2496ED.svg?style=for-the-badge&logo=docker" alt="Docker">

  <br><br>

  <img width="636" height="424" alt="Dashboard Preview" src="https://github.com/user-attachments/assets/d7a2d55d-2509-49ba-8c74-89b861149787" />
</div>

<br>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-supported-platforms">Platforms</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-security">Security</a>
</p>

<hr>

<h2 id="-features">✨ Features</h2>

<ul>
  <li><b>Multi-platform live scraping</b> — a single scrape cycle checks every configured channel across six platforms and writes live/offline state, viewer counts, thumbnails, and category metadata to SQLite.</li>
  <li><b>Resilient scraper runtime</b> — Puppeteer (Kick/TikTok/YouTube-adjacent pages) and Playwright (Rumble) run concurrently with tuned concurrency limits, per-cycle timeouts, and a scheduled browser restart to avoid memory creep on long-lived VPS deployments.</li>
  <li><b>Kick OAuth (PKCE)</b> — full authorization-code + PKCE flow for Kick's API, with token storage, refresh, and an app-token fallback for unauthenticated lookups.</li>
  <li><b>Featured Streamer of the Day</b> — an automatic, timezone-aware daily rotation that picks a featured streamer and exposes it via <code>/api/featured</code>.</li>
  <li><b>Per-visitor preferences</b> — anonymous visitor IDs (cookie-based) support hiding streamers and "notify me" subscriptions without requiring an account.</li>
  <li><b>Streamer request panel</b> — visitors can submit requests to add a streamer; admins review them behind an admin-token-gated endpoint.</li>
  <li><b>Click analytics</b> — outbound clicks to streamer channels are logged and periodically pruned, with an aggregate stats endpoint.</li>
  <li><b>Threat detection / IP blocking</b> — a sliding-window request-flood counter and scanner detection automatically blocks abusive IPs for a configurable duration, with an optional redirect for blocked visitors.</li>
  <li><b>Hardened HTTP layer</b> — Helmet security headers, per-route rate limiting (general, auth, admin, click, streamer-request), auth-failure logging for fail2ban, and a locked-down 404/500 error path that never leaks stack traces or route structure.</li>
  <li><b>Dead-channel tracking</b> — YouTube channels that come back as terminated/removed/deleted are logged once (with a separate list for Community Guidelines strikes) so they can be pruned from config instead of costing a request every cycle.</li>
  <li><b>Ops-friendly by default</b> — <code>/healthz</code>, <code>/robots.txt</code>, <code>/sitemap.xml</code>, structured logs under <code>./logs</code>, and a Docker healthcheck baked into both the Dockerfile and Compose file.</li>
</ul>

<h2 id="-supported-platforms">📡 Supported Platforms</h2>

<table>
  <thead>
    <tr><th>Platform</th><th>Method</th><th>Notes</th></tr>
  </thead>
  <tbody>
    <tr><td><b>Kick</b></td><td>OAuth API + Puppeteer fallback</td><td>PKCE login flow, token refresh, live m3u8 + latest VOD lookup, banned/suspended channel tracking</td></tr>
    <tr><td><b>Twitch</b></td><td>Official API</td><td>App-token auth, stream + metadata lookup</td></tr>
    <tr><td><b>YouTube</b></td><td><a href="https://github.com/LuanRT/YouTube.js">youtubei.js</a> (InnerTube)</td><td>Live detection, premiere-badge filtering, periodic client restarts, terminated-channel logging</td></tr>
    <tr><td><b>TikTok</b></td><td>Puppeteer + <code>SIGI_STATE</code> parsing</td><td>Live room detection with a meta-tag offline fallback</td></tr>
    <tr><td><b>Pump.fun</b></td><td>API + Puppeteer</td><td>Bulk live-stream lookup, per-mint resolution, viewer-count scraping</td></tr>
    <tr><td><b>Rumble</b></td><td>Playwright</td><td>Runs as a separate process (<code>rumble.js</code>) sharing the same SQLite database, with selector fallbacks for <code>/c/</code> and <code>/user/</code> channel layouts</td></tr>
  </tbody>
</table>

<h2 id="-tech-stack">🛠 Tech Stack</h2>

<ul>
  <li><b>Runtime:</b> Node.js 22, Express 4</li>
  <li><b>Scraping:</b> Puppeteer + <code>puppeteer-extra-plugin-stealth</code>, Playwright (Chromium)</li>
  <li><b>Database:</b> SQLite via <code>better-sqlite3</code> (WAL mode), with a thin pg-compatible query shim in <code>db.js</code></li>
  <li><b>Security:</b> Helmet, <code>express-rate-limit</code>, custom threat-detection middleware, PKCE OAuth</li>
  <li><b>Frontend:</b> Static HTML/CSS/JS dashboard served from <code>public/</code> and <code>views/</code></li>
  <li><b>Deployment:</b> Docker (multi-stage build) + Docker Compose, or PM2 for bare-metal process management</li>
</ul>

<h2 id="-getting-started">🚀 Getting Started</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Node.js <b>≥ 22.12.0</b></li>
  <li>Chromium/Chrome available for Puppeteer and Playwright (system Chromium is used in Docker; locally, Puppeteer/Playwright will use their own downloaded browsers unless you point them at a system install)</li>
  <li>API credentials for the platforms you want to track (Kick and Twitch require OAuth app credentials; see <a href="#-configuration">Configuration</a>)</li>
</ul>

<h3>1. Clone and install</h3>

```bash
git clone https://github.com/Riotcoke123/danetworkcode.git
cd danetworkcode
npm install
```

<h3>2. Configure environment</h3>

```bash
cp .env.example .env   # if you don't have one yet, copy your existing .env as a starting point
```

Fill in the variables described in <a href="#-configuration">Configuration</a> — at minimum <code>PORT</code>, <code>ADMIN_TOKEN</code>, the channel-list variables for the platforms you're tracking, and any OAuth credentials.

<h3>3. Run locally</h3>

```bash
npm start        # production
npm run dev       # nodemon, auto-restarts on file changes
```

The dashboard is served at <code>http://localhost:3000</code> (or whatever <code>PORT</code> is set to). Rumble tracking runs as its own process:

```bash
node rumble.js
```

<h3>4. Run with Docker (recommended for deployment)</h3>

```bash
docker compose up -d --build
```

This builds the multi-stage image (Node deps → runtime with system Chromium), mounts <code>./logs</code> and <code>./data</code> so logs and the SQLite database survive container recreation, and starts the built-in healthcheck against <code>/healthz</code>.

<h3>5. Run with PM2 (bare metal, no Docker)</h3>

```bash
npm run pm2-start     # start under PM2 as "streamer-list"
npm run pm2-restart   # restart
npm run pm2-logs      # tail the last 100 log lines
npm run pm2-stop      # stop
```

<h2 id="-configuration">⚙️ Configuration</h2>

<p>All configuration lives in <code>.env</code>. Nothing here is checked into the repo with real values — treat every credential below as secret.</p>

<details>
<summary><b>Core server</b></summary>

| Variable | Purpose |
|---|---|
| `PORT` | Port the Express server listens on |
| `ADMIN_TOKEN` | Bearer token required for admin-only routes (`/healthz`, streamer-request review, Rumble admin API) |
| `TRUST_PROXY_HOPS` | Number of reverse-proxy hops to trust for `req.ip` (rate limiting, auth logging). Defaults to `1` |
| `SESSION_SECRET` | Secret used for session/cookie signing |

</details>

<details>
<summary><b>Scrape cycle tuning</b></summary>

| Variable | Purpose |
|---|---|
| `CHECK_INTERVAL_SECONDS` | How often a full scrape cycle runs |
| `CONCURRENT_LIMIT` | General scrape concurrency (via `p-limit`) |
| `SCRAPE_CONCURRENCY` | Rumble's Playwright concurrency (`rumble.js`) |
| `PUPPETEER_CONCURRENT_LIMIT` | Puppeteer's own concurrency pool; falls back to `3` |
| `SCRAPE_TIMEOUT_MS` | Hard timeout before a scrape cycle is aborted as hung; falls back to `300000` (5 min) |
| `MAX_SCRAPES_BEFORE_RESTART` | Forces a browser restart after N cycles to clear memory buildup; falls back to `30` |
| `SHUTDOWN_SCRAPE_GRACE_MS` | Grace period given to an in-flight scrape during graceful shutdown |

</details>

<details>
<summary><b>YouTube tuning (youtubei.js)</b></summary>

| Variable | Purpose |
|---|---|
| `YOUTUBE_CONCURRENT_LIMIT` | Concurrent lanes dispatching YouTube requests |
| `YOUTUBE_REQUEST_DELAY_MS` | Global pacing between dispatches, applied across all lanes |
| `YOUTUBE_REQUEST_TIMEOUT_MS` | Per-request timeout |
| `YOUTUBE_OFFLINE_CONFIRM_MISSES` | Consecutive "offline" misses required before a channel is marked offline, to debounce one-off scrape hiccups; falls back to `2` |

> Throughput is capped by pacing, not lane count — e.g. 20 lanes at a 60 ms pace tops out around 16–17 req/s regardless of how many lanes you add. Tune `YOUTUBE_REQUEST_DELAY_MS` up if YouTube starts throttling.

</details>

<details>
<summary><b>Platform API bases & credentials</b></summary>

| Variable | Purpose |
|---|---|
| `KICK_AUTH_BASE`, `KICK_API_BASE`, `KICK_VOD_BASE`, `KICK_WEB_BASE` | Kick endpoint overrides |
| `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, `KICK_REDIRECT_URI` | Kick OAuth (PKCE) app credentials |
| `TWITCH_AUTH_BASE`, `TWITCH_API_BASE`, `TWITCH_WEB_BASE` | Twitch endpoint overrides |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | Twitch app credentials |
| `LIVEPEER_CDN_BASE` | CDN base used for stream playback URLs |
| `PUMPFUN_API_BASE`, `PUMPFUN_WEB_BASE` | Pump.fun endpoint overrides |
| `PUMPFUN_API_KEY`, `PUMPFUN_MINTS` | Pump.fun API key and tracked mint list |
| `USER_AGENT` | User-Agent string sent by scrapers (Puppeteer/Playwright/fetch) |

</details>

<details>
<summary><b>Tracked channels & categories</b></summary>

| Variable | Purpose |
|---|---|
| `YOUTUBE_CHANNEL_IDS` | Comma-separated YouTube channel IDs to track |
| `TWITCH_USERNAMES` | Comma-separated Twitch usernames to track |
| `KICK_USERNAMES` | Comma-separated Kick usernames to track |
| `TIKTOK_USERNAMES` | Comma-separated TikTok usernames to track |
| `RUMBLE_CHANNELS`, `RUMBLE_USERS` | Rumble `/c/` channels and `/user/` accounts to track |
| `STREAMER_CATEGORIES` | Category assignments applied to configured streamers |

</details>

<details>
<summary><b>Threat detection / IP blocking</b></summary>

| Variable | Purpose |
|---|---|
| `THREAT_BLOCK_DURATION_MS` | How long a flagged IP stays blocked; default 1 hour |
| `THREAT_WINDOW_MS` | Sliding window size for the request-flood counter |
| `THREAT_REQUEST_THRESHOLD` | Max requests per window before an IP is flagged and blocked |
| `THREAT_REDIRECT_URL` | Where blocked/flagged visitors are redirected instead of an error page |

</details>

<h2 id="-api-reference">📖 API Reference</h2>

<table>
<thead><tr><th>Method</th><th>Route</th><th>Description</th></tr></thead>
<tbody>
<tr><td>GET</td><td><code>/</code></td><td>Dashboard</td></tr>
<tr><td>GET</td><td><code>/api/streamers</code></td><td>List tracked streamers and their live status/metadata</td></tr>
<tr><td>GET</td><td><code>/api/featured</code></td><td>Current Featured Streamer of the Day</td></tr>
<tr><td>GET / POST</td><td><code>/api/prefs</code></td><td>Read/save per-visitor hidden-streamer and notify-me preferences</td></tr>
<tr><td>POST</td><td><code>/api/streamer-requests</code></td><td>Submit a request to add a streamer (rate limited)</td></tr>
<tr><td>GET</td><td><code>/api/streamer-requests</code></td><td>🔒 Admin: view submitted streamer requests</td></tr>
<tr><td>ALL</td><td><code>/api/rumble/*</code></td><td>🔒 Admin: Rumble scraper admin routes</td></tr>
<tr><td>POST</td><td><code>/api/click</code></td><td>Log an outbound click on a streamer link</td></tr>
<tr><td>GET</td><td><code>/api/analytics/clicks</code></td><td>Aggregated click analytics</td></tr>
<tr><td>GET</td><td><code>/api/stats</code></td><td>General dashboard stats</td></tr>
<tr><td>GET</td><td><code>/login/kick</code>, <code>/auth/kick</code>, <code>/auth/kick/callback</code></td><td>Kick OAuth (PKCE) login flow</td></tr>
<tr><td>GET</td><td><code>/healthz</code></td><td>🔒 Admin: health check (used by Docker healthcheck)</td></tr>
<tr><td>GET</td><td><code>/robots.txt</code>, <code>/sitemap.xml</code>, <code>/.well-known/security.txt</code></td><td>Standard site metadata</td></tr>
<tr><td>GET</td><td><code>/Policy.html</code>, <code>/tos.html</code>, <code>/donos.html</code>, <code>/Acknowledgements.html</code></td><td>Static legal/info pages</td></tr>
</tbody>
</table>

<p>🔒 = requires <code>ADMIN_TOKEN</code>.</p>

<h2 id="-project-structure">📁 Project Structure</h2>

```
danetworkcode-main/
├── server.js                 # Main Express app: routes, scrapers, security, scheduling
├── rumble.js                 # Standalone Rumble scraper (Playwright), shares the SQLite DB
├── db.js                     # better-sqlite3 wrapper with a pg-compatible query interface
├── extract-removed-channel-ids.js
├── check-security-headers.sh # Verifies security headers against a live deployment
├── Dockerfile                # Multi-stage build (deps → runtime w/ system Chromium)
├── docker-compose.yml
├── public/
│   ├── css/style.css
│   ├── js/script.js           # Dashboard frontend logic
│   └── images/                # Platform icons, favicons, banner, OG image
├── views/
│   ├── index.html             # Dashboard shell
│   ├── donos.html, tos.html, Policy.html
│   ├── errors/                # Static error pages (500/502/503/504)
│   ├── sitemap.xml, site.webmanifest
└── data/ , logs/               # Bind-mounted at runtime — SQLite DB and log files
```

<h2 id="-security">🔒 Security</h2>

<ul>
  <li>Helmet-managed security headers, verifiable post-deploy with <code>./check-security-headers.sh https://your-domain</code>.</li>
  <li>Per-route rate limiting (general traffic, auth attempts, admin routes, click tracking, streamer requests).</li>
  <li>Sliding-window threat detection auto-blocks IPs that flood the server or trip scanner heuristics.</li>
  <li>Failed admin-token attempts are logged to <code>logs/auth.log</code> for external tools like fail2ban.</li>
  <li>Docker runs the app as a non-root user, with capabilities dropped to the minimum needed for the sandboxed Chromium instance.</li>
  <li>Never commit a populated <code>.env</code> — <code>ADMIN_TOKEN</code>, OAuth client secrets, and <code>SESSION_SECRET</code> all belong in your deployment's secret store, not in version control.</li>
</ul>

<hr>

<p align="center"><sub>Built with Node.js, Express, Puppeteer, and Playwright.</sub></p>
