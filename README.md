<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/FFmpeg-Processing-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
  
  <h1 align="center">🪞 Scored Mirror & Automation Suite</h1>
  <p align="center">
    <b>A high-performance automated pipeline for content redistribution, watermarking, and community management.</b>
  </p>
</div>

<hr />

## 🚀 Core Capabilities

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h4>⚡ Automated Polling</h4>
      <p>Monitors <b>c/spictank</b> and <b>c/thenetwork</b> every 90 seconds for new video content.</p>
    </td>
    <td width="50%" valign="top">
      <h4>🖼️ Rapid Watermarking</h4>
      <p>Uses FFmpeg with the <code>ultrafast</code> preset to overlay <code>IPLOGO.jpeg</code> branding.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h4>📦 Multi-Mirror Redundancy</h4>
      <p>Concurrent uploads to Qu.ax, Catbox, BuzzHeavier, and FileDitch.</p>
    </td>
    <td width="50%" valign="top">
      <h4>🛡️ Admin Control</h4>
      <p>Secure web dashboard to toggle mirrors, watermark processing, and community comments on the fly.</p>
    </td>
  </tr>
</table>

<hr />

## 🛠️ Technical Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Runtime** | Node.js (ESM) | Core execution environment. |
| **Web Server** | Express.js | Powers the Admin Dashboard and Management API. |
| **Media Engine** | FFmpeg | Handles video watermarking and processing. |
| **Database** | Atomic JSON | Low-overhead state persistence with <code>.tmp</code> rename safety. |
| **Network** | Axios | Handles feed polling and multipart form uploads. |

<hr />

## ⚙️ Setup & Configuration

### 1. Environment Variables
Create a `.env` file in your root directory. The system requires these variables

```env
# Admin Panel
ADMIN_PORT=3000
ADMIN_USER=admin
ADMIN_PASS=secure_password
SESSION_SECRET=change-me

# Scored API
SCORED_API_KEY=your_key
SCORED_API_SECRET=your_secret
SCORED_XSRF_TOKEN=your_token
USER_AGENT=YourBot/1.0

# Mirror Auth
CATBOX_USERHASH=your_hash
BUZZHEAVIER_API_KEY=your_key
BUZZHEAVIER_PARENT_ID=your_folder_id
QUAX_API=[https://qu.ax/upload.php](https://qu.ax/upload.php)
2. Installation
Bash
# Install dependencies
npm install

# Start the polling bot
node bot.js
# Run the admin dashboard
node admin.js
🔄 Content Lifecycle
Discovery: The bot fetches JSON feeds from Scored.co.

Validation: Checks for new IDs and ensures file sizes are under 2048 MB.

Processing: Applies the watermark overlay and copies the audio stream to maintain quality.

Distribution: Simultaneously uploads to all active mirrors enabled in the dashboard.

Notification: Posts a formatted markdown comment with mirror links back to the original thread.

🎥 Media Processing & Watermarking
The bot utilizes a high-efficiency FFmpeg pipeline optimized for speed and low CPU overhead.

Performance Safeguards
Timeouts: Media processes are capped at 600,000ms to prevent hanging.

Atomic Cleanup: Temporary .mp4 files are unlinked in the finally block to prevent disk bloat.

Mirror Persistence: Mirror states are cached with a 5-second TTL to avoid excessive disk reads.
