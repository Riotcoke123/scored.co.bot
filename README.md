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
  This bot monitors specified communities on <strong><a href="https://scored.co/">Scored.co</a></strong> (specifically <code>c/spictank</code> and <code>c/theNETWORK</code>) for new video posts. When a video is detected, the bot validates the source, downloads it (up to 2GB), and generates high-speed backup mirrors to ensure content persistence.
</p>

<h2>🚀 Core Features</h2>
<ul>
  <li><strong>Multi-Mirror Redundancy:</strong> Native API integration for Catbox, Qu.ax, Pixeldrain, Buzzheavier, and Fileditch.</li>
  <li><strong>Security First:</strong> Strict SSRF protection with hostname allow-listing and mandatory HTTPS enforcement.</li>
  <li><strong>Fail-Safe State:</strong> Uses atomic file writing to prevent data corruption during unexpected shutdowns.</li>
  <li><strong>Auto-Engagement:</strong> Automatically upvotes processed posts and leaves a formatted comment with all available mirrors.</li>
  <li><strong>Resource Efficient:</strong> Stream-based processing handles large files (up to 2GB) without exhausting system memory.</li>
</ul>

<h2>🛠️ Installation & Setup</h2>
<pre><code># Clone the repository
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot

# Install dependencies
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

<h2>📦 Supported Sources</h2>
<p>The bot currently validates and downloads content from the following trusted hosts:</p>
<ul>
  <li>Fileditch (new.fileditch.com)</li>
  <li>Qu.ax</li>
  <li>Pixeldrain.com</li>
  <li>Catbox.moe</li>
  <li>Videy.co</li>
  <li>0.vern.cc</li>
  <li>Pomf2.lain.la</li>
  <li>Buzzheavier.com</li>
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
      <td><strong>Security</strong></td>
      <td>Implemented <code>validateDownloadUrl</code> to prevent SSRF. Added log scrubbing to remove sensitive headers from error reports.</td>
    </tr>
    <tr>
      <td><strong>Data Integrity</strong></td>
      <td>Introduced <code>saveJSONAtomic</code>—state files are now written to temporary files before being renamed to prevent partial writes.</td>
    </tr>
    <tr>
      <td><strong>Performance</strong></td>
      <td>Transitioned to stream-based uploads for Filebin and Buzzheavier to support files up to 2GB without OOM errors.</td>
    </tr>
    <tr>
      <td><strong>Stability</strong></td>
      <td>Added strict MIME-type validation and a hard 2GB mid-stream termination limit for downloads.</td>
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
