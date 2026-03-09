# Co-LAB Mobile — Hybrid Mobile-Cloud System

Run Claude Code and Co-LAB on your Android phone with cloud bridge support for heavy tasks.

## Architecture

```
┌────────────────────────────────────────┐       ┌────────────────────────────────┐
│          ANDROID PHONE                 │       │       ORACLE CLOUD VM          │
│                                        │       │                                │
│  ┌──────────────────────────────────┐  │       │  ┌──────────────────────────┐  │
│  │  tmux session: colab             │  │       │  │  Bridge Server           │  │
│  │  ├─ infra (API + bridge + htop)  │  │       │  │  ├─ /api/browser/scrape  │  │
│  │  ├─ claude (instance 1 & 2)     │  │  ───► │  │  ├─ /api/browser/screenshot│
│  │  ├─ work (dev terminal)         │  │       │  │  ├─ /api/build/npm       │  │
│  │  └─ logs (tail)                 │  │       │  │  ├─ /api/search/web      │  │
│  └──────────────────────────────────┘  │       │  │  ├─ /api/test/e2e        │  │
│                                        │       │  │  └─ /api/pdf/generate    │  │
│  Bridge Client (port 18789)            │       │  └──────────────────────────┘  │
│  ├─ Routes local tasks → filesystem    │       │                                │
│  └─ Routes cloud tasks → Bridge Server │       │  Playwright + Chromium         │
│                                        │       │                                │
│  Termux → proot-distro → Ubuntu 22.04  │       │  Ubuntu 22.04 (ARM)            │
│  Node.js 20 + Claude Code + Python 3   │       │  Node.js 20                    │
└────────────────────────────────────────┘       └────────────────────────────────┘
```

## Task Routing

| Runs Locally (Phone) | Offloaded to Cloud |
|---|---|
| File read/write/list | Browser scraping (Playwright) |
| Git status/diff/commit | Screenshots |
| Code linting/formatting | npm builds (heavy) |
| Unit tests | E2E tests |
| SQLite queries | Web search (JS rendering) |
| Claude Code prompts | PDF generation |

## Quick Start

### Prerequisites

