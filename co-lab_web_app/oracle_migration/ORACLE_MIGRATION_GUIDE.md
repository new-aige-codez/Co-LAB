# Co-LAB Oracle Cloud Migration — Complete Guide

> **Purpose**: This folder contains everything needed to deploy the Co-LAB web app to Oracle Cloud Free Tier so teammates can register, log in, and collaborate in real-time. Hand this folder to another workspace/agent and it can execute the migration end-to-end.

---

## Folder Contents

```
oracle_migration/
├── ORACLE_MIGRATION_GUIDE.md    ← YOU ARE HERE (master guide)
├── deploy-oracle.sh             ← Automated server setup script
├── ecosystem.config.js          ← PM2 process manager config
├── nginx.conf.example           ← Nginx reverse proxy + SSL template
├── .env.example                 ← Environment variable template
├── MIGRATION.md                 ← DB migration docs (SQLite → PostgreSQL)
├── oracle_notes.txt             ← Quick-reference step-by-step notes
├── Dockerfile                   ← Docker build (alternative)
├── docker-compose.yml           ← Docker Compose (alternative)
├── fly.toml                     ← Fly.io config (alternative cloud)
└── realtime_additions/          ← Files modified for real-time collab
    ├── gateway_index.ts         ← Added broadcastProjectEvent()
    ├── server.ts                ← Added /api/projects CRUD routes
    ├── projectStore.ts          ← Rewritten: API-backed, not localStorage
    ├── useWebSocket.ts          ← Added project event dispatch
    └── AppShell.tsx             ← Added fetchProjects() on mount
```

---

## Tech Stack

| Layer | Tech | Details |
|-------|------|---------|
| Frontend | React + Vite + TypeScript | Built to `web/dist/` static files |
| Backend | Node.js + Hono + Drizzle ORM | API on port 3001, SQLite DB |
| Real-time | WebSocket (`ws` library) | `GatewayService` at `/ws` path |
| State | Zustand stores | `projectStore`, `taskStore`, `authStore`, etc. |
| Process mgr | PM2 | Keeps app alive, auto-restart, logs |
| Reverse proxy | Nginx | Serves static files + proxies API + WebSocket |
| SSL | Let's Encrypt / Certbot | Free auto-renewing certificates |
| VM | Oracle Cloud ARM A1 Flex | 4 CPU, 24GB RAM, 200GB disk — **free forever** |

---

## Pre-Requisites (Human Must Do)

