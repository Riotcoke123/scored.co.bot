import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Project root is one level up from /lib
export const ROOT = path.resolve(__dirname, '..');

export const UPDATES_DIR       = path.join(ROOT, 'updates');
export const BACKUPS_DIR       = path.join(ROOT, 'backups');
export const UPDATE_STATE_FILE = path.join(ROOT, 'update-state.json');
export const LAST_RESULT_FILE  = path.join(ROOT, 'last-update-result.json');

// How many consecutive boot failures before we auto-rollback.
const MAX_BOOT_ATTEMPTS = 3;
// How long the process must stay alive after an update before it's
// considered "verified" and the backup is no longer eligible for
// automatic (crash-loop) rollback. Manual rollback via the UI still works.
const VERIFY_WINDOW_MS = 30_000;

// Never allow an uploaded package to touch these — secrets, git internals,
// dependency tree, or the update system's own bookkeeping files.
const BLOCKED_PATH_SEGMENTS = new Set(['.git', 'node_modules']);
const BLOCKED_EXACT_FILES = new Set([
    '.env', '.env.local', '.env.production',
    'update-state.json', 'last-update-result.json',
]);
const BLOCKED_PREFIXES = ['backups/', 'updates/'];

const MAX_ZIP_ENTRIES        = 5000;
const MAX_UNCOMPRESSED_BYTES = 300 * 1024 * 1024; // 300MB total safety cap
const MAX_SINGLE_FILE_BYTES  = 100 * 1024 * 1024;

