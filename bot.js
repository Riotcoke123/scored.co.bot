import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMUNITIES = ['spictank', 'theNETWORK'];
const SCORED_FEED_API    = (community) => `https://scored.co/api/v2/post/newv2.json?community=${community}`;
const SCORED_COMMENT_API = 'https://api.scored.co/api/v2/action/create_comment';

const BACKUP_FILE    = './backups.json';
const PROCESSED_FILE = './processed.json';

const POLL_INTERVAL_MS  = 90 * 1000;
const MAX_FILE_SIZE_MB  = 2048;                          // Fix #2: max download size (2 GB)
const MAX_FILE_SIZE_B   = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_BACKUPS       = 10_000;                        // Fix #8: cap backup log

// Fix #1 & #7: SSRF + HTTPS enforcement — only these exact hostnames may be downloaded
const ALLOWED_DOWNLOAD_HOSTS = new Set([
    'fileditch.com',
    'new.fileditch.com',
    'qu.ax',
    'pixeldrain.com',
    'catbox.moe',
    'files.catbox.moe',
    'videy.co',
    'cdn.videy.co',
    '0.vern.cc',
    'pomf2.lain.la',
    'buzzheavier.com',
    'w.buzzheavier.com',
]);

const SKIP_DOMAINS = [
    'youtube.com', 'youtu.be',
    'kick.com',
    'x.com', 'twitter.com', 'sickchirpse.com',
    'instagram.com',
    'twitch.tv', 'www.twitch.tv',
    'tiktok.com',
    'odysee.com',
    'bitchute.com',
];

// Fix #1 & #7: validate URL before any network request
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
    return parsed.href; // return the canonical form
}

// Fix #10: strip credential headers before logging axios errors
function safeErrorMessage(e) {
    const status = e.response?.status ?? 'no-status';
    return `HTTP ${status}: ${e.message}`;
}

// --- Helpers ---

// Fix #9: two separate loaders — one lenient (backups), one strict (processed)
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
        // Fix #9: halt instead of silently resetting state
        console.error(`FATAL: ${file} is corrupted — refusing to continue to avoid duplicate posts.`);
        console.error(`Backup the file, fix or delete it, then restart the bot.`);
        console.error(`Parse error: ${e.message}`);
        process.exit(1);
    }
}

// Fix #6: atomic write — write to a temp file then rename so reads never see partial data
function saveJSONAtomic(file, data) {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
}

function getVideoLink(post) {
    const fileditchLink = (post.link && post.link.includes('fileditch.com') && post.link.endsWith('.mp4')) ? post.link : null;
    const quaxLink      = (post.link && post.link.includes('qu.ax') && post.link.endsWith('.mp4')) ? post.link : null;
    const pdLink        = (post.link && post.link.includes('pixeldrain.com')) ? post.link : null;

    const videoFieldLink = post.video_link ?? post.video_url ?? post.media_url ?? post.embed_url ?? null;

    if (videoFieldLink) {
        if (videoFieldLink.includes('fileditch.com') && videoFieldLink.endsWith('.mp4')) return videoFieldLink;
        if (videoFieldLink.includes('qu.ax')         && videoFieldLink.endsWith('.mp4')) return videoFieldLink;
        if (videoFieldLink.includes('pixeldrain.com')) return videoFieldLink;
    }
    return videoFieldLink ?? fileditchLink ?? quaxLink ?? pdLink ?? null;
}

// Fix #5: strip newlines and control characters from a URL before embedding in comments
function sanitizeUrl(url) {
    return url.replace(/[\r\n\t\x00-\x1F\x7F]/g, '').trim();
}