1. **Create Oracle Cloud account** at [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. **Create VM Instance**: Compute → Instances → Create
   - Shape: `VM.Standard.A1.Flex` (ARM), 4 OCPU, 24GB RAM
   - OS: Ubuntu 22.04 Minimal (aarch64)
   - Boot volume: 200GB
   - Generate SSH key → download `.key` file
3. **Note the public IP address**
4. **Domain name** (optional but needed for HTTPS)

---

## Phase 1: Open Firewall Ports

### OCI Security List (cloud console)

Networking → VCN → Security Lists → Default → Add Ingress Rules:

| Port | Protocol | Source CIDR | Purpose |
|------|----------|-------------|---------|
| 22   | TCP      | 0.0.0.0/0   | SSH |
| 80   | TCP      | 0.0.0.0/0   | HTTP |
| 443  | TCP      | 0.0.0.0/0   | HTTPS |

### OS Firewall (run on VM after SSH)

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## Phase 2: Upload Code to VM

From your local machine:

```bash
# Upload the entire co-lab app
scp -i "path/to/your.key" -r "/path/to/co-lab_web_app" ubuntu@<IP>:~/co-lab

# Upload migration tooling
scp -i "path/to/your.key" -r "/path/to/oracle_migration" ubuntu@<IP>:~/oracle_migration

# SSH in
ssh -i "path/to/your.key" ubuntu@<IP>
```

OR clone from GitHub:
```bash
git clone https://github.com/your-repo/co-lab.git ~/co-lab
```

---

## Phase 3: Server Setup

Run the automated setup script OR do it manually:

### Option A: Automated (recommended)
```bash
cp ~/oracle_migration/deploy-oracle.sh ~/co-lab/
cp ~/oracle_migration/ecosystem.config.js ~/co-lab/
cd ~/co-lab
chmod +x deploy-oracle.sh
./deploy-oracle.sh setup
```

### Option B: Manual step-by-step
```bash
# System packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential python3 git curl wget sqlite3 nginx certbot python3-certbot-nginx

# Node.js 20 (ARM64)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2

# App dependencies
cd ~/co-lab
npm install
cd web && npm install && cd ..

# Build
npm run build           # backend: src/ → dist/
cd web && npm run build && cd ..  # frontend: → web/dist/

# Configure environment
cp .env.example .env
nano .env
# Fill in: JWT_SECRET, ENCRYPTION_KEY, ADMIN_PASSWORD
# Set: NODE_ENV=production, PORT=3001

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed sudo command
```

---

## Phase 4: Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/co-lab
```

Paste (replace `YOUR_DOMAIN` with domain or IP):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    # React static files
    root /home/ubuntu/co-lab/web/dist;
    index index.html;

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy (critical for real-time)
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;  # keep WS alive for 24h
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable:
```bash
sudo ln -sf /etc/nginx/sites-available/co-lab /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

**Test**: `curl http://<YOUR_IP>` — should return the React app HTML.

---

## Phase 5: HTTPS with Let's Encrypt

> Requires a domain name pointed to your VM IP (A record).

```bash
sudo certbot --nginx -d yourdomain.com
# Follow prompts — auto-configures HTTPS + redirect
sudo certbot renew --dry-run  # verify auto-renewal
```

---

## Phase 6: Enable Auth

Auth is currently bypassed in `web/src/App.tsx` for development. To require users to register/login:

1. Open `web/src/App.tsx`
2. Find and uncomment the `ProtectedRoute` and `ApiKeyCheck` auth logic
3. Rebuild frontend: `cd web && npm run build`
4. Restart: `pm2 restart all`

Auth API routes already exist:
- `POST /api/auth/register` — create account (email + password)
- `POST /api/auth/login` — get JWT token
- `GET /api/auth/me` — get current user

---

## Phase 7: CI/CD Auto-Deploy (Optional)

Create `.github/workflows/deploy.yml` in your repo:

```yaml
name: Deploy to Oracle Cloud
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.OCI_HOST }}
          username: ubuntu
          key: ${{ secrets.OCI_SSH_KEY }}
          script: |
            cd ~/co-lab
            git pull origin main
            npm install
            npm run build
            cd web && npm install && npm run build && cd ..
            pm2 restart all
```

Add **GitHub Secrets**: `OCI_HOST` (VM IP), `OCI_SSH_KEY` (private key contents).

---

## Real-Time Collaboration — What Was Built

The `realtime_additions/` folder contains 5 files that were modified to make projects shared (DB-backed) with live WebSocket push:

### Architecture
```
User A creates project → POST /api/projects → SQLite insert
                          ↓
                   gatewayService.broadcastProjectEvent('project.created', project)
                          ↓
                   WebSocket push → all connected clients
                          ↓
              User B's useWebSocket hook → projectStore._applyWebSocketEvent()
                          ↓
              User B's UI updates instantly
```

### Files Changed

| File | Where it goes | What changed |
|------|--------------|--------------|
| `gateway_index.ts` | `src/gateway/index.ts` | Added `broadcastProjectEvent()` method |
| `server.ts` | `src/web/server.ts` | Added `GET/POST/PUT/DELETE /api/projects` with WS broadcast |
| `projectStore.ts` | `web/src/store/projectStore.ts` | Rewrote from localStorage → API calls + `_applyWebSocketEvent()` |
| `useWebSocket.ts` | `web/src/hooks/useWebSocket.ts` | Added `project.created/updated/deleted` event dispatch |
| `AppShell.tsx` | `web/src/components/AppShell.tsx` | Added `fetchProjects()` on mount |

### Existing Infrastructure (no changes needed)
- **WebSocket Gateway**: `src/gateway/index.ts` — full auth, presence, heartbeats, task/agent broadcasts
- **DB Schema**: `src/db/schema.ts` — `projects`, `tasks`, `presence`, `users`, `workspaces` tables
- **Auth System**: Register/login/JWT in `src/web/server.ts` + `src/auth/`

---

## Environment Variables Reference

```env
# Required
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=<generate: openssl rand -hex 32>
ENCRYPTION_KEY=<generate: openssl rand -hex 32>
ADMIN_PASSWORD=<your admin password>
DATA_DIR=./data
```

---

## Verification Checklist

| # | Test | Command / Action |
|---|------|-----------------|
| 1 | VM running | OCI Console shows "Running" |
| 2 | SSH works | `ssh -i key ubuntu@IP` |
| 3 | Ports open | `curl http://IP` returns HTML |
| 4 | PM2 running | `pm2 status` shows "online" |
| 5 | API health | `curl http://IP/api/health` → `{"status":"ok"}` |
| 6 | Frontend loads | Browser → `http://IP` → Co-LAB UI |
| 7 | Auth works | Register + login via UI |
| 8 | WebSocket | Browser console shows `WebSocket connected` |
| 9 | Real-time sync | Open 2 tabs, create project in tab A → appears in tab B |
| 10 | HTTPS | `https://yourdomain.com` shows padlock |

---

## Cost

| Resource | Oracle Free Tier |
|----------|-----------------|
| ARM VM (4 CPU, 24GB RAM) | **$0 / forever** |
| 200GB boot disk | **$0 / forever** |
| 10TB outbound/month | **$0 / forever** |
| SSL certificate | **$0** (Let's Encrypt) |
| Domain name | **$0–$10/yr** |

---

## Rollback

- App crashes: `pm2 logs` to diagnose, `pm2 restart all`
- Nginx broken: `sudo nginx -t` to find error
- Revert to local: just `npm run dev` locally — same codebase
- Switch cloud: This stack works on any Ubuntu VPS (DigitalOcean, Linode, AWS, etc.)
