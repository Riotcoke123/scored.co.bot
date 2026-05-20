<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status Active" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 18+" />
  <img src="https://img.shields.io/badge/FFmpeg-Processing-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg Processing" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License MIT" />
  
  <h1 align="center">Scored Mirror & Live Stream Clipper Suite</h1>
  <p align="center">
    <strong>An automated pipeline for content redistribution, multi-platform stream clipping, dynamic watermarking, and community management.</strong>
  </p>
</div>

<hr />

<h2>🚀 Core Modules & Capabilities</h2>

<h3>🤖 1. Automated Scored Bot & Mirroring</h3>
<ul>
  <li><strong>Automated Polling:</strong> Regularly checks community feeds (e.g. <code>c/theNETWORK</code>) every 90 seconds for fresh video content submissions while ignoring external social platform domains.</li>
  <li><strong>Rapid Watermarking:</strong> Leverages an optimized FFmpeg pipeline using the <code>ultrafast</code> preset and dual-thread throttling to seamlessly overlay branding graphics (<code>thenetwork.png</code>) with minimal CPU overhead.</li>
  <li><strong>Multi-Mirror Redundancy:</strong> Concurrently dispatches assets to decentralized public hosts including <strong>Qu.ax</strong>, <strong>Catbox</strong>, <strong>FileDitch</strong>, and <strong>Videy</strong>.</li>
  <li><strong>Admin Management Panel:</strong> A secure web dashboard built to toggle individual mirrors, manage watermark settings, toggle community comment distribution, and monitor active mirror states on the fly.</li>
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
      <td>Node.js (ESM Framework)</td>
      <td>High-concurrency script execution using modern EcmaScript Modules.</td>
    </tr>
    <tr>
      <td><strong>Web Infrastructure</strong></td>
      <td>Express.js &amp; Express-Session</td>
      <td>Powers the authenticated Admin Dashboard, state toggles, and Clipper management API.</td>
    </tr>
    <tr>
      <td><strong>Media Processing</strong></td>
      <td>FFmpeg &amp; <code>yt-dlp</code></td>
      <td>Handles downscaling, watermarking overlays, audio bit-stream copying, and live HLS recording.</td>
    </tr>
    <tr>
      <td><strong>Persistence (Bot)</strong></td>
      <td>Atomic JSON Stores</td>
      <td>Low-overhead local tracking (<code>processed.json</code>, <code>backups.json</code>, <code>mirror-state.json</code>) utilizing <code>.tmp</code> file swap streams to eliminate runtime corruption.</td>
    </tr>
    <tr>
      <td><strong>Persistence (Clipper)</strong></td>
      <td>SQLite (<code>better-sqlite3</code>)</td>
      <td>High-performance job store executing with Write-Ahead Logging (<code>WAL</code>) mode enabled.</td>
    </tr>
    <tr>
      <td><strong>Network Core</strong></td>
      <td>Axios &amp; Form-Data</td>
      <td>Manages multi-part mirror uploads, stream resource downloads, and Scored API interactions.</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>⚙️ Setup &amp; Configuration</h2>

<h3>1. Environment Variables</h3>
<p>Create a unified <code>.env</code> file in your root working directory. Customize the values below based on your system needs:</p>

<pre><code># ==========================================
# 🛡️ ADMIN PANEL & CONTROL CENTER
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
CATBOX_API=https://catbox.moe/user/api.php
QUAX_API=https://qu.ax/upload.php
VIDEY_API_KEY=your_videy_key
VIDEY_API_SECRET=your_videy_secret</code></pre>

<h3>2. Installation &amp; Launch</h3>
<p>Ensure your host environment has a globally available binary of <strong>FFmpeg</strong> installed before bootstrapping the pipeline.</p>

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
  <li><strong>Validation:</strong> Filters against explicit streaming link structures, checks unique media IDs via memory maps, and throws out assets scaling past 2GB.</li>
  <li><strong>Processing:</strong> Streams chunks to local disk, checks current feature flags, applies video watermarking layers via custom structural overlays, and strips local items out of cache upon completion.</li>
  <li><strong>Distribution:</strong> Broadcasts the payload concurrently across all network mirror targets currently marked active in the Admin state engine.</li>
  <li><strong>Notification:</strong> Inserts a markdown-formatted message containing active mirror links back into the source thread under your targeting specifications.</li>
</ol>

<h3>B. Live Stream Clipping Pipeline</h3>
<pre><code>[User Request] ➔ [Security/SSRF Guard Check] ➔ [yt-dlp HLS Manifest Resolver]
                                                                │
[Public Delivery Link] 🔀 [Distributed Storage Uploads] ◀ [FFmpeg DVR Seek & Capture]</code></pre>

<hr />

<h2>🎥 Media Processing Safeguards</h2>
<ul>
  <li><strong>Stale Process Timeouts:</strong> Media execution operations and network streaming boundaries are strictly capped at 600,000ms to guarantee zombie processes don't bleed processing loops.</li>
  <li><strong>Atomic Workspace Cleanups:</strong> Local directory sweeps find and prune leftover <code>temp_*.mp4</code> engine traces during boot cycles and execution faults automatically.</li>
  <li><strong>State Cache Throttling:</strong> Reads to the underlying mirror state utilize a 5,000ms Time-to-Live (TTL) storage cache to remove intense disk-thrashing routines during post processing cycles.</li>
  <li><strong>SSRF Domain Whitelisting:</strong> Host evaluations enforce rigid whitelisting layers on incoming assets, processing links solely from verified distribution roots (e.g., <code>qu.ax</code>, <code>fileditch.com</code>, <code>catbox.moe</code>, <code>videy.co</code>).</li>
</ul>

<hr />

<h2>📄 License</h2>
<p>Distributed under the MIT License. See <code>LICENSE</code> for more details.</p>

<hr />
