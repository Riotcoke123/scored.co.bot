import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import 'dotenv/config';
import { loadState } from './admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const COMMUNITIES        = ['spictank', 'thenetwork'];
const SCORED_FEED_API    = c => `https://scored.co/api/v2/post/newv2.json?community=${c}`;
const SCORED_COMMENT_API = 'https://api.scored.co/api/v2/action/create_comment';

const BACKUP_FILE    = './backups.json';
const PROCESSED_FILE = './processed.json';

const POLL_INTERVAL_MS       = 90_000;
const MAX_FILE_SIZE_B        = 2048 * 1024 * 1024;
const MAX_BACKUPS            = 10_000;
const CATBOX_MAX_FILE_SIZE_B = 200  * 1024 * 1024;

const ALLOWED_DOWNLOAD_HOSTS = new Set([
    'fileditch.com', 'new.fileditch.com', 'qu.ax',
    'catbox.moe', 'files.catbox.moe',
    'videy.co', 'cdn.videy.co',
    'buzzheavier.com', 'w.buzzheavier.com',
]);

const SKIP_DOMAINS_RE = /youtube\.com|youtu\.be|kick\.com|x\.com|twitter\.com|sickchirpse\.com|instagram\.com|twitch\.tv|tiktok\.com|odysee\.com|bitchute\.com/;

// ── Mirror state cache (TTL 5 s) — avoids disk reads on every upload call ────

let _stateCache   = null;
let _stateCacheTs = 0;
const STATE_TTL   = 5_000;

function getState() {
    const now = Date.now();
    if (!_stateCache || now - _stateCacheTs > STATE_TTL) {
        _stateCache   = loadState();
        _stateCacheTs = now;
    }
    return _stateCache;
}

/** Pass `snapshot` (from processPost) to skip the cache hit entirely. */
function mirrorEnabled(mirror, snapshot) {
    try { return (snapshot ?? getState())[mirror] !== false; } catch { return true; }
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateDownloadUrl(rawUrl) {
    let parsed;
    try { parsed = new URL(rawUrl); } catch {
        throw new Error(`Invalid URL: ${rawUrl}`);
    }
    if (parsed.protocol !== 'https:')
        throw new Error(`Rejected non-HTTPS URL: ${rawUrl}`);
    if (!ALLOWED_DOWNLOAD_HOSTS.has(parsed.hostname))
        throw new Error(`Rejected URL from disallowed host "${parsed.hostname}": ${rawUrl}`);
    return parsed.href;
}

function safeErrorMessage(e) {
    return `HTTP ${e.response?.status ?? 'no-status'}: ${e.message}`;
}

function loadJSONLenient(file) {
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function loadProcessedStrict(file) {
    if (!fs.existsSync(file)) return [];
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!Array.isArray(data)) throw new Error('not an array');
        return data;
    } catch {
        console.error(`FATAL: ${file} is corrupted — refusing to continue.`);
        process.exit(1);
    }
}

/** Compact JSON (no indent) — faster writes, smaller files. */
function saveJSONAtomic(file, data) {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, file);
}

function getVideoLink(post) {
    const vfl = post.video_link ?? post.video_url ?? post.media_url ?? post.embed_url ?? null;
    if (vfl) return vfl;                          // fast path — most posts have this
    const lnk = post.link ?? '';
    if (lnk.includes('fileditch.com') && !lnk.includes('new.fileditch.com') && lnk.endsWith('.mp4')) return lnk;
    if (lnk.includes('qu.ax') && lnk.endsWith('.mp4')) return lnk;
    return null;
}

