const { protocol, net, session, ipcMain } = require('electron');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

const SCHEME = 'msl-img';
const MAX_BYTES = 250 * 1024 * 1024;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const IMAGE_EXT = new Set(['avif', 'gif', 'jpg', 'jpeg', 'png', 'svg', 'webp']);
const PROTECTED_EXT = /\.(pdf|mp4|m4v|mov|webm|mkv|avi|m3u8|ts|mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i;

const allowedHosts = new Set([
    'mslbucketmain.s3.amazonaws.com',
    'mslelearning.com',
]);

let cacheDir = '';
let manifestPath = '';
let manifest = { entries: {} };
let tail = Promise.resolve();
const inflight = new Map();
let flushTimer = null;
let installed = false;

function registerImageCacheScheme() {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: SCHEME,
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
                corsEnabled: true,
                stream: true,
            },
        },
    ]);
}

function exclusive(task) {
    const run = tail.then(task, task);
    tail = run.then(
        () => undefined,
        () => undefined
    );
    return run;
}

function hostAllowed(hostname) {
    const host = String(hostname || '').toLowerCase();
    if (!host) return false;
    if (allowedHosts.has(host)) return true;
    if (host.endsWith('.s3.amazonaws.com')) return true;
    if (host.endsWith('.amazonaws.com') && host.includes('.s3.')) return true;
    if (host.endsWith('.cloudfront.net')) return true;
    if (host === 'mslelearning.com' || host.endsWith('.mslelearning.com')) return true;
    return false;
}

function allowOrigin(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:') return false;
        allowedHosts.add(url.hostname.toLowerCase());
        return true;
    } catch {
        return false;
    }
}

function extensionOf(remoteUrl) {
    try {
        const pathname = new URL(remoteUrl).pathname;
        const match = pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
        return match ? match[1] : '';
    } catch {
        return '';
    }
}

function cacheKey(remoteUrl) {
    const url = new URL(remoteUrl);
    const stable = `${url.origin}${url.pathname}`;
    return crypto.createHash('sha256').update(stable).digest('hex');
}

function fileFor(hash, ext) {
    return path.join(cacheDir, hash.slice(0, 2), `${hash}${ext ? `.${ext}` : ''}`);
}

function sniffImage(buf, ext) {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return 'image/jpeg';
    }
    if (buf.length >= 8 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') {
        return 'image/png';
    }
    if (buf.length >= 6) {
        const gif = buf.toString('ascii', 0, 6);
        if (gif === 'GIF87a' || gif === 'GIF89a') return 'image/gif';
    }
    if (
        buf.length >= 12 &&
        buf.toString('ascii', 0, 4) === 'RIFF' &&
        buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return 'image/webp';
    }
    if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
        const brand = buf.toString('ascii', 8, 12);
        if (brand === 'avif' || brand === 'avis') return 'image/avif';
    }
    if (ext === 'svg') {
        const head = buf.slice(0, 400).toString('utf8').trim().toLowerCase();
        if (head.startsWith('<svg') || head.includes('<svg')) return 'image/svg+xml';
    }
    return null;
}

function declaredImageType(header, ext) {
    const type = String(header || '').split(';')[0].trim().toLowerCase();
    if (type.startsWith('image/')) return type;
    if (type === 'application/octet-stream' || type === 'binary/octet-stream' || type === '') {
        return null;
    }
    if (ext === 'svg' && (type === 'text/plain' || type === 'text/xml' || type === 'application/xml')) {
        return 'image/svg+xml';
    }
    return false;
}

async function loadManifest() {
    try {
        const raw = await fsp.readFile(manifestPath, 'utf8');
        const parsed = JSON.parse(raw);
        manifest = parsed && parsed.entries ? parsed : { entries: {} };
    } catch {
        manifest = { entries: {} };
    }
}

function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
        flushTimer = null;
        exclusive(() => fsp.writeFile(manifestPath, JSON.stringify(manifest))).catch(() => {});
    }, 1500);
}

async function removeEntry(hash) {
    const entry = manifest.entries[hash];
    if (!entry) return;
    delete manifest.entries[hash];
    if (entry.file) {
        await fsp.rm(entry.file, { force: true }).catch(() => {});
    }
}

async function ensureSpace(incomingBytes) {
    const now = Date.now();
    for (const hash of Object.keys(manifest.entries)) {
        const entry = manifest.entries[hash];
        if (!entry || now - entry.touched > MAX_AGE_MS) {
            await removeEntry(hash);
        }
    }
    let total = Object.values(manifest.entries).reduce((sum, entry) => sum + (entry.bytes || 0), 0);
    total += incomingBytes;
    const oldest = Object.entries(manifest.entries).sort((a, b) => a[1].touched - b[1].touched);
    for (const [hash, entry] of oldest) {
        if (total <= MAX_BYTES) break;
        total -= entry.bytes || 0;
        await removeEntry(hash);
    }
}

function notImage() {
    const error = new Error('Not an image');
    error.code = 'NOT_IMAGE';
    return error;
}