- **Android phone** with 4+ GB RAM (8+ GB recommended)
- **Termux** installed from [F-Droid](https://f-droid.org/packages/com.termux/) (NOT the Play Store)
- **Termux:API** installed from [F-Droid](https://f-droid.org/packages/com.termux.api/)
- **Oracle Cloud VM** (optional, for cloud bridge features)

### Phone Setup (3 phases)

```bash
# Clone or copy co-lab_mobile to your phone
# Then run each phase in order:

# Phase 0: Termux foundation (run in Termux)
bash co-lab_mobile/mobile/00-setup-termux.sh

# Phase 1: Ubuntu in proot (run in Termux)
bash co-lab_mobile/mobile/01-setup-proot.sh

# Phase 2: Project setup (run inside proot — enter with ~/ubuntu)
~/ubuntu
bash /root/workspace/co-lab_mobile/mobile/02-setup-project.sh
```

### Configure API Keys

```bash
# Inside proot:
vim /root/.colab/config/.env

# At minimum, set:
# ANTHROPIC_API_KEY=sk-ant-...
```

### Start Services

```bash
# Inside proot:
colab-start
```

This creates a tmux session with 4 windows:
- **infra** — Backend API, cloud bridge, system monitor
- **claude** — Claude Code instances (1 & 2)
- **work** — General development terminal
- **logs** — Live log viewer

### Cloud Server Setup (Optional)

```bash
# On your Oracle Cloud VM:
cd co-lab_mobile/cloud
npm install
npm run install-browser    # Installs Chromium for Playwright
BRIDGE_SECRET="your-secret" npm start
```

Then set in your phone's `.env`:
```
CLOUD_BRIDGE_URL=http://your-oracle-vm-ip:18790
CLOUD_BRIDGE_SECRET=your-secret
```

## Daily Usage

### Service Commands

| Command | Description |
|---|---|
| `colab-start` | Start all services in tmux |
| `colab-stop` | Stop all services |
| `colab-status` / `cls` | System status dashboard |
| `colab-help` | Show all available commands |

### Claude Code

| Command | Description |
|---|---|
| `cc` | Start Claude Code (skip permissions) |
| `cc1` | Claude instance 1 (isolated config) |
| `cc2` | Claude instance 2 (isolated config) |
| `claude-task 'prompt'` | One-shot Claude prompt |

### Cloud Bridge

| Command | Description |
|---|---|
| `cloud-health` | Check bridge connection |
| `cloud-scrape URL` | Scrape a webpage via cloud |
| `cloud-screenshot URL` | Screenshot via cloud |
| `cloud-build path` | Offload npm build to cloud |

### File Transfer

| Command | Description |
|---|---|
| `push-to-android file` | Copy file to /sdcard/CoLab/ |
| `pull-from-android file` | Copy file from /sdcard/ |

### Clipboard

| Command | Description |
|---|---|
| `clip-copy text` | Copy to Android clipboard |
| `clip-paste` | Paste from Android clipboard |

### Notifications

| Command | Description |
|---|---|
| `notify "title" "message"` | Send Android notification |
| `long-command ; alert "done"` | Notify when command finishes |

## tmux Controls

| Key | Action |
|---|---|
| `Ctrl+B, d` | Detach (session keeps running) |
| `tmux a` | Re-attach to session |
| `Alt+1-4` | Switch windows (no prefix) |
| `Ctrl+Arrow` | Switch panes |
| `Ctrl+B, z` | Zoom/unzoom pane (fullscreen toggle) |
| `Ctrl+B, \|` | Split pane horizontally |
| `Ctrl+B, -` | Split pane vertically |
| Touch/scroll | Scroll in panes (mouse mode on) |

## Android Optimization

### Battery

1. Go to **Settings → Apps → Termux → Battery**
2. Set to **Unrestricted**
3. The `termux-wake-lock` runs automatically to prevent doze

### Keyboard

Install one of these for better terminal input:
- **Hacker's Keyboard** — Full PC keyboard layout
- **Unexpected Keyboard** — Compact with all modifier keys

### Storage

- Projects are stored in **proot** at `/root/workspace`
- Use `push-to-android` / `pull-from-android` to transfer files to/from Android's shared storage
- `/mnt/sdcard` is bind-mounted if storage access was granted

### Memory Management

- Node.js is limited to 512MB by default (`NODE_OPTIONS`)
- Run `colab-mem` to check process memory usage
- Run `colab-emergency-gc` to kill the heaviest Node process if the phone becomes sluggish
- Keep `MAX_CLAUDE_INSTANCES=2` or lower for phones with less than 8GB RAM

## Cloud Bridge API Reference

All endpoints require `Authorization: Bearer <secret>` header.

### `GET /health`
Returns server status, memory usage, and available endpoints.

### `POST /api/browser/scrape`
```json
{ "url": "https://example.com", "selector": ".content", "waitFor": "#loaded" }
```

### `POST /api/browser/screenshot`
```json
{ "url": "https://example.com", "fullPage": true, "width": 1280, "height": 720 }
```
Returns base64-encoded PNG.

### `POST /api/build/npm`
```json
{ "command": "npm run build", "cwd": "/path/to/project" }
```

### `POST /api/search/web`
```json
{ "query": "react hooks tutorial", "maxResults": 5 }
```

### `POST /api/test/e2e`
```json
{
  "url": "http://localhost:3000",
  "tests": [
    { "name": "title exists", "selector": "h1", "action": "exists" },
    { "name": "has text", "selector": ".hero", "action": "text", "expected": "Welcome" }
  ]
}
```

### `POST /api/pdf/generate`
```json
{ "url": "https://example.com" }
```
Returns base64-encoded PDF.

### `POST /api/image/generate`
```json
{ "prompt": "a futuristic dashboard", "width": 512, "height": 512 }
```

## Troubleshooting

### "Claude Code not found"
```bash
npm install -g @anthropic-ai/claude-code
```

### "Bridge connection failed"
1. Check your Oracle VM security list allows port 18790
2. Verify `CLOUD_BRIDGE_URL` in `.env` is correct
3. Run `cloud-health` to test connectivity

### "Out of memory"
1. Run `colab-mem` to see what's using RAM
2. Reduce `MAX_CLAUDE_INSTANCES` to 1
3. Lower `NODE_MEMORY_LIMIT` to 256
4. Run `colab-emergency-gc` as a last resort

### "Termux keeps getting killed"
1. Set battery optimization to Unrestricted
2. Ensure `termux-wake-lock` is running (check notification bar)
3. Disable battery saver mode
4. Lock Termux in recents (long-press → lock icon on some phones)

### "Can't access /sdcard"
```bash
# In Termux (not proot):
termux-setup-storage
# Grant the permission when prompted
```

## File Structure

```
co-lab_mobile/
├── mobile/                          # Runs on phone
│   ├── 00-setup-termux.sh          # Phase 0: Termux foundation
│   ├── 01-setup-proot.sh           # Phase 1: Ubuntu in proot
│   ├── 02-setup-project.sh         # Phase 2: Project setup
│   ├── colab-start.sh              # Start all services
│   ├── colab-stop.sh               # Stop all services
│   ├── colab-status.sh             # Check status
│   ├── colab-helpers.sh            # Shell helper functions
│   ├── tmux.conf                   # tmux config
│   └── bridge-client.js            # Cloud bridge client
│
├── cloud/                           # Runs on Oracle Cloud
│   ├── bridge-server.js            # Main bridge server
│   └── package.json                # Dependencies
│
├── shared/                          # Configuration
│   ├── config.json                 # Task routing rules
│   └── .env.template               # Environment template
│
└── docs/
    └── README.md                   # This file
```
