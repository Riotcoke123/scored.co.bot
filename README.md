<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status Active" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 18+" />
  <img src="https://img.shields.io/badge/FFmpeg-Processing-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg Processing" />
  <img src="https://img.shields.io/badge/SQLite-WAL__Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite WAL Mode" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License MIT" />
  
  <h1 align="center">🪞 Scored Mirror & Live Stream Clipper Suite</h1>
  <p align="center">
    <strong>An enterprise-grade automated pipeline for content redistribution, multi-platform stream clipping, dynamic watermarking, and community management.</strong>
  </p>
</div>

<hr />

<h2>🚀 Core Modules & Capabilities</h2>

<h3>🤖 1. Automated Scored Bot & Mirroring</h3>
<ul>
  <li><strong>Automated Polling:</strong> Regularly checks community feeds (e.g., <code>c/spictank</code> and <code>c/thenetwork</code>) every 90 seconds for fresh video content submissions.</li>
  <li><strong>Rapid Watermarking:</strong> Leverages an optimized FFmpeg pipeline using the <code>ultrafast</code> preset to seamlessly overlay branding graphics (<code>IPLOGO.jpeg</code>) with minimal CPU overhead.</li>
  <li><strong>Multi-Mirror Redundancy:</strong> Concurrently dispatches assets to decentralized public hosts including <strong>Qu.ax</strong>, <strong>Catbox</strong>, <strong>BuzzHeavier</strong>, and <strong>FileDitch</strong>.</li>
  <li><strong>Admin Management Panel:</strong> A secure web dashboard built to toggle individual mirrors, toggle live watermarking settings, and moderate community text responses on the fly.</li>
</ul>

<h3>🎬 2. Standalone Live Stream Clipper Platform</h3>
<ul>
  <li><strong>On-Demand Clipping:</strong> Allows users to extract custom video segments (up to 300 seconds) from live broadcasts on <strong>YouTube</strong>, <strong>Twitch</strong>, and <strong>Kick</strong>.</li>
  <li><strong>Smart URL Resolution:</strong> Uses automated fallbacks (<code>yt-dlp</code>, Android InnerTube API bypasses, and native platform endpoints) to retrieve direct HLS stream manifests, completely dodging common channel scraping errors.</li>
  <li><strong>DVR Frame-Alignment:</strong> Tracks exact click timestamps and relies on input seeking (<code>-live_start_index 0 -ss</code>) to align the clip to the absolute moment the user hit capture.</li>
  <li><strong>Modern Web Interface:</strong> Includes high-performance visual state management, embedded live previews, responsive mobile inputs, and a custom ad-containment shield to neutralize aggressive mobile layout hijacking.</li>
</ul>

<hr />

<h2>🛠️ Technical Architecture</h2>

<table width="100%">
  <thead>
    <tr>
      <th align="left">Component</th>
      <th align="left">Technology</th>
      <th align="left">Role / Execution Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Runtime Environment</strong></td>
      <td>Node.js (ESM / CJS)</td>
      <td>High-concurrency script execution.</td>
    </tr>
    <tr>
      <td><strong>Web Infrastructure</strong></td>
      <td>Express.js</td>
      <td>Powers the Admin Dashboard, Public Static Router, and Clipper management API.</td>
    </tr>
    <tr>
      <td><strong>Media Processing</strong></td>
      <td>FFmpeg &amp; <code>yt-dlp</code></td>
      <td>Handles demuxing, video stream scaling, audio bit-copying, and live HLS recording.</td>
    </tr>
    <tr>
      <td><strong>Persistence (Bot)</strong></td>
      <td>Atomic JSON</td>
      <td>Low-overhead state tracking with <code>.tmp</code> swap safety to prevent file corruption.</td>
    </tr>
    <tr>
      <td><strong>Persistence (Clipper)</strong></td>
      <td>SQLite (<code>better-sqlite3</code>)</td>
      <td>High-performance job store executing with Write-Ahead Logging (<code>WAL</code>) mode enabled.</td>
    </tr>
    <tr>
      <td><strong>Network Core</strong></td>
      <td>Axios &amp; Node-Fetch</td>
      <td>Manages Scored JSON feed polling, multi-part form payloads, and API syncs.</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>⚙️ Setup &amp; Configuration</h2>

<h3>1. Environment Variables</h3>
<p>Create a unified <code>.env</code> file in your root working directory. Customize the values below based on your system needs:</p>

