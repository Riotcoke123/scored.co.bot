import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMUNITIES = ['spictank', 'theNETWORK'];
const SCORED_FEED_API    = (community) => `https://scored.co/api/v2/post/newv2.json?community=${community}`;
const SCORED_COMMENT_API = 'https://api.scored.co/api/v2/action/create_comment';

const BACKUP_FILE    = './backups.json';
const PROCESSED_FILE = './processed.json';

const POLL_INTERVAL_MS  = 90 * 1000;
const MAX_FILE_SIZE_MB  = 2048; 
const MAX_FILE_SIZE_B   = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_BACKUPS       = 10_000;

const ALLOWED_DOWNLOAD_HOSTS = new Set([
    'fileditch.com',
    'new.fileditch.com',
    'qu.ax',
    'pixeldrain.com',
    'catbox.moe',
    'files.catbox.moe',
    'videy.co',
    'cdn.videy.co',
    'buzzheavier.com',
    'w.buzzheavier.com',
]);

const SKIP_DOMAINS_RE = /youtube\.com|youtu\.be|kick\.com|x\.com|twitter\.com|sickchirpse\.com|instagram\.com|twitch\.tv|tiktok\.com|odysee\.com|bitchute\.com/;

function validateDownloadUrl(rawUrl) {
    let parsed;
    try { parsed = new URL(rawUrl); } catch {
        throw new Error(`Invalid URL: ${rawUrl}`);
    }
    if (parsed.protocol !== 'https:') {
        throw new Error(`Rejected non-HTTPS URL: ${rawUrl}`);
    }
    if (!ALLOWED_DOWNLOAD_HOSTS.has(parsed.hostname)) {
        throw new Error(`Rejected URL from disallowed host "${parsed.hostname}": ${rawUrl}`);
    }
    return parsed.href;
}

function safeErrorMessage(e) {
    const status = e.response?.status ?? 'no-status';
    return `HTTP ${status}: ${e.message}`;
}

function loadJSONLenient(file) {
    if (fs.existsSync(file)) {
        try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
    }
    return [];
}

function loadProcessedStrict(file) {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    try {
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) throw new Error('processed.json is not an array');
        return data;
    } catch (e) {
        console.error(`FATAL: ${file} is corrupted — refusing to continue.`);
        process.exit(1);
    }
}

function saveJSONAtomic(file, data) {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
}

function getVideoLink(post) {
    const fileditchLink = (post.link && post.link.includes('fileditch.com') && !post.link.includes('new.fileditch.com') && post.link.endsWith('.mp4')) ? post.link : null;
    const quaxLink      = (post.link && post.link.includes('qu.ax') && post.link.endsWith('.mp4')) ? post.link : null;
    const pdLink        = (post.link && post.link.includes('pixeldrain.com')) ? post.link : null;

    const videoFieldLink = post.video_link ?? post.video_url ?? post.media_url ?? post.embed_url ?? null;

    if (videoFieldLink) {
        if (videoFieldLink.includes('fileditch.com') && !videoFieldLink.includes('new.fileditch.com') && videoFieldLink.endsWith('.mp4')) return videoFieldLink;
        if (videoFieldLink.includes('qu.ax')         && videoFieldLink.endsWith('.mp4')) return videoFieldLink;
        if (videoFieldLink.includes('pixeldrain.com')) return videoFieldLink;
    }
    return videoFieldLink ?? fileditchLink ?? quaxLink ?? pdLink ?? null;
}

function sanitizeUrl(url) {
    return url.replace(/[\r\n\t\x00-\x1F\x7F]/g, '').trim();
}