async function download(remoteUrl, hash, ext) {
    const response = await net.fetch(remoteUrl);
    if (!response.ok) {
        throw new Error(`Image request failed (${response.status})`);
    }
    const finalUrl = response.url ? new URL(response.url) : new URL(remoteUrl);
    if (finalUrl.protocol !== 'https:' || !hostAllowed(finalUrl.hostname)) {
        throw notImage();
    }
    const declared = declaredImageType(response.headers.get('content-type'), ext);
    if (declared === false) throw notImage();
    const buf = Buffer.from(await response.arrayBuffer());
    if (!buf.length || buf.length > MAX_FILE_BYTES) throw notImage();
    const contentType = sniffImage(buf, ext);
    if (!contentType) throw notImage();

    const dest = fileFor(hash, ext);
    await exclusive(async () => {
        await ensureSpace(buf.length);
        await fsp.mkdir(path.dirname(dest), { recursive: true });
        const temp = `${dest}.part`;
        await fsp.writeFile(temp, buf);
        await fsp.rename(temp, dest);
        manifest.entries[hash] = {
            file: dest,
            bytes: buf.length,
            touched: Date.now(),
            contentType,
        };
        await fsp.writeFile(manifestPath, JSON.stringify(manifest));
    });
    return manifest.entries[hash];
}

async function ensureCached(remoteUrl) {
    const ext = extensionOf(remoteUrl);
    if (!IMAGE_EXT.has(ext) || PROTECTED_EXT.test(remoteUrl)) throw notImage();
    const url = new URL(remoteUrl);
    if (url.protocol !== 'https:' || !hostAllowed(url.hostname)) {
        const error = new Error('Image host is not allowed');
        error.code = 'FORBIDDEN';
        throw error;
    }
    const hash = cacheKey(remoteUrl);
    const hit = manifest.entries[hash];
    if (hit && hit.file && Date.now() - hit.touched < MAX_AGE_MS && fs.existsSync(hit.file)) {
        hit.touched = Date.now();
        scheduleFlush();
        return hit;
    }
    if (inflight.has(hash)) return inflight.get(hash);
    const job = download(remoteUrl, hash, ext).finally(() => inflight.delete(hash));
    inflight.set(hash, job);
    return job;
}

function headerValue(headers, name) {
    if (!headers) return '';
    const raw = headers[name] || headers[name.toLowerCase()] || '';
    return Array.isArray(raw) ? raw.join(';') : String(raw);
}

function isProtectedMedia(url, contentType) {
    let pathname = '';
    try {
        pathname = new URL(url).pathname;
    } catch {
        return false;
    }
    if (PROTECTED_EXT.test(pathname)) return true;
    const type = String(contentType || '').toLowerCase();
    if (type.includes('application/pdf')) return true;
    if (type.startsWith('video/')) return true;
    if (type.startsWith('audio/')) return true;
    if (type.includes('mpegurl') || type.includes('apple.mpegurl')) return true;
    return false;
}

function blockProtectedMediaCache() {
    session.defaultSession.webRequest.onHeadersReceived(
        { urls: ['http://*/*', 'https://*/*'] },
        (details, callback) => {
            const headers = details.responseHeaders ? { ...details.responseHeaders } : {};
            const type = headerValue(headers, 'content-type') || headerValue(headers, 'Content-Type');
            if (!isProtectedMedia(details.url, type)) {
                callback({ responseHeaders: headers });
                return;
            }
            delete headers['cache-control'];
            delete headers['Cache-Control'];
            delete headers['pragma'];
            delete headers['Pragma'];
            headers['Cache-Control'] = ['no-store, no-cache, must-revalidate'];
            headers['Pragma'] = ['no-cache'];
            callback({ responseHeaders: headers });
        }
    );
}

function startImageCache(app) {
    if (installed) return;
    installed = true;
    cacheDir = path.join(app.getPath('userData'), 'img-cache');
    manifestPath = path.join(cacheDir, 'manifest.json');
    fs.mkdirSync(cacheDir, { recursive: true });

    ipcMain.handle('image-cache-allow-origin', (_event, origin) => allowOrigin(origin));
    blockProtectedMediaCache();

    const ready = loadManifest().catch(() => {
        manifest = { entries: {} };
    });

    protocol.handle(SCHEME, async (request) => {
        let remote = '';
        try {
            await ready;
            remote = new URL(request.url).searchParams.get('src') || '';
            const cached = await ensureCached(remote);
            const body = await fsp.readFile(cached.file);
            return new Response(body, {
                status: 200,
                headers: {
                    'Content-Type': cached.contentType || 'application/octet-stream',
                    'Cache-Control': 'private, max-age=86400',
                },
            });
        } catch (error) {
            const status = error && error.code === 'NOT_IMAGE' ? 415 : error && error.code === 'FORBIDDEN' ? 403 : 502;
            return new Response('Image unavailable', { status });
        }
    });
}

module.exports = {
    registerImageCacheScheme,
    startImageCache,
};
