<div align="center">

<img src="./thenetwork-icon-192x192.png" width="80" alt="theNETWORK icon">

# scored.co.bot

**An automated video backup &amp; mirroring bot for <a href="https://scored.co">scored.co</a> communities.**

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Docker" src="https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white">
  <img alt="Vulnerabilities" src="https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-brightgreen">
</p>

</div>

---

## 📖 Overview

`scored.co.bot` polls one or more <a href="https://scored.co">scored.co</a> communities for new video posts, downloads them, stamps them with a watermark, and re-uploads them to several free mirror hosts so the content survives even if the original link dies. It then replies to the original post with a comment linking every mirror it produced.

A small, password-protected **admin dashboard** (built with Express) lets you turn individual mirrors, the watermark step, and per-community commenting on or off at runtime — no redeploy required.

<table>
<tr>
<td width="50%" valign="top">

### 🤖 Bot (`bot.js`)
- Polls configured communities every 90 seconds
- Downloads new videos with strict size / content-type checks
- Watermarks video with `ffmpeg`
- Uploads in parallel to **Qu.ax**, **Catbox**, **FileDitch**, and **Videy**
- Posts a comment back to the original thread with all mirror links
- Persists a backup log and a de-dupe list of processed post IDs

</td>
<td width="50%" valign="top">

### 🛠️ Admin panel (`admin.js`)
- Session-based login (no default/blank credentials allowed)
- Toggle each mirror, the watermark step, and per-community comments
- Rate-limited login attempts
- Runs on its own port, separate from the bot process

</td>
</tr>
</table>

---

## 🚀 Getting started

### Option A — Docker (recommended)

```bash
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot
cp .env.example .env   # then fill in the values, see table below
docker compose up -d --build
```

The admin panel will be reachable at **http://localhost:3001** (bound to `127.0.0.1` by default — see [Security notes](#-security-notes)).

### Option B — Node.js directly

```bash
git clone https://github.com/Riotcoke123/scored.co.bot.git
cd scored.co.bot
npm ci
cp .env.example .env   # then fill in the values
npm start               # runs bot.js
node admin.js           # in a second terminal / process, runs the dashboard
```

> Requires **Node.js ≥ 20** and **ffmpeg** available on `PATH`.

### Option C — pm2

```bash
npm ci
pm2 start ecosystem.config.cjs
```

---

## ⚙️ Configuration

All configuration is done via environment variables in a `.env` file (never commit this file — it's already covered by `.gitignore`).

<table>
<thead>
<tr><th>Variable</th><th>Required</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td><code>USER_AGENT</code></td><td>✅</td><td>User-Agent header sent with scored.co API requests.</td></tr>
<tr><td><code>SCORED_API_KEY</code></td><td>✅</td><td>Your scored.co API key.</td></tr>
<tr><td><code>SCORED_API_SECRET</code></td><td>✅</td><td>Your scored.co API secret.</td></tr>
<tr><td><code>SCORED_XSRF_TOKEN</code></td><td>–</td><td>Optional XSRF token if your account requires it.</td></tr>
<tr><td><code>QUAX_API</code></td><td>✅</td><td>Upload endpoint for qu.ax (default provided).</td></tr>
<tr><td><code>CATBOX_API</code></td><td>✅</td><td>Upload endpoint for catbox.moe (default provided).</td></tr>
<tr><td><code>CATBOX_USERHASH</code></td><td>–</td><td>Optional Catbox account userhash (anonymous uploads work without it).</td></tr>
<tr><td><code>FILEDITCH_API</code></td><td>✅</td><td>Upload endpoint for FileDitch (default provided).</td></tr>
<tr><td><code>VIDEY_API_KEY</code></td><td>✅</td><td>API key for Videy uploads.</td></tr>
<tr><td><code>VIDEY_API_SECRET</code></td><td>✅</td><td>API secret for Videy uploads.</td></tr>
<tr><td><code>ADMIN_PORT</code></td><td>–</td><td>Port for the admin dashboard (default <code>3000</code>, compose maps <code>3001</code>).</td></tr>
<tr><td><code>ADMIN_USER</code></td><td>✅</td><td>Admin dashboard username. The app <b>refuses to start</b> if blank.</td></tr>
<tr><td><code>ADMIN_PASS</code></td><td>✅</td><td>Admin dashboard password. Use a strong, unique value.</td></tr>
<tr><td><code>SESSION_SECRET</code></td><td>✅</td><td>Random secret used to sign session cookies. The app refuses to start with a blank or well-known placeholder value — generate one with <code>openssl rand -hex 32</code>.</td></tr>
</tbody>
</table>

---

## 🖥️ Admin dashboard

<div align="center">
<table>
<tr><td>

| Control | Effect |
|---|---|
| Mirror toggles (Qu.ax / Catbox / FileDitch / Videy) | Enable or disable uploading to that host |
| Watermark toggle | Skip the `ffmpeg` overlay step entirely and upload originals |
| Comments toggle (per community) | Skip posting the mirror-links comment back to scored.co |
| Enable All / Disable All | Bulk-toggle every mirror at once |

</td></tr>
</table>
</div>

Log in at `/login` with the credentials from your `.env` file. Sessions expire after 8 hours of inactivity.

---

## 🔒 Security notes

This project handles API credentials and runs an internet-facing admin panel, so a few things are worth knowing:

- **Never commit `.env`.** It's excluded via `.gitignore` and `.dockerignore`. Rotate `SCORED_API_KEY`/`SECRET`, `VIDEY_API_KEY`/`SECRET`, and `ADMIN_PASS` immediately if they're ever exposed.
- **The admin panel binds to `127.0.0.1` by default** in `docker-compose.yml`. If you need remote access, put it behind a reverse proxy (nginx/Caddy) with TLS rather than exposing the port directly.
- **Downloads are restricted to an explicit host allowlist** (`ALLOWED_DOWNLOAD_HOSTS` in `bot.js`) and must be `https://` — the bot will not fetch arbitrary URLs from post data.
- **Login is timing-safe and rate-limited** (8 attempts / 15 minutes per IP), and the app refuses to boot with blank or placeholder admin credentials / session secret.
- **The container runs as a non-root user** and dependencies are installed from the lockfile via `npm ci` for reproducible, auditable builds.
- Run <code>npm audit</code> periodically — at the time of writing this repo has **0 known vulnerabilities**.

If you discover a security issue, please open a private security advisory on GitHub rather than a public issue.

---

## 📂 Project structure

```
scored.co.bot/
├── bot.js                 # Polls scored.co, downloads, watermarks, mirrors, comments
├── admin.js                # Express admin dashboard (auth + toggles)
├── ecosystem.config.cjs    # pm2 process definition
├── Dockerfile
├── docker-compose.yml
├── package.json
└── thenetwork-icon-192x192.png
```

---

## 📜 License

Released under the <a href="./LICENSE">MIT License</a>.

<div align="center">
<sub>Built for the theNETWORK &amp; spictank communities on scored.co</sub>
</div>