async function downloadVideo(url, dest) {
    const safeUrl = validateDownloadUrl(url);

    return withRetry('download', async () => {
        console.log(`  -> Downloading: ${safeUrl}`);
        if (fs.existsSync(dest)) fs.unlinkSync(dest);

        const response = await axios({ url: safeUrl, method: 'GET', responseType: 'stream', timeout: 600000 });

        const contentLength = parseInt(response.headers['content-length'] ?? '0', 10);
        if (contentLength > MAX_FILE_SIZE_B) {
            response.data.destroy();
            throw new Error(`File too large: ${(contentLength / 1024 / 1024).toFixed(0)} MB`);
        }

        const contentType = (response.headers['content-type'] ?? '').toLowerCase();
        if (!contentType.startsWith('video/') && contentType !== 'application/octet-stream') {
            response.data.destroy();
            throw new Error(`Rejected unexpected Content-Type: "${contentType}"`);
        }

        const writer = fs.createWriteStream(dest);
        let bytesWritten = 0;

        response.data.on('data', (chunk) => {
            bytesWritten += chunk.length;
            if (bytesWritten > MAX_FILE_SIZE_B) {
                writer.destroy(new Error(`Download exceeded limit mid-stream`));
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

const LOGO_PATH = path.join(__dirname, 'IPLOGO.jpeg');

async function watermarkVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        // overlay=0:0 places the logo at top-left with no resizing applied to logo
        execFile('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-i', LOGO_PATH,
            '-filter_complex', 'overlay=0:0',
            '-preset', 'ultrafast',
            '-codec:a', 'copy',
            outputPath
        ], { timeout: 600000 }, (err) => {
            if (err) {
                reject(new Error(`ffmpeg watermark failed: ${err.message}`));
            } else {
                resolve();
            }
        });
    });
}

async function withRetry(label, fn, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (e) {
            const status = e.response?.status;
            if (status && status >= 400 && status < 500) {
                console.error(`  [${label}] FAILED (${status}) — not retrying client error`);
                return null;
            }
            const isLast = attempt === retries;
            const delay  = Math.min(15000 * attempt, 60000);
            console.error(`  [${label}] FAILED (attempt ${attempt}/${retries}): ${e.message}`);
            if (!isLast) {
                await sleep(delay);
            }
        }
    }
    return null;
}

async function uploadToMirror(label, targetUrl, filePath) {
    return withRetry(label, async () => {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));
        const res = await axios.post(targetUrl, form, {
            headers: form.getHeaders(),
            timeout: 600000
        });
        const link = res.data?.files?.[0]?.url ?? res.data?.url ?? null;
        if (!link) throw new Error('no url in response');
        console.log(`  [${label}] ${link}`);
        return link;
    });
}

async function uploadToBuzzheavier(filePath) {
    return withRetry('buzzheavier', async () => {
        const fileName = path.basename(filePath);
        const fileData = fs.createReadStream(filePath);
        const fileSize = fs.statSync(filePath).size;
        const res = await axios.put(
            `https://w.buzzheavier.com/${process.env.BUZZHEAVIER_PARENT_ID}/${encodeURIComponent(fileName)}`,
            fileData,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.BUZZHEAVIER_API_KEY}`,
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': fileSize
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 600000
            }
        );
        const id = res.data?.data?.id;
        if (!id) throw new Error(`unexpected buzzheavier response`);
        const link = `https://buzzheavier.com/${id}`;
        console.log(`  [buzzheavier] ${link}`);
        return link;
    });
}

async function uploadToPixeldrain(filePath) {
    return withRetry('pixeldrain', async () => {
        const fileName = path.basename(filePath);
        const fileData = fs.createReadStream(filePath);
        const res = await axios.put(
            `https://pixeldrain.com/api/file/${encodeURIComponent(fileName)}`,
            fileData,
            {
                auth: {
                    username: '',
                    password: process.env.PIXELDRAIN_API_KEY
                },
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 600000
            }
        );
        const id = res.data?.id;
        if (!id) throw new Error(`unexpected pixeldrain response`);
        const link = `https://pixeldrain.com/u/${id}`;
        console.log(`  [pixeldrain] ${link}`);
        return link;
    });
}

async function uploadToFileditch(filePath) {
    return withRetry('fileditch', async () => {
        const fileName = path.basename(filePath);
        const fileData = fs.createReadStream(filePath);
        const fileSize = fs.statSync(filePath).size;
        const res = await axios.put(
            `${process.env.FILEDITCH_API}?filename=${encodeURIComponent(fileName)}`,
            fileData,
            {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': fileSize,
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 600000
            }
        );
        const link = res.data?.files?.[0]?.url ?? res.data?.url ?? null;
        if (!link) throw new Error(`unexpected fileditch response`);
        console.log(`  [fileditch] ${link}`);
        return link;
    });
}

const CATBOX_MAX_FILE_SIZE_B = 200 * 1024 * 1024;

// Catbox temporarily paused — remove this line after 72 hrs to re-enable
const CATBOX_PAUSED_UNTIL = new Date('2026-04-24T' + new Date().toISOString().slice(11));

