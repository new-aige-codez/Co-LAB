/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Co-LAB Mobile — Cloud Bridge Server                        ║
 * ║  Runs on Oracle Cloud VM, handles tasks the phone can't     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Endpoints:
 *   GET  /health                  — Server status
 *   POST /api/browser/scrape      — Scrape URL with Playwright
 *   POST /api/browser/screenshot  — Take page screenshot
 *   POST /api/browser/automate    — Run automation script
 *   POST /api/build/npm           — Run npm build
 *   POST /api/search/web          — Web search
 *   POST /api/image/generate      — AI image generation
 *   POST /api/test/e2e            — Run E2E tests
 *   POST /api/pdf/generate        — Generate PDF from HTML
 */

import http from 'node:http';
import { execSync, exec } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

// ── Configuration ──
const PORT = parseInt(process.env.BRIDGE_PORT || '18790');
const SECRET = process.env.BRIDGE_SECRET || '';
const WORKSPACE = process.env.BRIDGE_WORKSPACE || '/tmp/colab-bridge';
const MAX_BODY_SIZE = 50 * 1024 * 1024; // 50MB

// ── Logging ──
const log = {
    info: (msg) => console.log(`\x1b[36m[BRIDGE-SERVER]\x1b[0m ${new Date().toISOString()} ${msg}`),
    ok: (msg) => console.log(`\x1b[32m[BRIDGE-SERVER]\x1b[0m ${new Date().toISOString()} ${msg}`),
    warn: (msg) => console.log(`\x1b[33m[BRIDGE-SERVER]\x1b[0m ${new Date().toISOString()} ${msg}`),
    error: (msg) => console.error(`\x1b[31m[BRIDGE-SERVER]\x1b[0m ${new Date().toISOString()} ${msg}`),
};

// ── Auth Middleware ──
function authenticate(req) {
    if (!SECRET) return true; // No secret configured = open (dev only)
    const auth = req.headers['authorization'] || '';
    return auth === `Bearer ${SECRET}`;
}

// ── Playwright Browser Pool ──
let browser = null;

async function getBrowser() {
    if (browser) return browser;
    try {
        const { chromium } = await import('playwright');
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        });
        log.ok('Playwright browser launched');
        return browser;
    } catch (err) {
        log.error(`Playwright not available: ${err.message}`);
        throw new Error('Playwright not installed. Run: npx playwright install chromium');
    }
}

// ── Route Handlers ──

