
Here is the HTML code for your README.md. You can copy and paste this directly into your GitHub repository's README file; GitHub Markdown natively supports and renders HTML tags, giving you a highly customized and structured page.

HTML
<div align="center">
  <h1>🤖 Scored.co Video Backup Bot (beta 2.0)</h1>
  <p>
    <a href="https://github.com/Riotcoke123/scored.co.bot">View Repository</a>
  </p>
  <p>An automated Node.js bot for mirroring video content from Scored.co communities to resilient file hosts.</p>
</div>

<hr>

<h2>✨ Features</h2>
<ul>
  <li><strong>Multi-Mirror Redundancy:</strong> Automatically uploads captured videos to Qu.ax, Catbox, FileDitch, and Videy.</li>
  <li><strong>Live Admin Dashboard:</strong> Built-in web panel to toggle mirrors, video watermarking, and community comments on the fly without restarting the bot.</li>
  <li><strong>Automated Commenting:</strong> Replies to the original Scored.co post with the generated backup links.</li>
  <li><strong>Video Watermarking:</strong> Optional on-the-fly video watermarking using FFmpeg.</li>
  <li><strong>Production Ready:</strong> Fully configured for PM2 process management [cite: 2], ensuring the bot auto-restarts and logs properly in a production environment[cite: 3].</li>
</ul>

<h2>⚙️ Prerequisites</h2>
<ul>
  <li><a href="https://nodejs.org/">Node.js</a> (v16+ recommended)</li>
  <li><a href="https://ffmpeg.org/">FFmpeg</a> (Must be installed and accessible in your system PATH for watermarking)</li>
</ul>

<h2>🚀 Installation</h2>
<pre><code>git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot
npm install</code></pre>

<h2>🔧 Configuration</h2>
<p>Create a <code>.env</code> file in the root directory and configure the following variables (use the provided <code>.env</code> file as a template):</p>
<pre><code># Scored API & Authentication
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36" [cite: 1]
SCORED_API_KEY=your_scored_key
SCORED_API_SECRET=your_scored_secret
SCORED_XSRF_TOKEN=your_xsrf_token

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

<h2>💻 Usage</h2>
<p><strong>Development / Standard Run:</strong></p>
<pre><code>npm start</code></pre>

<p><strong>Production (PM2):</strong></p>
<pre><code>npm run prod</code></pre>
<p>Once running, access the Admin Dashboard at <code>http://localhost:3001</code> (or your configured <code>ADMIN_PORT</code>) to manage the bot's state.</p>

<h2>📁 Core Architecture</h2>
<ul>
  <li><code>bot.js</code> - The main polling engine. Scrapes <code>c/theNETWORK</code> and <code>c/spictank</code>, downloads media, processes it, and interfaces with mirror APIs.</li>
  <li><code>admin.js</code> - An Express server hosting the secure, session-based admin dashboard.</li>
  <li><code>ecosystem.config.cjs</code> - PM2 configuration for reliable deployment[cite: 2].</li>
  <li><code>thenetwork.png</code> - <i>(Required)</i> The watermark image applied to videos via FFmpeg.</li>
</ul>

<hr>

<div align="center">
  <p><i>Developed for Scored.co automated content preservation.</i></p>
</div>
