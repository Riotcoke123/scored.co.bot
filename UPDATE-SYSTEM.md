# Self-update system

The admin panel now has an **Update** page (`/update`, linked from the dashboard header)
that lets you push code changes without SSHing in.

## One-time setup (this change itself)

This first update has to go in manually, the normal way — the update panel doesn't exist
until this code is deployed:

1. Copy `admin.js`, `package.json`, `docker-compose.yml`, and the new `lib/update-manager.js`
   into your project (or just drop in the full package).
2. Run `npm install` once (adds `adm-zip` and `multer`).
3. Restart the bot (`pm2 restart spictank-backup-bot`, or `docker compose up -d --build` if
   you're on Docker).

After that, every future change can go through the panel.

## Using the panel

1. Go to `/update` and drag in a `.zip`. It can be:
   - a **full package** (the whole project), or
   - a **partial package** containing only the files that changed.
   Whatever files are inside the zip are exactly the files that get touched — that's how
   "changed files" is detected, so a partial zip should only contain what actually changed.
2. Review the file list it shows you (new vs. overwrite).
3. Enter your admin password and click **Apply update**. This is a second, explicit
   password check — being logged into the session isn't enough to apply an update.
4. The server backs up every file about to be overwritten, copies in the new files,
   installs npm deps if `package.json` changed, then restarts itself. The page polls
   and reloads once it's back.

## Safety mechanisms

- **Pre-flight checks**: any `.js`/`.cjs`/`.mjs` file is syntax-checked (`node --check`)
  and any `.json` file is parsed before anything is touched. If a file fails, nothing is
  copied — you get an error and the site is untouched.
- **Path safety**: a package can't write outside the project folder, can't touch `.env`,
  `.git`, `node_modules`, or the update system's own bookkeeping files.
- **Automatic backup**: every file that gets overwritten is snapshotted to `backups/<timestamp>/`
  before the change is applied. New files (that didn't exist before) are tracked too, so a
  rollback can remove them.
- **Crash-loop rollback**: if the app crashes on startup 3 times in a row right after an
  update, the next boot automatically restores the pre-update files and restarts again —
  no one needs to notice or intervene. A freshly-applied update is considered "verified"
  once it's been running for 30 seconds without crashing.
- **Manual rollback**: the Update page also lists past backups with a one-click "Roll back
  to this" option (password-protected the same way).
- **npm install safety net**: if `package.json` changed and `npm install` fails, the update
  is rolled back immediately rather than restarting into a broken dependency tree.
- **Cleanup**: uploaded zips and staging folders are deleted as soon as they're no longer
  needed, whether the update succeeds or fails.

## Limitations worth knowing

- Only one update can be staged at a time — uploading a new package discards a previously
  staged (not-yet-applied) one.
- If you run on Docker and rebuild the image (`docker compose up --build`) rather than just
  restarting the existing container, you'll get the code baked into that image, not
  whatever was last applied through the panel. Keep your real source tree in sync with
  what you push through the panel, or you'll lose the update on the next rebuild.
- The crash-loop watchdog only catches update-related crashes at *startup*. A bug that
  only shows up later isn't something an update rollback can catch automatically — use
  manual rollback from the Update page for that.
- Sessions aren't preserved across the restart the update triggers (this was already true
  before), so you'll need to log back in afterward.