for (const dir of [UPDATES_DIR, BACKUPS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function nowStamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

function readJsonSafe(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJsonAtomic(file, data) {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
}

function loadUpdateState() {
    return readJsonSafe(UPDATE_STATE_FILE, null);
}
function saveUpdateState(state) {
    writeJsonAtomic(UPDATE_STATE_FILE, state);
}
function clearUpdateState() {
    try { fs.unlinkSync(UPDATE_STATE_FILE); } catch {}
}
function writeLastResult(result) {
    writeJsonAtomic(LAST_RESULT_FILE, { ...result, at: new Date().toISOString() });
}

/** Read (and clear) the last apply/rollback result, for the dashboard to show once. */
export function consumeLastResult() {
    const data = readJsonSafe(LAST_RESULT_FILE, null);
    if (data) { try { fs.unlinkSync(LAST_RESULT_FILE); } catch {} }
    return data;
}

export function getUpdateState() {
    return loadUpdateState();
}

export function listBackups() {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    return fs.readdirSync(BACKUPS_DIR)
        .filter(name => fs.statSync(path.join(BACKUPS_DIR, name)).isDirectory())
        .sort()
        .reverse();
}

/**
 * Validate a path from inside a zip is safe to write under ROOT.
 * Throws on anything suspicious.
 */
function assertSafeRelativePath(relPath) {
    const normalized = relPath.replace(/\\/g, '/');
    if (!normalized || normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
        throw new Error(`Unsafe path in package: ${relPath}`);
    }
    const parts = normalized.split('/');
    if (parts.includes('..')) throw new Error(`Path traversal attempt in package: ${relPath}`);
    if (parts.some(p => BLOCKED_PATH_SEGMENTS.has(p))) {
        throw new Error(`Package may not touch ${normalized}`);
    }
    if (BLOCKED_EXACT_FILES.has(normalized)) {
        throw new Error(`Package may not overwrite protected file: ${normalized}`);
    }
    if (BLOCKED_PREFIXES.some(p => normalized.startsWith(p))) {
        throw new Error(`Package may not write into: ${normalized}`);
    }
    // Final check: resolved path really is inside ROOT
    const resolved = path.resolve(ROOT, normalized);
    if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
        throw new Error(`Path escapes project root: ${relPath}`);
    }
    return normalized;
}

/**
 * Extract an uploaded zip into a fresh staging directory.
 * Returns { stagingDir, files: [{relPath, size}] }
 */
export function stageUpload(zipPath) {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries().filter(e => !e.isDirectory);

    if (entries.length === 0) throw new Error('Package is empty.');
    if (entries.length > MAX_ZIP_ENTRIES) throw new Error('Package has too many files.');

    let total = 0;
    const files = [];
    for (const entry of entries) {
        const relPath = assertSafeRelativePath(entry.entryName);
        const size = entry.header.size;
        if (size > MAX_SINGLE_FILE_BYTES) throw new Error(`File too large: ${relPath}`);
        total += size;
        if (total > MAX_UNCOMPRESSED_BYTES) throw new Error('Package is too large when uncompressed.');
        files.push({ relPath, size, existedBefore: fs.existsSync(path.join(ROOT, relPath)) });
    }

    const stagingDir = path.join(UPDATES_DIR, `staging-${nowStamp()}`);
    fs.mkdirSync(stagingDir, { recursive: true });
    zip.extractAllTo(stagingDir, true);

    return { stagingDir, files };
}

function copyFileEnsuringDir(src, dest) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

/** node --check a .js/.cjs/.mjs file for syntax errors. Resolves true/false. */
function checkJsSyntax(filePath) {
    return new Promise(resolve => {
        execFile(process.execPath, ['--check', filePath], err => resolve(!err));
    });
}

/**
 * Apply a staged update: validate -> backup -> copy over live files -> record state.
 * Does NOT restart the process; caller should do that after responding to the client.
 */
export async function applyUpdate(stagingDir, files) {
    // 1. Validate syntax of any JS-like files and JSON files before touching anything live.
    for (const f of files) {
        const stagedPath = path.join(stagingDir, f.relPath);
        if (/\.(js|cjs|mjs)$/.test(f.relPath)) {
            const ok = await checkJsSyntax(stagedPath);
            if (!ok) throw new Error(`Syntax error in uploaded file: ${f.relPath} — update aborted, nothing was changed.`);
        } else if (/\.json$/.test(f.relPath)) {
            try { JSON.parse(fs.readFileSync(stagedPath, 'utf8')); }
            catch { throw new Error(`Invalid JSON in uploaded file: ${f.relPath} — update aborted, nothing was changed.`); }
        }
    }

    // 2. Backup every file that currently exists and is about to be overwritten.
    const backupId = nowStamp();
    const backupDir = path.join(BACKUPS_DIR, backupId);
    fs.mkdirSync(backupDir, { recursive: true });

    const backedUp = [];
    const newFiles = [];
    for (const f of files) {
        const livePath = path.join(ROOT, f.relPath);
        if (f.existedBefore) {
            const backupPath = path.join(backupDir, f.relPath);
            copyFileEnsuringDir(livePath, backupPath);
            backedUp.push(f.relPath);
        } else {
            newFiles.push(f.relPath);
        }
    }
    writeJsonAtomic(path.join(backupDir, '_manifest.json'), {
        backupId, createdAt: new Date().toISOString(), backedUp, newFiles,
    });

    // 3. Copy staged files into place.
    let packageJsonChanged = false;
    try {
        for (const f of files) {
            const stagedPath = path.join(stagingDir, f.relPath);
            const livePath = path.join(ROOT, f.relPath);
            copyFileEnsuringDir(stagedPath, livePath);
            if (f.relPath === 'package.json') packageJsonChanged = true;
        }
    } catch (err) {
        // Copy failed partway through — restore whatever we'd already touched.
        restoreFromBackup(backupDir);
        throw new Error(`Failed while copying files, rolled back: ${err.message}`);
    }

    // 4. If package.json changed, install deps now, synchronously, before restart.
    //    If install fails, roll back immediately — no point restarting into a broken tree.
    if (packageJsonChanged) {
        const installOk = await runNpmInstall();
        if (!installOk) {
            restoreFromBackup(backupDir);
            await runNpmInstall(); // best-effort: reinstall the restored (previously-working) tree
            throw new Error('npm install failed for the new package.json — rolled back to the previous version.');
        }
    }

    // 5. Record pending state so the next boot knows to watch itself.
    saveUpdateState({
        pending: true,
        backupId,
        appliedAt: new Date().toISOString(),
        bootAttempts: 0,
        filesChanged: files.map(f => f.relPath),
    });

    // 6. Clean up staging dir (leftover zip is deleted by the route handler).
    fs.rmSync(stagingDir, { recursive: true, force: true });

    return { backupId, filesChanged: files.map(f => f.relPath) };
}

function runNpmInstall() {
    return new Promise(resolve => {
        execFile('npm', ['install', '--omit=dev'], { cwd: ROOT, timeout: 5 * 60 * 1000 }, err => {
            resolve(!err);
        });
    });
}

/** Restore every file recorded in a backup's manifest, and remove files that were new. */
function restoreFromBackup(backupDir) {
    const manifest = readJsonSafe(path.join(backupDir, '_manifest.json'), null);
    if (!manifest) throw new Error(`Cannot roll back: backup manifest missing for ${backupDir}`);

    for (const relPath of manifest.backedUp) {
        const from = path.join(backupDir, relPath);
        const to = path.join(ROOT, relPath);
        copyFileEnsuringDir(from, to);
    }
    for (const relPath of manifest.newFiles) {
        const target = path.join(ROOT, relPath);
        try { fs.unlinkSync(target); } catch {}
    }
    return manifest;
}

/** Manual rollback to a specific backup, triggered from the UI. */
export async function rollbackTo(backupId) {
    const backupDir = path.join(BACKUPS_DIR, backupId);
    if (!fs.existsSync(backupDir)) throw new Error('Backup not found.');
    const manifest = restoreFromBackup(backupDir);

    // Reinstall deps in case package.json was part of what we just restored.
    if (manifest.backedUp.includes('package.json')) {
        await runNpmInstall();
    }
    clearUpdateState();
    writeLastResult({ result: 'rolled_back', reason: 'Manual rollback', backupId });
    return manifest;
}

/**
 * Call once at process startup (before the server starts serving, doesn't need to block it).
 * Detects whether we just booted into a freshly-applied update, and either arms a
 * verification timer or — if this update has already failed to boot too many times —
 * rolls it back immediately and asks the caller to restart again.
 *
 * Returns { rolledBack: boolean } — if true, the caller should exit so the supervisor
 * (pm2 / docker restart policy) relaunches the process on the restored files.
 */
export function checkUpdateOnBoot() {
    const state = loadUpdateState();
    if (!state || !state.pending) return { rolledBack: false };

    state.bootAttempts = (state.bootAttempts || 0) + 1;
    saveUpdateState(state);

    if (state.bootAttempts > MAX_BOOT_ATTEMPTS) {
        console.error(`[update] Update ${state.backupId} failed to boot cleanly ${state.bootAttempts} times — rolling back.`);
        try {
            restoreFromBackup(path.join(BACKUPS_DIR, state.backupId));
            writeLastResult({
                result: 'rolled_back',
                reason: `Update crashed on startup ${state.bootAttempts - 1} times`,
                backupId: state.backupId,
            });
        } catch (err) {
            console.error(`[update] Rollback itself failed: ${err.message}`);
            writeLastResult({ result: 'rollback_failed', reason: err.message, backupId: state.backupId });
        }
        clearUpdateState();
        return { rolledBack: true };
    }

    console.log(`[update] Booted with a pending update (${state.backupId}, attempt ${state.bootAttempts}). Verifying for ${VERIFY_WINDOW_MS / 1000}s...`);
    setTimeout(() => {
        const current = loadUpdateState();
        // Only clear if this is still the same pending update (not superseded by a newer one).
        if (current && current.pending && current.backupId === state.backupId) {
            clearUpdateState();
            writeLastResult({ result: 'verified', backupId: state.backupId });
            console.log(`[update] Update ${state.backupId} verified — backup retained for manual rollback if needed.`);
        }
    }, VERIFY_WINDOW_MS);

    return { rolledBack: false };
}
