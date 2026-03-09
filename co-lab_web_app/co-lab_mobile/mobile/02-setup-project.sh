#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Co-LAB Mobile — Phase 2: Project Setup                     ║
# ║  Run this THIRD — inside proot (after running ~/ubuntu)     ║
# ╚══════════════════════════════════════════════════════════════╝

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

COLAB_DIR="/root/.colab"
WORKSPACE_DIR="/root/workspace"
MOBILE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Co-LAB Mobile Setup — Phase 2: Project Setup  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Verify we're inside proot ──
log_info "Checking environment..."
if [ "$(whoami)" != "root" ]; then
    log_error "This script must run inside proot. Enter with: ~/ubuntu"
    exit 1
fi

if ! command -v node &>/dev/null; then
    log_error "Node.js not found. Run 01-setup-proot.sh first."
    exit 1
fi
log_ok "Running inside proot as root"

# ── Step 2: Set up environment file ──
log_info "Configuring environment..."
ENV_FILE="$COLAB_DIR/config/.env"

if [ ! -f "$ENV_FILE" ]; then
    SHARED_DIR="$(dirname "$MOBILE_DIR")/../shared"
    if [ -f "$SHARED_DIR/.env.template" ]; then
        cp "$SHARED_DIR/.env.template" "$ENV_FILE"
        log_ok "Created .env from template at $ENV_FILE"
    else
        cat > "$ENV_FILE" << 'ENVFILE'
# ╔══════════════════════════════════════════════╗
# ║  Co-LAB Mobile Environment Configuration    ║
# ╚══════════════════════════════════════════════╝

# ── LLM API Keys ──
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# ── Cloud Bridge ──
CLOUD_BRIDGE_URL=
CLOUD_BRIDGE_SECRET=

# ── Co-LAB Backend ──
COLAB_API_URL=http://localhost:3001
COLAB_WS_URL=ws://localhost:3001/ws

# ── Device Configuration ──
DEVICE_NAME=android-mobile
MAX_CLAUDE_INSTANCES=2
NODE_MEMORY_LIMIT=512

# ── GitHub (optional) ──
GITHUB_TOKEN=
ENVFILE
        log_ok "Created default .env at $ENV_FILE"
    fi
    log_warn "Edit your API keys: vim $ENV_FILE"
else
    log_ok ".env already exists"
fi

# ── Step 3: Source environment ──
set -a
source "$ENV_FILE"
set +a

# ── Step 4: Verify Claude Code installation ──
log_info "Verifying Claude Code..."
if command -v claude &>/dev/null; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
    log_ok "Claude Code found: $CLAUDE_VERSION"
else
    log_warn "Claude Code not found — attempting install..."
    npm install -g @anthropic-ai/claude-code
    if command -v claude &>/dev/null; then
        log_ok "Claude Code installed successfully"
    else
        log_error "Claude Code installation failed. Install manually:"
        echo "  npm install -g @anthropic-ai/claude-code"
    fi
fi

# ── Step 5: Set up Claude instances directories ──
log_info "Setting up Claude instance isolation..."
MAX_INSTANCES="${MAX_CLAUDE_INSTANCES:-2}"
for i in $(seq 1 "$MAX_INSTANCES"); do
    INSTANCE_DIR="$COLAB_DIR/claude-instances/instance-$i"
    mkdir -p "$INSTANCE_DIR"
    log_ok "Claude instance $i config dir: $INSTANCE_DIR"
done

# ── Step 6: Install bridge client dependencies ──
log_info "Installing bridge client..."
if [ -f "$MOBILE_DIR/bridge-client.js" ]; then
    BRIDGE_PKG_DIR="$COLAB_DIR/bridge"
    mkdir -p "$BRIDGE_PKG_DIR"
    cp "$MOBILE_DIR/bridge-client.js" "$BRIDGE_PKG_DIR/"

    # Create a minimal package.json for the bridge client
    cat > "$BRIDGE_PKG_DIR/package.json" << 'BRIDGEPKG'
{
  "name": "colab-bridge-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "ws": "^8.16.0",
    "node-fetch": "^3.3.2"
  }
}
BRIDGEPKG
    cd "$BRIDGE_PKG_DIR" && npm install --production 2>/dev/null
    cd -
    log_ok "Bridge client installed"