function sanitizeUrl(url) {
    return url.replace(/[\r\n\t\x00-\x1F\x7F]/g, '').trim();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Download ──────────────────────────────────────────────────────────────────

async function downloadVideo(url, dest) {
    const safeUrl = validateDownloadUrl(url);
    return withRetry('download', async () => {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);

        const response = await axios({ url: safeUrl, method: 'GET', responseType: 'stream', timeout: 600_000 });

        const contentLength = parseInt(response.headers['content-length'] ?? '0', 10);
        if (contentLength > MAX_FILE_SIZE_B) {
            response.data.destroy();
            throw new Error(`File too large: ${(contentLength / 1024 / 1024).toFixed(0)} MB`);
        }
        const ct = (response.headers['content-type'] ?? '').toLowerCase();
        if (!ct.startsWith('video/') && ct !== 'application/octet-stream') {
            response.data.destroy();
            throw new Error(`Rejected Content-Type: "${ct}"`);
        }

        const writer = fs.createWriteStream(dest);
        let bytesWritten = 0;
        response.data.on('data', chunk => {
            bytesWritten += chunk.length;
            if (bytesWritten > MAX_FILE_SIZE_B) {
                writer.destroy(new Error('Download exceeded limit mid-stream'));
                response.data.destroy();
            }
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
            response.data.on('error', reject);
        });
    });
}

// ── Watermark ─────────────────────────────────────────────────────────────────

const LOGO_PATH = path.join(__dirname, 'IPLOGO.jpeg');

async function watermarkVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        execFile('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-i', LOGO_PATH,
            '-filter_complex', 'overlay=0:0',
            '-preset', 'ultrafast',
            '-threads', '2',         // cap CPU — ultrafast already light on encode
            '-codec:a', 'copy',
            outputPath,
        ], { timeout: 600_000 }, err =>
            err ? reject(new Error(`ffmpeg failed: ${err.message}`)) : resolve()
        );
    });
}

// ── Retry helper ──────────────────────────────────────────────────────────────

async function withRetry(label, fn, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try { return await fn(); } catch (e) {
            const status = e.response?.status;
            if (status >= 400 && status < 500) {
                console.error(`  [${label}] FAILED (${status}) — not retrying client error`);
                return null;
            }
            console.error(`  [${label}] FAILED (attempt ${attempt}/${retries}): ${e.message}`);
            if (attempt < retries) await sleep(Math.min(15_000 * attempt, 60_000));
        }
    }
    return null;
}

// ── Upload helpers ────────────────────────────────────────────────────────────

async function uploadToMirror(label, targetUrl, filePath) {
    return withRetry(label, async () => {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));
        const res = await axios.post(targetUrl, form, { headers: form.getHeaders(), timeout: 600_000 });
        const link = res.data?.files?.[0]?.url ?? res.data?.url ?? null;
        if (!link) throw new Error('no url in response');
        console.log(`  [${label}] ${link}`);
        return link;
    });
}

async function uploadToQuax(filePath, state) {
    if (!mirrorEnabled('quax', state)) { console.log('  [qu.ax] Skipped — disabled'); return null; }
    return uploadToMirror('qu.ax', process.env.QUAX_API, filePath);
}

async function uploadToBuzzheavier(filePath, state) {
    if (!mirrorEnabled('buzzheavier', state)) { console.log('  [buzzheavier] Skipped — disabled'); return null; }
    return withRetry('buzzheavier', async () => {
        const fileName = path.basename(filePath);
        const fileSize = fs.statSync(filePath).size;
        const res = await axios.put(
            `https://w.buzzheavier.com/${process.env.BUZZHEAVIER_PARENT_ID}/${encodeURIComponent(fileName)}`,
            fs.createReadStream(filePath),
            {
                headers: {
                    'Content-Type':   'application/octet-stream',
                    'Content-Length': fileSize,
                    'Authorization':  `Bearer ${process.env.BUZZHEAVIER_API_KEY}`,
                },
                maxContentLength: Infinity,
                maxBodyLength:    Infinity,
                timeout:          600_000,
            }
        );
        const id = res.data?.data?.id ?? null;
        if (!id) throw new Error(`unexpected buzzheavier response`);
        const link = `https://buzzheavier.com/${id}`;
        console.log(`  [buzzheavier] ${link}`);
        return link;
    });
}

