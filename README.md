<div align="center">
  <h1>🛡️ Scored.co Video Backup Bot</h1>
  <p>
    <strong>Automated video mirroring, watermarking, and archiving for communities on Scored.co.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
    <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
    <img src="https://img.shields.io/badge/Version-1.0.6-blue?style=for-the-badge" alt="Version 1.0.6" />
    <img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=for-the-badge" alt="GPLv3 License" />
  </p>
</div>

<hr />

<h2>📖 Overview</h2>
<p>
  This bot monitors specified communities on <strong><a href="https://scored.co/">Scored.co</a></strong> (specifically <code>c/spictank</code> and <code>c/theNETWORK</code>) for new video posts. When a video is detected, the bot validates the source, downloads it (up to 2GB), applies a custom watermark via FFmpeg, and generates high-speed backup mirrors to ensure content persistence.
</p>

<h2>🚀 Core Features</h2>
<ul>
  <li><strong>Automated Watermarking:</strong> Utilizes FFmpeg to automatically overlay an <code>IPLOGO.jpeg</code> watermark to the top-left corner of all processed videos.</li>
  <li><strong>Multi-Mirror Redundancy:</strong> Native API integration for Catbox, Qu.ax, Pixeldrain, Buzzheavier, and Fileditch.</li>
  <li><strong>Security First:</strong> Strict SSRF protection with hostname allow-listing and mandatory HTTPS enforcement.</li>
  <li><strong>Fail-Safe State:</strong> Uses atomic file writing to prevent data corruption in <code>processed.json</code> and <code>backups.json</code> during unexpected shutdowns.</li>
  <li><strong>Resource Efficient:</strong> Stream-based processing handles large files and automatically cleans up leftover temporary <code>.mp4</code> files on startup.</li>
</ul>

<h2>🛠️ Installation & PM2 Setup</h2>
<p>The bot is designed to run in a production environment using <strong>PM2</strong> for process persistence and monitoring.</p>

<pre><code># 1. Install FFmpeg (Ubuntu/Debian)
sudo apt update && sudo apt install ffmpeg

# 2. Clone the repository
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot

# 3. Install dependencies
npm install

# 4. Global PM2 installation (if not already present)
sudo npm install pm2 -g</code></pre>

<h3>Configuration</h3>
<p>Create a <code>.env</code> file in the root directory and populate it with your credentials:</p>
<pre><code>USER_AGENT=Mozilla/5.0...
SCORED_API_KEY=your_key
SCORED_API_SECRET=your_secret
SCORED_XSRF_TOKEN=your_token

# Mirror Credentials
PIXELDRAIN_API_KEY=your_key
BUZZHEAVIER_API_KEY=your_key
BUZZHEAVIER_PARENT_ID=your_id
CATBOX_USERHASH=your_hash
QUAX_API=https://qu.ax/upload.php
FILEDITCH_API=https://new.fileditch.com/upload.php</code></pre>

<h3>Running in Production</h3>
<p>The bot uses <code>ecosystem.config.cjs</code> to manage the <code>spictank-backup-bot</code> process. To start the bot with the production configuration[cite: 2]:</p>

<pre><code>npm run prod</code></pre>

<p><strong>PM2 Configuration Details:</strong></p>
<ul>
  <li><strong>Auto-Restart:</strong> The bot is configured to restart automatically if it crashes.</li>
  <li><strong>Memory Management:</strong> PM2 will force a restart if the bot's memory usage exceeds <strong>1GB</strong>.</li>
  <li><strong>Log Management:</strong> Errors are captured in <code>./logs/error.log</code> and standard output in <code>./logs/out.log</code>. Timestamps are automatically appended to log entries.</li>
</ul>

<h2>📦 Supported Sources</h2>
<p>The bot currently validates and downloads content from the following trusted hosts:</p>
<ul>
  <li>Fileditch (<code>fileditch.com</code>, <code>new.fileditch.com</code>)</li>
  <li>Qu.ax</li>
  <li>Pixeldrain.com</li>
  <li>Catbox (<code>catbox.moe</code>, <code>files.catbox.moe</code>)</li>
  <li>Videy (<code>videy.co</code>, <code>cdn.videy.co</code>)</li>
  <li>Buzzheavier (<code>buzzheavier.com</code>, <code>w.buzzheavier.com</code>)</li>
</ul>

<h2>📜 Recent Updates (April 2026)</h2>
<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Enhancement</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Media Processing</strong></td>
      <td>Integrated <code>ffmpeg</code> to apply an ultrafast watermark (<code>IPLOGO.jpeg</code>) before mirroring.</td>
    </tr>
    <tr>
      <td><strong>Mirror Management</strong></td>
      <td>Implemented temporary pause states for Catbox and Qu.ax to handle maintenance windows.</td>
    </tr>
    <tr>
      <td><strong>Process Stability</strong></td>
      <td>Deployed <code>ecosystem.config.cjs</code> for 1GB memory capping and automated log merging.</td>
    </tr>
    <tr>
      <td><strong>State Safety</strong></td>
      <td>Atomic JSON writing ensures <code>backups.json</code> remains intact during high-frequency updates.</td>
    </tr>
  </tbody>
</table>

<h2>⚖️ License</h2>
<p>Licensed under the <strong>GNU General Public License v3.0</strong>.</p>

<h2>⚠️ Disclaimer</h2>
<p>Users are responsible for ensuring compliance with the Terms of Service of Scored.co and the respective mirror providers.</p>
