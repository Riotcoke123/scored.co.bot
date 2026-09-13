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

A small, password-protected **admin dashboard** (built with Express) lets you turn individual mirrors, the watermark step, and per-community commenting on or off at runtime — no redeploy required. The dashboard also has a built-in **self-update system**, so you can push code changes from the browser without SSHing in.

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
- Upload code updates, with automatic backup and crash-loop rollback
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

## 🔄 Self-updating admin panel

The dashboard's **Update** page (`/update`, linked from the header) lets you push code changes to a running deployment straight from the browser — no SSH, no manual `git pull` — while keeping an automatic safety net in case a change breaks something.

<div align="center">
<table>
<tr><td>

| Step | What happens |
|---|---|
| 1. Upload | Drop in a `.zip` — either the **full project** or a **partial package** containing only the changed files. Whatever's inside the zip is exactly what gets touched, which is how changed files are auto-detected. |
| 2. Review | The panel lists every file in the package and whether it's new or an overwrite. |
| 3. Confirm | Applying requires your admin password again, even though you're already logged in. |
| 4. Apply | Every file about to be overwritten is backed up first, the new files are copied in, `npm install` runs automatically if `package.json` changed, then the service restarts itself. |

</td></tr>
</table>
</div>

**Built-in safety mechanisms:**

- **Pre-flight validation** — every `.js`/`.cjs`/`.mjs` file is syntax-checked and every `.json` file is parsed *before* anything is copied. A bad file aborts the whole update with nothing changed.
- **Path safety** — a package can't write outside the project folder, and can't touch `.env`, `.git`, `node_modules`, or the updater's own bookkeeping files.
- **Automatic backups** — every overwritten file is snapshotted before the change, timestamped, and listed on the Update page with a one-click rollback.
- **Crash-loop rollback** — if the app fails to boot 3 times in a row right after an update, the next startup automatically restores the previous version, no intervention needed. An update is considered verified once it's stayed up for 30 seconds.
- **Dependency safety net** — if `package.json` changed and `npm install` fails, the update is rolled back immediately instead of restarting into a broken dependency tree.
- **Cleanup** — uploaded zips and staging files are deleted as soon as they're no longer needed, whether the update succeeds or fails.

> ⚠️ If you deploy with Docker, `docker compose up --build` rebuilds the image from your source tree, which will overwrite anything applied only through the Update page. Keep your repo in sync with what you push through the panel if you plan to rebuild the image later.

See [`UPDATE-SYSTEM.md`](./UPDATE-SYSTEM.md) for the full walkthrough.

---

## 🔒 Security notes

This project handles API credentials and runs an internet-facing admin panel, so a few things are worth knowing:

- **Never commit `.env`.** It's excluded via `.gitignore` and `.dockerignore`. Rotate `SCORED_API_KEY`/`SECRET`, `VIDEY_API_KEY`/`SECRET`, and `ADMIN_PASS` immediately if they're ever exposed.
- **The admin panel binds to `127.0.0.1` by default** in `docker-compose.yml`. If you need remote access, put it behind a reverse proxy (nginx/Caddy) with TLS rather than exposing the port directly.
- **Downloads are restricted to an explicit host allowlist** (`ALLOWED_DOWNLOAD_HOSTS` in `bot.js`) and must be `https://` — the bot will not fetch arbitrary URLs from post data.
- **Login is timing-safe and rate-limited** (8 attempts / 15 minutes per IP), and the app refuses to boot with blank or placeholder admin credentials / session secret.
- **Updates are re-authenticated and sandboxed** — applying or rolling back a package requires re-entering the admin password, uploaded packages can't escape the project folder or touch secrets, and every change is backed up automatically (see [Self-updating admin panel](#-self-updating-admin-panel)).
- **The container runs as a non-root user** and dependencies are installed from the lockfile via `npm ci` for reproducible, auditable builds.
- Run <code>npm audit</code> periodically — at the time of writing this repo has **0 known vulnerabilities**.

If you discover a security issue, please open a private security advisory on GitHub rather than a public issue.

---

## 📂 Project structure

```
scored.co.bot/
├── bot.js                   # Polls scored.co, downloads, watermarks, mirrors, comments
├── admin.js                  # Express admin dashboard (auth + toggles + update panel)
├── lib/
│   └── update-manager.js     # Self-update: staging, backup, apply, crash-loop rollback
├── ecosystem.config.cjs      # pm2 process definition
├── Dockerfile
├── docker-compose.yml
├── package.json
├── UPDATE-SYSTEM.md          # Full guide to the self-update system
├── thenetwork-icon-192x192.png
├── backups/                  # Auto-created — timestamped snapshots from past updates
└── updates/                  # Auto-created — scratch space while a package is staged
```

---

## 📜 License

Released under the <a href="./LICENSE">MIT License</a>.

<div align="center">
<sub>Built for the theNETWORK &amp; spictank communities on scored.co</sub>
</div>