async function uploadToFileditch(filePath, state) {
    if (!mirrorEnabled('fileditch', state)) { console.log('  [fileditch] Skipped — disabled'); return null; }
    return withRetry('fileditch', async () => {
        const fileSize = fs.statSync(filePath).size;
        const res = await axios.put('https://new.fileditch.com/upload.php', fs.createReadStream(filePath), {
            headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': fileSize },
            maxContentLength: Infinity,
            maxBodyLength:    Infinity,
            timeout:          600_000,
        });
        const link = res.data?.files?.[0]?.url ?? res.data?.url ?? null;
        if (!link) throw new Error('unexpected fileditch response');
        console.log(`  [fileditch] ${link}`);
        return link;
    });
}

async function uploadToCatbox(filePath, state) {
    if (!mirrorEnabled('catbox', state)) { console.log('  [catbox] Skipped — disabled'); return null; }
    const fileSize = fs.statSync(filePath).size;
    if (fileSize > CATBOX_MAX_FILE_SIZE_B) {
        console.log(`  [catbox] Skipping — too large (${(fileSize / 1024 / 1024).toFixed(0)} MB)`);
        return null;
    }
    return withRetry('catbox', async () => {
        const form = new FormData();
        form.append('reqtype',      'fileupload');
        form.append('userhash',     process.env.CATBOX_USERHASH);
        form.append('fileToUpload', fs.createReadStream(filePath), path.basename(filePath));
        const res = await axios.post(process.env.CATBOX_API, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength:    Infinity,
            timeout:          600_000,
        });
        const link = typeof res.data === 'string' ? res.data.trim() : null;
        if (!link?.startsWith('https://')) throw new Error(`unexpected catbox response: ${res.data}`);
        console.log(`  [catbox] ${link}`);
        return link;
    });
}

// ── Scored API ────────────────────────────────────────────────────────────────

const scoredHeaders = (community = COMMUNITIES[0]) => ({
    'referer':        `https://scored.co/c/${community}`,
    'user-agent':     process.env.USER_AGENT,
    'x-api-key':      process.env.SCORED_API_KEY,
    'x-api-platform': 'Scored-Desktop',
    'x-api-secret':   process.env.SCORED_API_SECRET,
    'x-xsrf-token':   process.env.SCORED_XSRF_TOKEN,
});

async function postComment(postId, content, community) {
    const params = new URLSearchParams({
        content, parentId: String(postId), commentParentId: '0', community,
    });
    try {
        await axios.post(SCORED_COMMENT_API, params, {
            headers: { ...scoredHeaders(community), 'content-type': 'application/x-www-form-urlencoded' },
        });
        console.log('  [comment] Posted OK');
    } catch (e) {
        console.error(`  [comment] FAILED ${safeErrorMessage(e)}`);
    }
}

// ── Process post ──────────────────────────────────────────────────────────────

// Kept in memory — no disk reload per post (same pattern as processedIds).
const backupLog = loadJSONLenient(BACKUP_FILE);