const handlers = {
    // ── Browser Automation ──

    'browser/scrape': async (body) => {
        const { url, selector, waitFor, timeout = 30000 } = body;
        if (!url) throw new Error('url is required');

        const b = await getBrowser();
        const page = await b.newPage();

        try {
            await page.goto(url, { timeout, waitUntil: 'networkidle' });

            if (waitFor) {
                await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => { });
            }

            let content;
            if (selector) {
                const el = await page.$(selector);
                content = el ? await el.textContent() : null;
            } else {
                content = await page.content();
            }

            const title = await page.title();

            return {
                success: true,
                url,
                title,
                content,
                timestamp: new Date().toISOString(),
            };
        } finally {
            await page.close();
        }
    },

    'browser/screenshot': async (body) => {
        const { url, fullPage = true, width = 1280, height = 720, timeout = 30000 } = body;
        if (!url) throw new Error('url is required');

        const b = await getBrowser();
        const page = await b.newPage();

        try {
            await page.setViewportSize({ width, height });
            await page.goto(url, { timeout, waitUntil: 'networkidle' });

            const buffer = await page.screenshot({ fullPage, type: 'png' });
            const base64 = buffer.toString('base64');

            return {
                success: true,
                url,
                format: 'png',
                base64,
                size: buffer.length,
                timestamp: new Date().toISOString(),
            };
        } finally {
            await page.close();
        }
    },

    'browser/automate': async (body) => {
        const { url, script, timeout = 60000 } = body;
        if (!url || !script) throw new Error('url and script are required');

        const b = await getBrowser();
        const page = await b.newPage();

        try {
            await page.goto(url, { timeout, waitUntil: 'networkidle' });

            // Execute the provided script in the page context
            const result = await page.evaluate(script);

            return {
                success: true,
                url,
                result,
                timestamp: new Date().toISOString(),
            };
        } finally {
            await page.close();
        }
    },

    // ── Build Operations ──

    'build/npm': async (body) => {
        const { command = 'npm run build', cwd, env = {} } = body;

        // Sanitize command — only allow npm/npx
        if (!command.startsWith('npm') && !command.startsWith('npx')) {
            throw new Error('Only npm/npx commands are allowed');
        }

        const taskId = randomUUID().slice(0, 8);
        const buildDir = join(WORKSPACE, `build-${taskId}`);
        await mkdir(buildDir, { recursive: true });

        const workDir = cwd || buildDir;

        return new Promise((resolveHandler, rejectHandler) => {
            const child = exec(command, {
                cwd: workDir,
                env: { ...process.env, ...env },
                maxBuffer: 50 * 1024 * 1024,
                timeout: 300000, // 5 min max
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => { stdout += data; });
            child.stderr.on('data', (data) => { stderr += data; });

            child.on('close', (code) => {
                resolveHandler({
                    success: code === 0,
                    taskId,
                    exitCode: code,
                    stdout: stdout.slice(-10000), // Last 10KB
                    stderr: stderr.slice(-5000),  // Last 5KB
                    timestamp: new Date().toISOString(),
                });
            });

            child.on('error', (err) => {
                rejectHandler(err);
            });
        });
    },

    // ── Web Search ──

    'search/web': async (body) => {
        const { query, maxResults = 5 } = body;
        if (!query) throw new Error('query is required');

        // Use DuckDuckGo Lite (no API key needed)
        const b = await getBrowser();
        const page = await b.newPage();

        try {
            const searchUrl = `https://lite.duckduckgo.com/lite?q=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { timeout: 15000, waitUntil: 'domcontentloaded' });

            const results = await page.evaluate((max) => {
                const links = document.querySelectorAll('a.result-link, td a[href^="http"]');
                const snippets = document.querySelectorAll('.result-snippet, td.result-snippet');
                const items = [];

                for (let i = 0; i < Math.min(links.length, max); i++) {
                    items.push({
                        title: links[i]?.textContent?.trim() || '',
                        url: links[i]?.href || '',
                        snippet: snippets[i]?.textContent?.trim() || '',
                    });
                }
                return items;
            }, maxResults);

            return {
                success: true,
                query,
                results,
                count: results.length,
                timestamp: new Date().toISOString(),
            };
        } finally {
            await page.close();
        }
    },

    // ── Image Generation ──

    'image/generate': async (body) => {
        const { prompt, provider = 'placeholder', width = 512, height = 512 } = body;
        if (!prompt) throw new Error('prompt is required');

        // Placeholder: returns a simple SVG placeholder
        // In production, integrate with DALL-E, Stable Diffusion API, etc.
        if (provider === 'placeholder') {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <rect width="100%" height="100%" fill="#1f2937"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f97316" font-size="16" font-family="monospace">
                    ${prompt.slice(0, 40)}
                </text>
            </svg>`;

            return {
                success: true,
                prompt,
                provider,
                format: 'svg',
                content: svg,
                timestamp: new Date().toISOString(),
            };
        }

        throw new Error(`Unknown image provider: ${provider}`);
    },

    // ── E2E Testing ──

    'test/e2e': async (body) => {
        const { url, tests } = body;
        if (!url || !tests) throw new Error('url and tests array are required');

        const b = await getBrowser();
        const page = await b.newPage();
        const results = [];

        try {
            await page.goto(url, { timeout: 30000, waitUntil: 'networkidle' });

            for (const test of tests) {
                try {
                    const { name, selector, action, expected } = test;

                    if (action === 'exists') {
                        const el = await page.$(selector);
                        results.push({ name, passed: !!el, selector });
                    } else if (action === 'text') {
                        const el = await page.$(selector);
                        const text = el ? await el.textContent() : null;
                        results.push({ name, passed: text?.includes(expected), actual: text });
                    } else if (action === 'click') {
                        await page.click(selector);
                        results.push({ name, passed: true });
                    }
                } catch (testErr) {
                    results.push({ name: test.name, passed: false, error: testErr.message });
                }
            }

            return {
                success: true,
                url,
                total: tests.length,
                passed: results.filter(r => r.passed).length,
                failed: results.filter(r => !r.passed).length,
                results,
                timestamp: new Date().toISOString(),
            };
        } finally {
            await page.close();
        }
    },

    // ── PDF Generation ──

    'pdf/generate': async (body) => {
        const { html, url, options = {} } = body;
        if (!html && !url) throw new Error('html or url is required');

        const b = await getBrowser();
        const page = await b.newPage();

        try {
            if (url) {
                await page.goto(url, { timeout: 30000, waitUntil: 'networkidle' });
            } else {
                await page.setContent(html, { waitUntil: 'networkidle' });
            }

            const buffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
                ...options,
            });

            return {
                success: true,
                format: 'pdf',
                base64: buffer.toString('base64'),
                size: buffer.length,
                timestamp: new Date().toISOString(),
            };
        } finally {
            await page.close();
        }
    },
};

