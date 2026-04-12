<div align="center">
  <h1>🛡️ Scored.co Video Backup Bot</h1>
  <p>
    <strong>Automated video mirroring and archiving for communities on Scored.co.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
    <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
    <img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=for-the-badge" alt="GPLv3 License" />
    <img src="https://img.shields.io/badge/Security-Locked-red?style=for-the-badge" alt="Security Focused" />
  </p>
</div>

<hr />

<h2>📖 Overview</h2>
<p>
  This bot monitors specified communities on <strong><a href="https://scored.co/">Scored.co</a></strong> for new video posts. When a video is detected from a supported host, the bot downloads it, generates multiple backup mirrors, upvotes the post, and leaves a comment with the mirror links.
</p>

<h2>🔗 Quick Links</h2>
<ul>
  <li><strong>Platform:</strong> <a href="https://scored.co/">Scored.co</a></li>
  <li><strong>API Documentation:</strong> <a href="https://docs.scored.co/">Official Scored API Docs</a></li>
</ul>

<h2>🚀 Features</h2>
<ul>
  <li><strong>Multi-Mirror Support:</strong> Automatically uploads to Catbox, Qu.ax, GoFile, Filebin, Pixeldrain, and Buzzheavier.</li>
  <li><strong>Automated Engagement:</strong> Upvotes processed posts and comments with backup links.</li>
  <li><strong>Persistence:</strong> Uses atomic JSON writes to track processed posts and maintain a backup log.</li>
</ul>

<h2>🛠️ Installation</h2>
<pre><code># Clone and install
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot
npm install</code></pre>

<h2>📜 Update Log (4/12/26)</h2>
<p>Major stability and security overhaul completed. The following improvements have been implemented:</p>

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Enhancement</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Security</strong></td>
      <td>Implemented SSRF protection with a strict hostname allow-list and mandatory HTTPS enforcement. Log scrubbing now strips sensitive credential headers from error reports.</td>
    </tr>
    <tr>
      <td><strong>Stability</strong></td>
      <td>Added a 2GB hard limit on downloads with mid-stream termination. Integrated atomic file writing to prevent <code>backups.json</code> and <code>processed.json</code> corruption.</td>
    </tr>
    <tr>
      <td><strong>Optimization</strong></td>
      <td>Switched to stream-based uploads for large files (Filebin/Buzzheavier) to prevent Out-of-Memory (OOM) crashes. Added MIME-type validation to reject non-video files.</td>
    </tr>
    <tr>
      <td><strong>Maintenance</strong></td>
      <td>Implemented a 10,000-entry cap on history logs to manage disk space. Added strict state validation—the bot will now halt if core database files are corrupted.</td>
    </tr>
    <tr>
      <td><strong>Mirrors</strong></td>
      <td>New native support for <strong>Pixeldrain</strong> and <strong>Buzzheavier</strong> API integrations.</td>
    </tr>
  </tbody>
</table>

<h2>⚖️ License</h2>
<p>
  <strong>scored.co.bot</strong> is licensed under the <strong>GNU General Public License v3.0</strong>.
</p>

<h2>⚠️ Disclaimer</h2>
<p>
  This bot is for archival purposes. Please ensure your use of this tool complies with the Terms of Service of Scored.co and the respective mirror providers.
</p>
