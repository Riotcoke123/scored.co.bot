<div align="center">
  <h1>🛡️ Scored.co Video Backup Bot</h1>
  <p>
    <strong>Automated video mirroring and archiving for communities on Scored.co.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
    <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
    <img src="https://img.shields.io/badge/Security-Locked-red?style=for-the-badge" alt="Security Focused" />
  </p>
</div>

<hr />

<h2>📖 Overview</h2>
<p>
  This bot monitors specified communities on <strong><a href="https://scored.co/">Scored.co</a></strong> for new video posts. When a video is detected from a supported host, the bot downloads it, generates multiple backup mirrors, upvotes the post, and leaves a comment with the mirror links to ensure the content remains accessible even if the original source is deleted.
</p>

<h2>🔗 Quick Links</h2>
<ul>
  <li><strong>Platform:</strong> <a href="https://scored.co/">Scored.co</a></li>
  <li><strong>API Documentation:</strong> <a href="https://docs.scored.co/">Official Scored API Docs</a></li>
</ul>

<h2>🚀 Features</h2>
<ul>
  <li><strong>Multi-Mirror Support:</strong> Automatically uploads to Catbox, Qu.ax, GoFile, Filebin, Pixeldrain, and Buzzheavier.</li>
  <li><strong>Automated Engagement:</strong> Upvotes processed posts and comments with a structured list of backup links.</li>
  <li><strong>Robust Safety:</strong> Includes built-in SSRF protection, HTTPS enforcement, and file size limits (2GB).</li>
  <li><strong>Persistence:</strong> Uses atomic JSON writes to track processed posts and maintain a backup log.</li>
  <li><strong>Retry Logic:</strong> Intelligent retry mechanism with exponential backoff for network-heavy tasks.</li>
</ul>

<h2>🛡️ Security & Stability Measures</h2>
<p>The bot includes 10 critical reliability fixes integrated directly into the core:</p>
<ol>
  <li><strong>SSRF Protection:</strong> Strict hostname allow-list for downloads.</li>
  <li><strong>Size Constraints:</strong> Rejects files over 2048 MB mid-stream.</li>
  <li><strong>OOM Prevention:</strong> Uses streams for uploads instead of loading entire files into memory.</li>
  <li><strong>MIME Validation:</strong> Only accepts <code>video/</code> content types.</li>
  <li><strong>URL Sanitization:</strong> Strips control characters from links before posting.</li>
  <li><strong>Atomic Writes:</strong> Prevents data loss during JSON updates.</li>
  <li><strong>HTTPS Enforcement:</strong> Rejects insecure download protocols.</li>
  <li><strong>Log Capping:</strong> Keeps the backup history at a maximum of 10,000 entries.</li>
  <li><strong>Strict Loading:</strong> Halts execution if state files are corrupted.</li>
  <li><strong>Credential Safety:</strong> Strips sensitive headers from error logs.</li>
</ol>

<h2>🛠️ Installation</h2>

<pre><code># Clone the repository
git clone https://github.com/Riotcoke123/scored.co.bot.git

# Enter the directory
cd scored.co.bot

# Install dependencies
npm install</code></pre>

<h2>⚙️ Configuration</h2>
<p>Create a <code>.env</code> file in the root directory and fill in your credentials:</p>

<pre><code># Scored API Auth
SCORED_API_KEY=your_key
SCORED_API_SECRET=your_secret
SCORED_XSRF_TOKEN=your_token
USER_AGENT=your_browser_user_agent

# Mirror API Endpoints/Keys
CATBOX_API=https://catbox.moe/user/api.php
QUAX_API=https://qu.ax/upload.php
GOFILE_API=https://store1.gofile.io/uploadFile
FILEBIN_API=https://filebin.net
PIXELDRAIN_API_KEY=your_pixeldrain_key
BUZZHEAVIER_API_KEY=your_buzz_key
BUZZHEAVIER_PARENT_ID=your_folder_id</code></pre>

<h2>▶️ Usage</h2>
<pre><code>npm start</code></pre>
<p>The bot will poll the communities every 90 seconds (configurable via <code>POLL_INTERVAL_MS</code>).</p>

<h2>⚠️ Disclaimer</h2>
<p>
  This bot is for archival purposes. Please ensure your use of this tool complies with the Terms of Service of Scored.co and the respective mirror providers.
</p>