// ── HTTP Server ──
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
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

    // Auth check (except health)
    if (path !== '/health' && !authenticate(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    // Parse body
    let body = null;
    if (req.method === 'POST') {
        body = await new Promise((resolve, reject) => {
            let data = '';
            let size = 0;
            req.on('data', (chunk) => {
                size += chunk.length;
                if (size > MAX_BODY_SIZE) {
                    reject(new Error('Body too large'));
                    return;
                }
                data += chunk;
            });
            req.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve(data); }
            });
            req.on('error', reject);
        });
    }

    // ── Health ──
    if (path === '/health') {
        const memUsage = process.memoryUsage();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            server: 'cloud-bridge',
            uptime: process.uptime(),
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
                rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
            },
            browser: browser ? 'active' : 'not started',
            endpoints: Object.keys(handlers).map(k => `/api/${k}`),
            timestamp: new Date().toISOString(),
        }));
        return;
    }

    // ── API Routes ──
    if (path.startsWith('/api/')) {
        const taskPath = path.replace('/api/', '');
        const handler = handlers[taskPath];

        if (!handler) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: `Unknown endpoint: ${taskPath}`,
                available: Object.keys(handlers),
            }));
            return;
        }

        log.info(`${req.method} ${path}`);
        const startTime = Date.now();

        try {
            const result = await handler(body || {});
            const elapsed = Date.now() - startTime;
            log.ok(`${path} — ${elapsed}ms`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (err) {
            const elapsed = Date.now() - startTime;
            log.error(`${path} — ${elapsed}ms — ${err.message}`);

            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: err.message,
                endpoint: taskPath,
                timestamp: new Date().toISOString(),
            }));
        }
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

// ── Startup ──
await mkdir(WORKSPACE, { recursive: true });

server.listen(PORT, '0.0.0.0', () => {
    log.ok(`Cloud bridge server running on http://0.0.0.0:${PORT}`);
    log.info(`Auth: ${SECRET ? 'ENABLED' : 'DISABLED (set BRIDGE_SECRET)'}`);
    log.info(`Workspace: ${WORKSPACE}`);
    log.info(`Endpoints: ${Object.keys(handlers).map(k => `/api/${k}`).join(', ')}`);
});

// ── Graceful Shutdown ──
async function shutdown() {
    log.info('Shutting down...');
    if (browser) {
        await browser.close();
        log.info('Browser closed');
    }
    server.close(() => {
        log.ok('Server stopped');
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
