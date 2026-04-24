<div class="container">
    <header>
        <h1>🛡️ Scored.co Video Backup Bot</h1>
        <p>Automated mirroring, FFmpeg watermarking, and community archiving for Scored.co.</p>
        <div class="badge-container">
            <span class="badge badge-blue">Version 1.0.6</span>
            <span class="badge">Node.js (ESM)</span>
            <span class="badge">PM2 Ready</span>
            <span class="badge badge-green">GPL-3.0</span>
        </div>
    </header>
    <section id="overview">
        <h2>📖 Project Overview</h2>
        <p>
            The <strong>spictank-backup-bot</strong> is a production-grade utility designed to monitor <code>c/spictank</code> and <code>c/theNETWORK</code>. 
            It ensures content persistence by creating high-speed mirrors of video posts, applying custom watermarks, and maintaining a robust archive of community media.
        </p>
    </section>
    <section id="features">
        <h2>🚀 Core Features</h2>
        <ul>
            <li><strong>Intelligent Processing:</strong> Automatically detects videos, validates file sizes (up to 2GB), and handles transfers via stream-based processing.</li>
            <li><strong>FFmpeg Integration:</strong> Applies an ultrafast <code>IPLOGO.jpeg</code> watermark overlay to every video before distribution.</li>
            <li><strong>Admin Control Panel:</strong> Built-in Express dashboard to toggle mirrors (Quax, Catbox, BuzzHeavier, FileDitch) on the fly.</li>
            <li><strong>Resilient Architecture:</strong> Atomic file writing for state preservation and automatic cleanup of temporary files on startup.</li>
        </ul>
    </section>
    <section id="installation">
        <h2>🛠️ Quick Start</h2>
        <p>Ensure <strong>FFmpeg</strong> and <strong>Node.js</strong> are installed on your environment.</p>
        <span class="file-label">Bash</span>
        <pre><code># 1. Setup logs and clone
mkdir logs
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot

# 2. Install dependencies
npm install</code></pre>
        <h3>Production Deployment</h3>
        <p>The bot is configured to run as a background service using <strong>PM2</strong>. The <code>ecosystem.config.cjs</code> manages process stability and resource limits.</p>
        <span class="file-label">Bash</span>
        <pre><code># Launch the bot in production mode
npm run prod</code></pre>
    </section>
    <section id="management">
        <h2>⚙️ Process Management</h2>
        <p>The <code>spictank-backup-bot</code> process includes the following production safeguards:</p>
        <ul>
            <li><strong>Memory Management:</strong> Automatically restarts if memory consumption exceeds <strong>1GB</strong>.</li>
            <li><strong>Log Rotation:</strong> Merges standard and error output into the <code>./logs/</code> directory with localized timestamps.</li>
            <li><strong>Auto-Restart:</strong> <code>autorestart: true</code> ensures the bot recovers instantly from unexpected crashes.</li>
        </ul>
        <table>
            <thead>
                <tr>
                    <th>Script</th>
                    <th>Function</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>npm start</code></td>
                    <td>Starts the bot in the current terminal (Foreground).</td>
                </tr>
                <tr>
                    <td><code>npm run prod</code></td>
                    <td>Deploys the bot using PM2 (Background).</td>
                </tr>
                <tr>
                    <td><code>pm2 logs</code></td>
                    <td>View real-time output and error logs.</td>
                </tr>
                <tr>
                    <td><code>pm2 monit</code></td>
                    <td>Monitor CPU/Memory usage and health.</td>
                </tr>
            </tbody>
        </table>
    </section>
    <section id="tech-specs">
        <h2>📜 Technical Details</h2>
        <ul>
            <li><strong>Environment:</strong> <code>NODE_ENV=production</code></li>
            <li><strong>Type:</strong> ECMAScript Module (ESM)</li>
            <li><strong>State Files:</strong> <code>processed.json</code> (ID tracking), <code>backups.json</code> (Mirror logs).</li>
            <li><strong>Polling Interval:</strong> 90 seconds.</li>
        </ul>
    </section>
    <div class="footer">
        <p>Licensed under the GNU General Public License v3.0.</p>
        <p><strong>⚠️ Disclaimer:</strong> riotcoke is not responsible for any actions taken using this software.</p>
    </div>
</div>