<pre><code># ==========================================
# 🛡️ ADMIN PANEL &amp; CONTROL CENTER
# ==========================================
ADMIN_PORT=3000
ADMIN_USER=admin
ADMIN_PASS=secure_password
SESSION_SECRET=change-me-to-a-long-random-string

# ==========================================
# 🤖 SCORED API CREDENTIALS
# ==========================================
SCORED_API_KEY=your_scored_api_key
SCORED_API_SECRET=your_scored_api_secret
SCORED_XSRF_TOKEN=your_scored_xsrf_token
USER_AGENT=ScoredRedistributionBot/1.0

# ==========================================
# 🎬 STREAM CLIPPER CONFIGURATION
# ==========================================
PORT=4242
CLIPPER_API_KEY=generate_minimum_32_character_hex_string
YOUTUBE_API_KEY=your_google_youtube_data_api_v3_key
MAX_CLIP_SECONDS=300
DEFAULT_CLIP_SECS=60
MAX_CONCURRENT_JOBS=5

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQ=10

# Storage Locations
DB_PATH=./clipper.db
CLIP_OUTPUT_DIR=./public/clips
CLIP_TEMP_DIR=./temp

# Platform Integration Bridges
KICK_API_BASE=https://api.kick.com
KICK_AUTH_BASE=https://id.kick.com
KICK_CLIENT_ID=your_kick_client_id
KICK_CLIENT_SECRET=your_kick_client_secret

# ==========================================
# 📦 DISTRIBUTED STORAGE MULTI-MIRROR AUTH
# ==========================================
CATBOX_USERHASH=your_catbox_userhash
BUZZHEAVIER_API_KEY=your_buzzheavier_api_key
BUZZHEAVIER_PARENT_ID=your_buzzheavier_folder_id
QUAX_API=https://qu.ax/upload.php</code></pre>

<h3>2. Installation &amp; Launch</h3>
<p>Ensure your host environment has a globally available binary of <strong>FFmpeg</strong> and <strong>yt-dlp</strong> installed before bootstrapping the system.</p>

<pre><code class="language-bash"># 1. Clone the repository and navigate to the project directory
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot

# 2. Install production and development dependencies
npm install

# 3. Spin up the automated polling script
node bot.js

# 4. Initialize the management admin panel dashboard
node admin.js

# 5. Execute the standalone Live Stream Clipper instance
node clipper.js</code></pre>

<hr />

<h2>🔄 Lifecycle Architectures</h2>

<h3>A. Polling Bot Pipeline</h3>
<ol>
  <li><strong>Discovery:</strong> The bot pulls real-time JSON endpoint feeds from specified sub-communities on Scored.co.</li>
  <li><strong>Validation:</strong> Checks unique media IDs against state logs and rules out files exceeding 2048 MB.</li>
  <li><strong>Processing:</strong> Hands off streams to the FFmpeg engine, formats sizing, applies logo overlays, and replicates native audio track structures.</li>
  <li><strong>Distribution:</strong> Broadcasts the post payload concurrently across all network mirrors flagged active in the Admin Dashboard.</li>
  <li><strong>Notification:</strong> Fires a structured, markdown-formatted delivery template with redundant mirror access links right back into the source thread.</li>
</ol>

<h3>B. Live Stream Clipping Pipeline</h3>
<pre><code>[User Request] ➔ [Security/SSRF Guard Check] ➔ [yt-dlp HLS Manifest Resolver]
                                                               │
[Public Delivery Link] 🔀 [Distributed Storage Uploads] ◀ [FFmpeg DVR Seek &amp; Capture]</code></pre>

<hr />

<h2>🎥 Media Processing Safeguards</h2>
<ul>
  <li><strong>Stale Process Timeouts:</strong> Media execution boundaries are strictly capped at 600,000ms to guarantee zombie processes don't leak CPU threads.</li>
  <li><strong>Atomic Workspace Cleanups:</strong> Intermediate fragments and local temporary files are forcefully unlinked within execution blocks to maintain low disk overhead.</li>
  <li><strong>Cached Mirror States:</strong> Persistent states use an internal time-to-live cache strategy to mitigate disk thrashing during rapid poll sequences.</li>
  <li><strong>SSRF Domain White-Listing:</strong> User inputs are thoroughly sanitized and limited strictly to allowed streaming infrastructure domains (<code>youtube.com</code>, <code>twitch.tv</code>, <code>kick.com</code>).</li>
</ul>

<hr />

<h2>📄 License</h2>
<p>Distributed under the MIT License. See <code>LICENSE</code> for more details.</p>