async function downloadVideo(url, dest) {
    // Fix #1 & #7: validate before fetching
    const safeUrl = validateDownloadUrl(url);

    return withRetry('download', async () => {
        console.log(`  -> Downloading: ${safeUrl}`);
        if (fs.existsSync(dest)) fs.unlinkSync(dest);

        const response = await axios({ url: safeUrl, method: 'GET', responseType: 'stream', timeout: 600000 });

        // Fix #2: reject if Content-Length exceeds the limit
        const contentLength = parseInt(response.headers['content-length'] ?? '0', 10);
        if (contentLength > MAX_FILE_SIZE_B) {
            response.data.destroy();
            throw new Error(`File too large: ${(contentLength / 1024 / 1024).toFixed(0)} MB (limit ${MAX_FILE_SIZE_MB} MB)`);
        }

        // Fix #4: reject non-video content types
        const contentType = (response.headers['content-type'] ?? '').toLowerCase();
        if (!contentType.startsWith('video/') && contentType !== 'application/octet-stream') {
            response.data.destroy();
            throw new Error(`Rejected unexpected Content-Type: "${contentType}"`);
        }

        const writer = fs.createWriteStream(dest);
        let bytesWritten = 0;

        response.data.on('data', (chunk) => {
            // Fix #2: enforce size limit even when Content-Length was absent/wrong
            bytesWritten += chunk.length;
            if (bytesWritten > MAX_FILE_SIZE_B) {
                writer.destroy(new Error(`Download exceeded ${MAX_FILE_SIZE_MB} MB limit mid-stream`));
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

async function withRetry(label, fn, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (e) {
            const status = e.response?.status;
            if (status && status >= 400 && status < 500) {
                // Fix #10: log only safe error info, not the full response/config
                console.error(`  [${label}] FAILED (${status}) — not retrying client error`);
                return null;
            }
            const isLast = attempt === retries;
            const delay  = Math.min(15000 * attempt, 60000);
            console.error(`  [${label}] FAILED (attempt ${attempt}/${retries}): ${e.message}`);
            if (!isLast) {
                console.log(`  [${label}] Retrying in ${delay / 1000}s...`);
                await sleep(delay);
            }
        }
    }
    return null;
}

// --- Mirror Upload Functions ---

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

async function uploadToCatbox(filePath) {
    return withRetry('catbox', async () => {
        const stats = fs.statSync(filePath);
        const fileSizeMB = stats.size / (1024 * 1024);
        const ext = path.extname(filePath).toLowerCase();

        if (ext !== '.mp4' || fileSizeMB >= 200) {
            console.log(`  [catbox] Skip: Format ${ext} or size ${fileSizeMB.toFixed(2)}MB exceeds 200MB limit.`);
            return null;
        }

        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('userhash', process.env.CATBOX_USERHASH);
        form.append('fileToUpload', fs.createReadStream(filePath));

        const res = await axios.post(process.env.CATBOX_API, form, {
            headers: form.getHeaders(),
            timeout: 600000
        });

        const link = typeof res.data === 'string' && res.data.startsWith('http') ? res.data : null;
        if (!link) throw new Error(`Catbox error: ${res.data}`);
        console.log(`  [catbox] ${link}`);
        return link;
    });
}

async function uploadToGoFile(filePath) {
    return withRetry('gofile', async () => {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        const res = await axios.post(process.env.GOFILE_API, form, {
            headers: form.getHeaders(),
            timeout: 600000
        });
        const link = res.data?.data?.downloadPage ?? null;
        if (!link) throw new Error(`unexpected gofile response`);
        console.log(`  [gofile] ${link}`);
        return link;
    });
}

async function uploadToFilebin(filePath, postId) {
    return withRetry('filebin', async () => {
        const bin      = `spt-${postId}`;
        const fileName = path.basename(filePath);
        // Fix #3: use a stream instead of readFileSync to avoid OOM on large files
        const fileData = fs.createReadStream(filePath);
        const fileSize = fs.statSync(filePath).size;
        const res = await axios.post(
            `${process.env.FILEBIN_API}/${bin}/${fileName}`,
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
        const link = `${process.env.FILEBIN_API}/${bin}/${fileName}`;
        console.log(`  [filebin] ${link}`);
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
        // Response is JSON: { files: [{ url: "https://..." }] } or { url: "..." }
        const link = res.data?.files?.[0]?.url ?? res.data?.url ?? null;
        if (!link) throw new Error(`unexpected fileditch response: ${JSON.stringify(res.data)}`);
        console.log(`  [fileditch] ${link}`);
        return link;
    });
}

async function upvotePost(postId) {
    const params = new URLSearchParams();
    params.append('id', String(postId));
    params.append('type', 'true');
    params.append('direction', 'true');
    try {
        const res = await axios.post('https://api.scored.co/api/v2/action/vote', params, {
            headers: { ...scoredHeaders(), 'content-type': 'application/x-www-form-urlencoded' }
        });
        console.log(`  [upvote] Upvoted post ${postId} OK`);
        return res.data;
    } catch (e) {
        // Fix #10: log only status, not the full error object (which may contain request config + headers)
        console.error(`  [upvote] FAILED ${safeErrorMessage(e)}`);
        throw e;
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
        console.log(`  [comment] Posted OK — comment id: ${res.data?.comments?.[0]?.id}`);
        return res.data;
    } catch (e) {
        console.error(`  [comment] FAILED ${safeErrorMessage(e)}`);
        throw e;
    }
}

const scoredHeaders = (community = COMMUNITIES[0]) => ({
    'referer': `https://scored.co/c/${community}`,
    'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': process.env.USER_AGENT,
    'x-api-key': process.env.SCORED_API_KEY,
    'x-api-platform': 'Scored-Desktop',
    'x-api-secret': process.env.SCORED_API_SECRET,
    'x-xsrf-token': process.env.SCORED_XSRF_TOKEN
});

// --- Main Processor ---

async function processPost(post, community) {
    const postId    = post.id;
    const title     = post.title  ?? 'Unknown Title';
    const author    = post.author ?? 'Unknown';
    const videoLink = getVideoLink(post);

    console.log(`  Upvoting post...`);
    await upvotePost(postId);

    if (!videoLink) {
        console.log(`  [skip] Post ${postId} has no resolvable video link.`);
        return;
    }

    // Fix #1 & #7: validate before touching the filesystem or network
    let safeVideoLink;
    try {
        safeVideoLink = validateDownloadUrl(videoLink);
    } catch (e) {
        console.log(`  [skip] Post ${postId} rejected: ${e.message}`);
        return;
    }

    const tempPath = path.join(__dirname, `temp_${postId}_${Date.now()}.mp4`);

    try {
        let catboxLink = null, quaxLink = null, pixeldrainLink = null, buzzheavierLink = null;
        let vernLink = null, pomf2Link = null, videyLink = null, fileditchLink = null;

        // Check source to avoid redundant uploads.
        // new.fileditch.com: save original URL for the comment, still download & mirror elsewhere.
        if (safeVideoLink.includes('catbox.moe'))        catboxLink      = safeVideoLink;
        else if (safeVideoLink.includes('qu.ax'))         quaxLink        = safeVideoLink;
        else if (safeVideoLink.includes('videy.co'))      videyLink       = safeVideoLink;
        else if (safeVideoLink.includes('0.vern.cc'))     vernLink        = safeVideoLink;
        else if (safeVideoLink.includes('pomf2.lain.la')) pomf2Link       = safeVideoLink;
        else if (safeVideoLink.includes('pixeldrain.com'))pixeldrainLink  = safeVideoLink;
        else if (safeVideoLink.includes('buzzheavier.com'))buzzheavierLink = safeVideoLink;
        else if (safeVideoLink.includes('new.fileditch.com')) fileditchLink = safeVideoLink;

        let downloadUrl = safeVideoLink;

        // If the source link is a pixeldrain viewer link, convert it to the raw file API
        if (downloadUrl.includes('pixeldrain.com/u/')) {
            downloadUrl = downloadUrl.replace('/u/', '/api/file/');
        }

        console.log(`  Downloading for mirrors...`);
        await downloadVideo(downloadUrl, tempPath);

        console.log(`  Uploading mirrors...`);
        const uploads = await Promise.all([
            quaxLink        ? null : uploadToMirror('qu.ax', process.env.QUAX_API, tempPath),
            catboxLink      ? null : uploadToCatbox(tempPath),
            pixeldrainLink  ? null : uploadToPixeldrain(tempPath),
            buzzheavierLink ? null : uploadToBuzzheavier(tempPath),
            fileditchLink   ? null : uploadToFileditch(tempPath),
        ]);

        if (!quaxLink)        quaxLink        = uploads[0];
        if (!catboxLink)      catboxLink      = uploads[1];
        if (!pixeldrainLink)  pixeldrainLink  = uploads[2];
        if (!buzzheavierLink) buzzheavierLink = uploads[3];
        if (!fileditchLink)   fileditchLink   = uploads[4];

        // Fix #5: sanitize all URLs before embedding them in comment text
        const mirrorLines = [
            fileditchLink   ? `FileDitch: ${sanitizeUrl(fileditchLink)}`       : null,
            catboxLink      ? `Catbox: ${sanitizeUrl(catboxLink)}`             : null,
            quaxLink        ? `Qu.ax: ${sanitizeUrl(quaxLink)}`                : null,
            pixeldrainLink  ? `Pixeldrain: ${sanitizeUrl(pixeldrainLink)}`     : null,
            buzzheavierLink ? `BuzzHeavier: ${sanitizeUrl(buzzheavierLink)}`   : null,
            vernLink        ? `Vern: ${sanitizeUrl(vernLink)}`                 : null,
            pomf2Link       ? `Pomf2: ${sanitizeUrl(pomf2Link)}`               : null,
            videyLink       ? `Videy: ${sanitizeUrl(videyLink)}`               : null,
        ].filter(Boolean).join('\n');

        if (mirrorLines) {
            await postComment(postId, `**Backup Mirrors:**\n\n${mirrorLines}`, community);
        }

        // Fix #8: cap backups to MAX_BACKUPS entries to prevent unbounded growth
        const backups = loadJSONLenient(BACKUP_FILE);
        backups.push({
            timestamp: new Date().toISOString(),
            scored_post_id: postId,
            title, author,
            original_link: safeVideoLink,
            fileditch: fileditchLink, catbox: catboxLink, quax: quaxLink,
            pixeldrain: pixeldrainLink, buzzheavier: buzzheavierLink
        });
        if (backups.length > MAX_BACKUPS) backups.splice(0, backups.length - MAX_BACKUPS);
        saveJSONAtomic(BACKUP_FILE, backups);   // Fix #6: atomic write

        console.log(`  Done with post ${postId}`);
    } catch (err) {
        console.error(`  ERROR on post ${postId}: ${err.message}`);
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
}

async function fetchNewPosts(community) {
    console.log(`\n[${new Date().toISOString()}] Polling feed for c/${community}...`);
    try {
        const res = await withRetry('feed-fetch', () => axios.get(SCORED_FEED_API(community), { headers: scoredHeaders(community) }));
        if (!res) return [];

        const posts = res.data?.posts ?? [];
        // Fix #9: strict load — corrupted processed.json halts the bot
        const processed = new Set(loadProcessedStrict(PROCESSED_FILE));

        const newPosts = posts.filter(p => {
            if (processed.has(p.id)) return false;
            const link = getVideoLink(p);
            if (!link) return false;
            return !SKIP_DOMAINS.some(domain => link.includes(domain));
        });

        if (newPosts.length) {
            // Fix #6: re-read immediately before writing to minimise race window, then write atomically
            const currentProcessed = new Set(loadProcessedStrict(PROCESSED_FILE));
            newPosts.forEach(p => currentProcessed.add(p.id));
            saveJSONAtomic(PROCESSED_FILE, [...currentProcessed]);
        }
        return newPosts;
    } catch (err) {
        console.error(`Fetch failed: ${err.message}`);
        return [];
    }
}

let isFetching = false;
async function scheduledPoll() {
    setTimeout(scheduledPoll, POLL_INTERVAL_MS);
    if (isFetching) return;
    isFetching = true;
    try {
        for (const community of COMMUNITIES) {
            const newPosts = await fetchNewPosts(community);
            for (const post of newPosts) {
                console.log(`\nProcessing post ${post.id} (c/${community}): "${post.title}"`);
                await processPost(post, community);
            }
        }
    } finally {
        isFetching = false;
    }
}

// Cleanup and Start
const leftoverTemps = fs.readdirSync(__dirname).filter(f => f.startsWith('temp_') && f.endsWith('.mp4'));
leftoverTemps.forEach(f => fs.unlinkSync(path.join(__dirname, f)));

console.log('Bot started. Polling every', POLL_INTERVAL_MS / 1000, 'seconds.');
scheduledPoll();