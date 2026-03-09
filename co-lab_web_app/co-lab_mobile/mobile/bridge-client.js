/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Co-LAB Mobile — Cloud Bridge Client                        ║
 * ║  Runs on the phone, routes tasks to the Oracle Cloud VM     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * The bridge client provides a local HTTP API on the phone that
 * Claude Code and Co-LAB scripts can call. Tasks that need cloud
 * resources (browser automation, heavy builds, web scraping with
 * JS rendering) are forwarded to the cloud bridge server.
 *
 * Local API → Bridge Client → Cloud Bridge Server → Result
 */

import http from 'node:http';
import https from 'node:https';

// ── Configuration ──
const CONFIG = {
    localPort: parseInt(process.env.BRIDGE_LOCAL_PORT || '18789'),
    cloudUrl: process.env.CLOUD_BRIDGE_URL || '',
    cloudSecret: process.env.CLOUD_BRIDGE_SECRET || '',
    maxRetries: 3,
    retryDelay: 2000,     // ms
    requestTimeout: 60000, // ms
};

// ── Logging ──
const log = {
    info: (msg) => console.log(`\x1b[36m[BRIDGE]\x1b[0m ${msg}`),
    ok: (msg) => console.log(`\x1b[32m[BRIDGE]\x1b[0m ${msg}`),
    warn: (msg) => console.log(`\x1b[33m[BRIDGE]\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[BRIDGE]\x1b[0m ${msg}`),
};

// ── Task Routing Rules ──
// Tasks that MUST go to cloud (can't run on mobile)
const CLOUD_ONLY_TASKS = [
    'browser/scrape',
    'browser/screenshot',
    'browser/automate',
    'build/npm',
    'build/docker',
    'search/web',
    'image/generate',
    'test/e2e',
    'pdf/generate',
];

// Tasks that run locally (phone can handle these)
const LOCAL_TASKS = [
    'file/read',
    'file/write',
    'file/list',
    'git/status',
    'git/diff',
    'git/commit',
    'lint/run',
    'test/unit',
    'db/query',
];

// ── Cloud Request Forwarder ──
async function forwardToCloud(path, method, body) {
    if (!CONFIG.cloudUrl) {
        throw new Error('CLOUD_BRIDGE_URL not configured');
    }

    const url = new URL(path, CONFIG.cloudUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const bodyStr = body ? JSON.stringify(body) : null;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.cloudSecret}`,
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
            },
            timeout: CONFIG.requestTimeout,
        };

        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(data),
                    });
                } catch {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data,
                    });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

// ── Retry Wrapper ──
async function forwardWithRetry(path, method, body) {
    let lastError;
    for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
        try {
            return await forwardToCloud(path, method, body);
        } catch (err) {
            lastError = err;
            log.warn(`Attempt ${attempt}/${CONFIG.maxRetries} failed: ${err.message}`);
            if (attempt < CONFIG.maxRetries) {
                await new Promise(r => setTimeout(r, CONFIG.retryDelay * attempt));
            }
        }
    }
    throw lastError;
}

// ── Local Task Handlers ──
const localHandlers = {
    'file/read': async (body) => {
        const { readFile } = await import('node:fs/promises');
        const content = await readFile(body.path, 'utf-8');
        return { success: true, content };
    },

    'file/write': async (body) => {
        const { writeFile, mkdir } = await import('node:fs/promises');
        const { dirname } = await import('node:path');
        await mkdir(dirname(body.path), { recursive: true });
        await writeFile(body.path, body.content, 'utf-8');
        return { success: true, path: body.path };
    },

    'file/list': async (body) => {
        const { readdir, stat } = await import('node:fs/promises');
        const { join } = await import('node:path');
        const entries = await readdir(body.path, { withFileTypes: true });
        const results = await Promise.all(
            entries.map(async (e) => {
                const full = join(body.path, e.name);
                const s = await stat(full).catch(() => null);
                return {
                    name: e.name,
                    isDir: e.isDirectory(),
                    size: s?.size || 0,
                };
            })
        );
        return { success: true, entries: results };
    },

    'git/status': async (body) => {
        const { execSync } = await import('node:child_process');
        const output = execSync('git status --porcelain', {
            cwd: body.path || '/root/workspace',
            encoding: 'utf-8',
        });
        return { success: true, output };
    },

    'git/diff': async (body) => {
        const { execSync } = await import('node:child_process');
        const output = execSync(`git diff ${body.args || ''}`, {
            cwd: body.path || '/root/workspace',
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        });
        return { success: true, output };
    },
};

// ── Request Router ──
function routeTask(taskPath) {
    // Check if it's a cloud-only task
    if (CLOUD_ONLY_TASKS.some(t => taskPath.includes(t))) {
        return 'cloud';
    }
    // Check if it's a local task
    if (LOCAL_TASKS.some(t => taskPath.includes(t))) {
        return 'local';
    }
    // Default: try cloud, fall back to error
    return 'cloud';
}

// ── HTTP Server ──
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${CONFIG.localPort}`);
    const path = url.pathname;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Parse body
    let body = null;
    if (req.method === 'POST') {
        body = await new Promise((resolve) => {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(data); }
            });
        });
    }

    // Health check
    if (path === '/health') {
        const cloudStatus = CONFIG.cloudUrl
            ? await forwardToCloud('/health', 'GET', null).then(() => 'connected').catch(() => 'disconnected')
            : 'not configured';

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            device: 'mobile',
            cloud: cloudStatus,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        }));
        return;
    }

    // Route decision
    if (path.startsWith('/api/')) {
        const taskPath = path.replace('/api/', '');
        const destination = routeTask(taskPath);

        try {
            let result;
            if (destination === 'local' && localHandlers[taskPath]) {
                log.info(`LOCAL  ${taskPath}`);
                result = await localHandlers[taskPath](body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } else if (destination === 'cloud') {
                log.info(`CLOUD  ${taskPath}`);
                const cloudResult = await forwardWithRetry(path, req.method, body);
                res.writeHead(cloudResult.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(cloudResult.body));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Unknown task: ${taskPath}` }));
            }
        } catch (err) {
            log.error(`${taskPath}: ${err.message}`);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: err.message,
                destination,
                hint: destination === 'cloud'
                    ? 'Cloud bridge may be unreachable. Check CLOUD_BRIDGE_URL.'
                    : 'Local handler failed.',
            }));
        }
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path }));
});

// ── Start ──
server.listen(CONFIG.localPort, '127.0.0.1', () => {
    log.ok(`Bridge client running on http://127.0.0.1:${CONFIG.localPort}`);
    log.info(`Cloud bridge: ${CONFIG.cloudUrl || 'NOT CONFIGURED'}`);
    log.info(`Cloud tasks: ${CLOUD_ONLY_TASKS.join(', ')}`);
    log.info(`Local tasks: ${LOCAL_TASKS.join(', ')}`);
});

// ── Graceful Shutdown ──
process.on('SIGINT', () => {
    log.info('Shutting down...');
    server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
    log.info('Shutting down...');
    server.close(() => process.exit(0));
});
