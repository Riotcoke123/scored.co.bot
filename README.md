<div align="center">
  <h1>🛡️ Scored.co Video Backup Bot</h1>
  <p>
    <strong>Automated video mirroring, watermarking, and archiving for communities on Scored.co.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
    <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
    <img src="https://img.shields.io/badge/Version-1.0.5-blue?style=for-the-badge" alt="Version 1.0.5" />
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
  <li><strong>Multi-Mirror Redundancy:</strong> Native API integration for Catbox, Qu.ax, Pixeldrain, Buzzheavier, and Fileditch. <em>(Note: Built-in pause capabilities handle temporary mirror downtimes)</em>.</li>
  <li><strong>Security First:</strong> Strict SSRF protection with hostname allow-listing (e.g., <code>fileditch.com</code>, <code>catbox.moe</code>, <code>videy.co</code>) and mandatory HTTPS enforcement.</li>
  <li><strong>Fail-Safe State:</strong> Uses atomic file writing (<code>saveJSONAtomic</code>) to prevent data corruption in <code>processed.json</code> and <code>backups.json</code> during unexpected shutdowns.</li>
  <li><strong>Auto-Engagement:</strong> Automatically upvotes processed posts and leaves a formatted comment with all available, successfully uploaded mirror links.</li>
  <li><strong>Resource Efficient:</strong> Stream-based processing handles large files (up to 2GB) and automatically cleans up leftover temporary <code>.mp4</code> files on startup and after processing.</li>
</ul>

<h2>🛠️ System Requirements & Installation</h2>
<p>Because the bot now processes video streams directly, <strong>FFmpeg</strong> is required on the host system.</p>

<pre><code># 1. Install FFmpeg (Ubuntu/Debian example)
sudo apt update && sudo apt install ffmpeg

# 2. Clone the repository
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot

# 3. Install dependencies
npm install</code></pre>

<h3>Configuration</h3>
<p>Create a <code>.env</code> file in the root directory and populate it with your Scored and Mirror API credentials:</p>
<pre><code>USER_AGENT=YourUserAgent
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
<p><em>Make sure you place your <code>IPLOGO.jpeg</code> file in the root directory next to <code>bot.js</code> before starting!</em></p>

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
      <td>Integrated <code>ffmpeg</code> via <code>child_process</code> to apply an ultrafast, non-destructive watermark (<code>IPLOGO.jpeg</code>) to all downloads before uploading.</td>
    </tr>
    <tr>
      <td><strong>Mirror Management</strong></td>
      <td>Implemented temporary automated pause states to respect mirror downtimes (Catbox paused until April 24, Qu.ax paused until April 26). Removed deprecated Filebin integration.</td>
    </tr>
    <tr>
      <td><strong>Cleanup & Safety</strong></td>
      <td>Added logic on startup to purge orphaned <code>temp_*.mp4</code> files from previous interrupted runs.</td>
    </tr>
    <tr>
      <td><strong>Package Config</strong></td>
      <td>Updated <code>package.json</code> to reflect <code>v1.0.5</code> and specified ES Module (<code>"type": "module"</code>) compatibility.</td>
    </tr>
  </tbody>
</table>

<h2>⚖️ License</h2>
<p>
  Licensed under the <strong>GNU General Public License v3.0</strong>.
</p>

<h2>⚠️ Disclaimer</h2>
<p>
  This bot is intended for archival purposes. Users are responsible for ensuring compliance with the Terms of Service of Scored.co and the respective mirror providers.
</p>