// Qu.ax mirror temporarily paused — remove this line after 4 days to re-enable
const QUAX_PAUSED_UNTIL = new Date('2026-04-26T' + new Date().toISOString().slice(11));

async function uploadToQuax(filePath) {
    if (new Date() < QUAX_PAUSED_UNTIL) {
        console.log(`  [qu.ax] Skipping — paused until ${QUAX_PAUSED_UNTIL.toISOString()}`);
        return null;
    }
    return uploadToMirror('qu.ax', process.env.QUAX_API, filePath);
}

async function uploadToCatbox(filePath) {
    if (new Date() < CATBOX_PAUSED_UNTIL) {
        console.log(`  [catbox] Skipping — paused until ${CATBOX_PAUSED_UNTIL.toISOString()}`);
        return null;
    }
    const fileSize = fs.statSync(filePath).size;
    if (fileSize > CATBOX_MAX_FILE_SIZE_B) {
        console.log(`  [catbox] Skipping — file too large (${(fileSize / 1024 / 1024).toFixed(0)} MB > 200 MB limit)`);
        return null;
    }
    return withRetry('catbox', async () => {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('userhash', process.env.CATBOX_USERHASH);
        form.append('fileToUpload', fs.createReadStream(filePath), path.basename(filePath));
        const res = await axios.post(process.env.CATBOX_API, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 600000
        });
        const link = typeof res.data === 'string' ? res.data.trim() : null;
        if (!link || !link.startsWith('https://')) throw new Error(`unexpected catbox response: ${res.data}`);
        console.log(`  [catbox] ${link}`);
        return link;
    });
}

async function upvotePost(postId) {
    const params = new URLSearchParams();
    params.append('id', String(postId));
    params.append('type', 'true');
    params.append('direction', 'true');
    try {
        await axios.post('https://api.scored.co/api/v2/action/vote', params, {
            headers: { ...scoredHeaders(), 'content-type': 'application/x-www-form-urlencoded' }
        });
        console.log(`  [upvote] Upvoted post ${postId} OK`);
    } catch (e) {
        console.error(`  [upvote] FAILED ${safeErrorMessage(e)}`);
    }
}

async function postComment(postId, content, community) {
    const params = new URLSearchParams();
    params.append('content', content);
    params.append('parentId', String(postId));
    params.append('commentParentId', '0');
    params.append('community', community);
    try {
        const res = await axios.post(SCORED_COMMENT_API, params, {
            headers: { ...scoredHeaders(community), 'content-type': 'application/x-www-form-urlencoded' }
        });
        console.log(`  [comment] Posted OK`);
        return res.data;
    } catch (e) {
        console.error(`  [comment] FAILED ${safeErrorMessage(e)}`);
    }
}

const scoredHeaders = (community = COMMUNITIES[0]) => ({
    'referer': `https://scored.co/c/${community}`,
    'user-agent': process.env.USER_AGENT,
    'x-api-key': process.env.SCORED_API_KEY,
    'x-api-platform': 'Scored-Desktop',
    'x-api-secret': process.env.SCORED_API_SECRET,
    'x-xsrf-token': process.env.SCORED_XSRF_TOKEN
});