else
    log_warn "bridge-client.js not found — cloud bridge will not be available"
fi

# ── Step 7: Copy tmux config ──
log_info "Installing tmux configuration..."
if [ -f "$MOBILE_DIR/tmux.conf" ]; then
    cp "$MOBILE_DIR/tmux.conf" /root/.tmux.conf
    log_ok "tmux configuration installed"
else
    log_warn "tmux.conf not found — using defaults"
fi

# ── Step 8: Copy helper scripts ──
log_info "Installing helper scripts..."
for script in colab-start.sh colab-stop.sh colab-status.sh colab-helpers.sh; do
    if [ -f "$MOBILE_DIR/$script" ]; then
        cp "$MOBILE_DIR/$script" "/usr/local/bin/${script%.sh}"
        chmod +x "/usr/local/bin/${script%.sh}"
        log_ok "Installed: $script → /usr/local/bin/${script%.sh}"
    fi
done

# ── Step 9: Create bashrc additions ──
log_info "Configuring shell environment..."
cat >> /root/.bashrc << 'BASHRC'

# ── Co-LAB Mobile Environment ──
export COLAB_HOME="/root/.colab"
export COLAB_WORKSPACE="/root/workspace"

# Source Co-LAB environment
if [ -f "$COLAB_HOME/config/.env" ]; then
    set -a; source "$COLAB_HOME/config/.env"; set +a
fi

# Source helpers
if [ -f "/usr/local/bin/colab-helpers" ]; then
    source /usr/local/bin/colab-helpers
fi

# Quick aliases
alias cc="claude --dangerously-skip-permissions"
alias cc1="CLAUDE_CONFIG_DIR=$COLAB_HOME/claude-instances/instance-1 claude --dangerously-skip-permissions"
alias cc2="CLAUDE_CONFIG_DIR=$COLAB_HOME/claude-instances/instance-2 claude --dangerously-skip-permissions"
alias cls="colab-status"
alias cstart="colab-start"
alias cstop="colab-stop"
alias ws="cd /root/workspace"

# Mobile-friendly prompt
export PS1='\[\033[0;36m\]co-lab\[\033[0m\]:\[\033[0;33m\]\w\[\033[0m\]\$ '
BASHRC
log_ok "Shell environment configured"

# ── Step 10: Final verification ──
echo ""
log_info "Final verification..."
echo "───────────────────────────────────────"
echo -e "  Node.js:      $(node -v 2>/dev/null || echo 'NOT FOUND')"
echo -e "  npm:          $(npm -v 2>/dev/null || echo 'NOT FOUND')"
echo -e "  Claude Code:  $(claude --version 2>/dev/null || echo 'NOT FOUND')"
echo -e "  Python:       $(python3 --version 2>/dev/null || echo 'NOT FOUND')"
echo -e "  tmux:         $(tmux -V 2>/dev/null || echo 'NOT FOUND')"
echo -e "  git:          $(git --version 2>/dev/null | cut -d' ' -f3 || echo 'NOT FOUND')"
echo -e "  Workspace:    $WORKSPACE_DIR"
echo -e "  Config:       $COLAB_DIR"
echo -e "  Instances:    $MAX_INSTANCES"
echo "───────────────────────────────────────"

echo ""
log_ok "Phase 2 complete! Co-LAB Mobile is ready."
echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│  Getting started:                               │"
echo "│                                                 │"
echo "│  1. Edit API keys:                              │"
echo "│     vim /root/.colab/config/.env                │"
echo "│                                                 │"
echo "│  2. Clone your project:                         │"
echo "│     cd /root/workspace                          │"
echo "│     git clone <your-repo-url>                   │"
echo "│                                                 │"
echo "│  3. Start Co-LAB services:                      │"
echo "│     colab-start                                 │"
echo "│                                                 │"
echo "│  Quick commands:                                │"
echo "│     cc   — Claude Code (skip permissions)       │"
echo "│     cc1  — Claude instance 1 (isolated config)  │"
echo "│     cc2  — Claude instance 2 (isolated config)  │"
echo "│     cls  — Check service status                 │"
echo "│     cstart / cstop — Start/stop services        │"
echo "│     ws   — Jump to workspace directory          │"
echo "└─────────────────────────────────────────────────┘"
echo ""