async function processPost(post, community) {
    const { id: postId, title = 'Unknown Title', author = 'Unknown' } = post;
    const videoLink = getVideoLink(post);
    if (!videoLink) return;

    let safeVideoLink;
    try { safeVideoLink = validateDownloadUrl(videoLink); } catch { return; }

    // One state read per post — passed to every upload fn so no repeat cache hits.
    const state = getState();
    if (!Object.values(state).some(Boolean)) {
        console.log(`  [${postId}] All mirrors disabled — skipping`);
        return;
    }

    const ts       = Date.now();
    const tempPath  = path.join(__dirname, `temp_${postId}_${ts}.mp4`);
    const wmarkPath = path.join(__dirname, `temp_${postId}_${ts}_wm.mp4`);

    try {
        console.log(`  Downloading...`);
        await downloadVideo(safeVideoLink, tempPath);

        // Watermark is optional — skip ffmpeg entirely if disabled
        const useWatermark = state.watermark !== false;
        let uploadPath = tempPath;
        if (useWatermark) {
            console.log(`  Watermarking...`);
            await watermarkVideo(tempPath, wmarkPath);
            uploadPath = wmarkPath;
        } else {
            console.log(`  Watermark disabled — uploading original`);
        }

        console.log(`  Uploading to mirrors...`);
        const [quaxLink, buzzheavierLink, fileditchLink, catboxLink] = await Promise.all([
            uploadToQuax(uploadPath, state),
            uploadToBuzzheavier(uploadPath, state),
            uploadToFileditch(uploadPath, state),
            uploadToCatbox(uploadPath, state),
        ]);

        const mirrorLines = [
            fileditchLink   && `FileDitch: ${sanitizeUrl(fileditchLink)}`,
            catboxLink      && `Catbox: ${sanitizeUrl(catboxLink)}`,
            quaxLink        && `Qu.ax: ${sanitizeUrl(quaxLink)}`,
            buzzheavierLink && `BuzzHeavier: ${sanitizeUrl(buzzheavierLink)}`,
        ].filter(Boolean).join('\n');

        if (mirrorLines) {
            if (state.comments !== false) {
                await postComment(postId, `**Backup Mirrors:**\n\n${mirrorLines}`, community);
            } else {
                console.log('  [comment] Skipped — comments disabled');
            }
        }

        backupLog.push({
            timestamp: new Date().toISOString(),
            scored_post_id: postId, title, author,
            original_link: safeVideoLink,
            catbox: catboxLink, fileditch: fileditchLink, quax: quaxLink, buzzheavier: buzzheavierLink,
        });
        if (backupLog.length > MAX_BACKUPS) backupLog.splice(0, backupLog.length - MAX_BACKUPS);
        saveJSONAtomic(BACKUP_FILE, backupLog);

        console.log(`  Done with post ${postId}`);
    } catch (err) {
        console.error(`  ERROR on post ${postId}: ${err.message}`);
    } finally {
        if (fs.existsSync(tempPath))  fs.unlinkSync(tempPath);
        if (fs.existsSync(wmarkPath)) fs.unlinkSync(wmarkPath);
    }
}

// ── Poll loop ─────────────────────────────────────────────────────────────────

// In-memory — loaded once at startup, never re-read from disk mid-run.
const processedIds = new Set(loadProcessedStrict(PROCESSED_FILE));

async function fetchNewPosts(community) {
    console.log(`\n[${new Date().toISOString()}] Polling c/${community}...`);
    try {
        const res = await withRetry('feed-fetch', () =>
            axios.get(SCORED_FEED_API(community), { headers: scoredHeaders(community) })
        );
        if (!res) return [];

        const newPosts = (res.data?.posts ?? []).filter(p => {
            if (processedIds.has(p.id)) return false;
            const link = getVideoLink(p);
            return link && !SKIP_DOMAINS_RE.test(link);
        });

        if (newPosts.length) {
            newPosts.forEach(p => processedIds.add(p.id));
            saveJSONAtomic(PROCESSED_FILE, [...processedIds]);
        }
        return newPosts;
    } catch {
        return [];
    }
}

let isFetching = false;
async function scheduledPoll() {
    setTimeout(scheduledPoll, POLL_INTERVAL_MS);
    if (isFetching) return;
    isFetching = true;
    try {
        const results = await Promise.all(COMMUNITIES.map(fetchNewPosts));
        for (let i = 0; i < COMMUNITIES.length; i++)
            for (const post of results[i])
                await processPost(post, COMMUNITIES[i]);
    } finally {
        isFetching = false;
    }
}

// Clean up any temp files left by a previous crashed run
fs.readdirSync(__dirname)
    .filter(f => f.startsWith('temp_') && f.endsWith('.mp4'))
    .forEach(f => fs.unlinkSync(path.join(__dirname, f)));

console.log('Bot started.');
scheduledPoll();