async function processPost(post, community) {
    const postId    = post.id;
    const title     = post.title  ?? 'Unknown Title';
    const author    = post.author ?? 'Unknown';
    const videoLink = getVideoLink(post);

    upvotePost(postId); // fire-and-forget — doesn't block the download

    if (!videoLink) return;

    let safeVideoLink;
    try {
        safeVideoLink = validateDownloadUrl(videoLink);
    } catch (e) {
        return;
    }

    const ts       = Date.now();
    const tempPath = path.join(__dirname, `temp_${postId}_${ts}.mp4`);
    const wmarkPath = path.join(__dirname, `temp_${postId}_${ts}_wm.mp4`);

    try {
        let catboxLink = null, quaxLink = null, pixeldrainLink = null, buzzheavierLink = null;
        let fileditchLink = null;

        let downloadUrl = safeVideoLink;
        if (downloadUrl.includes('pixeldrain.com/u/')) {
            downloadUrl = downloadUrl.replace('/u/', '/api/file/');
        }

        console.log(`  Downloading for mirrors...`);
        await downloadVideo(downloadUrl, tempPath);

        console.log(`  Applying IPLOGO.jpeg watermark (top-left)...`);
        await watermarkVideo(tempPath, wmarkPath);

        console.log(`  Uploading mirrors (watermarked)...`);
        const uploads = await Promise.all([
            uploadToQuax(wmarkPath),
            uploadToPixeldrain(wmarkPath),
            uploadToBuzzheavier(wmarkPath),
            uploadToFileditch(wmarkPath),
            uploadToCatbox(wmarkPath),
        ]);

        if (!quaxLink)        quaxLink        = uploads[0];
        if (!pixeldrainLink)  pixeldrainLink  = uploads[1];
        if (!buzzheavierLink) buzzheavierLink = uploads[2];
        if (!fileditchLink)   fileditchLink   = uploads[3];
        if (!catboxLink)      catboxLink      = uploads[4];

        const mirrorLines = [
            fileditchLink   ? `FileDitch: ${sanitizeUrl(fileditchLink)}`       : null,
            catboxLink      ? `Catbox: ${sanitizeUrl(catboxLink)}`             : null,
            quaxLink        ? `Qu.ax: ${sanitizeUrl(quaxLink)}`                : null,
            pixeldrainLink  ? `Pixeldrain: ${sanitizeUrl(pixeldrainLink)}`     : null,
            buzzheavierLink ? `BuzzHeavier: ${sanitizeUrl(buzzheavierLink)}`   : null,
        ].filter(Boolean).join('\n');

        if (mirrorLines) {
            await postComment(postId, `**Backup Mirrors:**\n\n${mirrorLines}`, community);
        }

        const backups = loadJSONLenient(BACKUP_FILE);
        backups.push({
            timestamp: new Date().toISOString(),
            scored_post_id: postId,
            title, author,
            original_link: safeVideoLink,
            catbox: catboxLink, fileditch: fileditchLink, quax: quaxLink,
            pixeldrain: pixeldrainLink, buzzheavier: buzzheavierLink
        });
        if (backups.length > MAX_BACKUPS) backups.splice(0, backups.length - MAX_BACKUPS);
        saveJSONAtomic(BACKUP_FILE, backups);

        console.log(`  Done with post ${postId}`);
    } catch (err) {
        console.error(`  ERROR on post ${postId}: ${err.message}`);
    } finally {
        if (fs.existsSync(tempPath))  fs.unlinkSync(tempPath);
        if (fs.existsSync(wmarkPath)) fs.unlinkSync(wmarkPath);
    }
}

// Loaded once at startup — kept in memory to avoid repeated disk reads
// and to prevent race conditions when communities are fetched in parallel.
const processedIds = new Set(loadProcessedStrict(PROCESSED_FILE));

async function fetchNewPosts(community) {
    console.log(`\n[${new Date().toISOString()}] Polling feed for c/${community}...`);
    try {
        const res = await withRetry('feed-fetch', () => axios.get(SCORED_FEED_API(community), { headers: scoredHeaders(community) }));
        if (!res) return [];

        const posts = res.data?.posts ?? [];

        const newPosts = posts.filter(p => {
            if (processedIds.has(p.id)) return false;
            const link = getVideoLink(p);
            if (!link) return false;
            return !SKIP_DOMAINS_RE.test(link);
        });

        if (newPosts.length) {
            // Synchronous update — no await between add and save, so parallel
            // community fetches cannot interleave and overwrite each other's IDs.
            newPosts.forEach(p => processedIds.add(p.id));
            saveJSONAtomic(PROCESSED_FILE, [...processedIds]);
        }
        return newPosts;
    } catch (err) {
        return [];
    }
}

let isFetching = false;
async function scheduledPoll() {
    setTimeout(scheduledPoll, POLL_INTERVAL_MS);
    if (isFetching) return;
    isFetching = true;
    try {
        const results = await Promise.all(
            COMMUNITIES.map(community => fetchNewPosts(community))
        );
        for (let i = 0; i < COMMUNITIES.length; i++) {
            const community = COMMUNITIES[i];
            for (const post of results[i]) {
                await processPost(post, community);
            }
        }
    } finally {
        isFetching = false;
    }
}

const leftoverTemps = fs.readdirSync(__dirname).filter(f => f.startsWith('temp_') && f.endsWith('.mp4'));
leftoverTemps.forEach(f => fs.unlinkSync(path.join(__dirname, f)));

console.log('Bot started.');
scheduledPoll();