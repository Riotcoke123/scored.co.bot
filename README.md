<div align="center">
  <h1>🤖 Scored.co Video Backup Bot (beta 2.0)</h1>

  <p>
    <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version">
    <img src="https://img.shields.io/badge/node-%3E%3D%2016-brightgreen.svg?logo=node.js" alt="Node version">
    <img src="https://img.shields.io/badge/managed_by-PM2-2B037A.svg?logo=pm2" alt="PM2">
    <img src="https://img.shields.io/badge/video-FFmpeg-007808.svg?logo=ffmpeg" alt="FFmpeg">
    <img src="https://img.shields.io/badge/docker-%230db7ed.svg?logo=docker&logoColor=white" alt="Docker">
  </p>

  <p>An automated Node.js bot for mirroring video content from Scored.co communities to resilient file hosts.</p>
  
  <p>📚 <strong><a href="https://docs.scored.co/">Official Scored.co API Documentation</a></strong></p>
</div>

<hr>

<h2>✨ Features</h2>
<ul>
  <li><strong>Multi-Mirror Redundancy:</strong> Automatically uploads captured videos to Qu.ax, Catbox, FileDitch, and Videy.</li>
  <li><strong>Live Admin Dashboard:</strong> Built-in web panel to toggle mirrors, video watermarking, and community comments on the fly without restarting the bot.</li>
  <li><strong>Automated Commenting:</strong> Replies to the original Scored.co post with the generated backup links.</li>
  <li><strong>Video Watermarking:</strong> Optional on-the-fly video watermarking using FFmpeg.</li>
  <li><strong>Docker & Production Ready:</strong> Includes a <code>docker-compose.yml</code> for isolated deployments, alongside standard PM2 process management support.</li>
</ul>

<h2>⚙️ Prerequisites</h2>
<ul>
  <li><strong>Option A (Bare Metal):</strong> <a href="https://nodejs.org/">Node.js</a> (v16+) and <a href="https://ffmpeg.org/">FFmpeg</a> installed in your system PATH.</li>
  <li><strong>Option B (Docker - Recommended):</strong> <a href="https://www.docker.com/">Docker</a> and Docker Compose.</li>
</ul>

<h2>🚀 Installation</h2>
<pre><code>git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot</code></pre>

<h2>🔧 Configuration</h2>
<p>Create a <code>.env</code> file in the root directory and configure the following variables. Reference the <a href="https://docs.scored.co/">Scored API docs</a> for help generating keys:</p>
<pre><code># Scored API & Authentication
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0.0.0 Safari/537.36"
SCORED_API_KEY=your_scored_key
SCORED_API_SECRET=your_scored_secret

# Upload Mirrors APIs
QUAX_API=https://qu.ax/upload.php
CATBOX_API=https://catbox.moe/user/api.php
CATBOX_USERHASH=your_catbox_hash
FILEDITCH_API=https://new.fileditch.com/upload.php
VIDEY_API_KEY=your_videy_key
VIDEY_API_SECRET=your_videy_secret

# Admin Panel Configuration
ADMIN_PORT=3001
ADMIN_USER=admincoke
ADMIN_PASS=your_secure_password
SESSION_SECRET=your_random_session_secret
</code></pre>
<p><em>Note: Make sure to drop your custom <code>thenetwork.png</code> file into the root directory for the watermark feature!</em></p>

<h2>💻 Usage</h2>

<h3>🐳 Using Docker (Recommended)</h3>
<p>Docker handles the FFmpeg and Node dependencies automatically. Run:</p>
<pre><code>docker compose up -d --build</code></pre>

<h3>🖥️ Using PM2 (Production Bare-Metal)</h3>
<pre><code>npm install
npm run prod</code></pre>

<h3>🛠️ Development / Standard Run</h3>
<pre><code>npm install
npm start</code></pre>

<p>Once running, access the Admin Dashboard at <code>http://localhost:3001</code> to manage the bot's state.</p>

<h2>📁 Core Architecture</h2>
<ul>
  <li><code>bot.js</code> - The main polling engine. Scrapes <code>c/theNETWORK</code> and <code>c/spictank</code>, downloads media, applies watermarks, and uploads to mirrors.</li>
  <li><code>admin.js</code> - An Express server hosting the secure, session-based admin dashboard.</li>
  <li><code>docker-compose.yml</code> - Container orchestration, volume mapping for persisting state across reboots.</li>
  <li><code>ecosystem.config.cjs</code> - PM2 configuration for reliable bare-metal deployment.</li>
  <li><code>thenetwork.png</code> - <i>(Required)</i> The watermark image applied to videos via FFmpeg.</li>
  <li><strong>State Files:</strong> The bot maintains state using <code>mirror-state.json</code> (dashboard settings), <code>processed.json</code> (avoid duplicate posts), and <code>backups.json</code> (backup log).</li>
</ul>

<hr>

<div align="center">
  <p><i>Developed for Scored.co automated content preservation.</i></p>
</div>
