<div class="container">
    <header>
        <h1>🛡️ Scored.co Mirror & Backup Bot</h1>
        <p>Automated video mirroring, FFmpeg watermarking, and web-based control for Scored.co communities.</p>
        <div class="badges">
            <span class="badge">Version 1.0.6</span>
            <span class="badge">Node.js</span>
            <span class="badge">Express</span>
            <span class="badge">FFmpeg</span>
        </div>
    </header>
    <section id="overview">
        <h2>📖 Overview</h2>
        <p>
            This bot monitors specified communities on Scored.co (<code>c/spictank</code> and <code>c/theNETWORK</code>) for new video posts. 
            When a video is detected, the bot validates the source, downloads it (up to 2GB), applies a custom watermark, and generates backup mirrors.
        </p>
    </section>
    <section id="features">
        <h2>🚀 Core Features</h2>
        <ul>
            <li><strong>Web Admin Dashboard:</strong> A secure, password-protected UI to toggle specific upload mirrors on or off in real-time.</li>
            <li><strong>Automated Watermarking:</strong> Uses FFmpeg to overlay <code>IPLOGO.jpeg</code> on the top-left corner using the <code>ultrafast</code> preset.</li>
            <li><strong>Multi-Mirror Support:</strong> Integrated APIs for Qu.ax, Catbox, BuzzHeavier, and FileDitch.</li>
            <li><strong>Security:</strong> Hostname allow-listing and mandatory HTTPS enforcement to prevent SSRF.</li>
            <li><strong>State Management:</strong> Atomic JSON writing ensures <code>backups.json</code> and <code>mirror-state.json</code> remain uncorrupted.</li>
        </ul>
    </section>
    <section id="installation">
        <h2>🛠️ Installation</h2>
        <p>The bot requires <strong>Node.js</strong> and <strong>FFmpeg</strong> to be installed on the host system.</p>
        <pre><code># 1. Install FFmpeg (Ubuntu/Debian)
sudo apt update && sudo apt install ffmpeg

# 2. Clone and Install
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot
npm install</code></pre>
    </section>
    <section id="configuration">
        <h2>⚙️ Configuration</h2>
        <p>Create a <code>.env</code> file in the root directory to store credentials:</p>
        <pre><code># Admin Credentials
ADMIN_USER=admin
ADMIN_PASS=d741f32208191aed082a28a8
SESSION_SECRET=your_secret_key

# Mirror API Endpoints
QUAX_API=https://qu.ax/upload.php
CATBOX_API=https://catbox.moe/user/api.php
FILEDITCH_API=https://new.fileditch.com/upload.php</code></pre>
    </section>
    <section id="usage">
        <h2>🚀 Production Usage</h2>
        <p>For production environments, the bot is configured to run via PM2 using a pre-defined ecosystem config:</p>
        <pre><code># Start with PM2
npm run prod</code></pre>
        <ul>
            <li><strong>Memory Limit:</strong> PM2 is configured to restart the process if memory exceeds 1GB.</li>
            <li><strong>Automatic Restarts:</strong> Ensures the bot remains online after crashes or system reboots.</li>
        </ul>
    </section>
    <section id="tech-specs">
        <h2>📜 Technical Specifications</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Specification</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Polling Interval</strong></td>
                    <td>90 seconds </td>
                </tr>
                <tr>
                    <td><strong>Max File Size</strong></td>
                    <td>2048 MB (2 GB) </td>
                </tr>
                <tr>
                    <td><strong>Max Backup Log</strong></td>
                    <td>10,000 entries </td>
                </tr>
                <tr>
                    <td><strong>Admin Port</strong></td>
                    <td>3002 (configurable) </td>
                </tr>
            </tbody>
        </table>
    </section>
    <div class="footer">
        <p>Licensed under the GNU General Public License v3.0.</p>
        <p><strong>⚠️ Disclaimer:</strong> riotcoke is not responsible for anything that happens.</p>
    </div>
</div>
