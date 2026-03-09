#!/data/data/com.termux/files/usr/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Co-LAB Mobile — Phase 1: Ubuntu in proot-distro            ║
# ║  Run this SECOND in Termux (not inside proot)               ║
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

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Co-LAB Mobile Setup — Phase 1: proot Ubuntu   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Check prerequisites ──
log_info "Checking prerequisites..."
if ! command -v proot-distro &>/dev/null; then
    log_error "proot-distro not found. Run 00-setup-termux.sh first."
    exit 1
fi
log_ok "Prerequisites verified"

# ── Step 2: Install Ubuntu ──
log_info "Installing Ubuntu 22.04 in proot-distro..."
if proot-distro list 2>/dev/null | grep -q "ubuntu"; then
    log_warn "Ubuntu already installed — skipping install"
else
    proot-distro install ubuntu
    log_ok "Ubuntu installed"
fi

# ── Step 3: Create proot login wrapper with bind mounts ──
log_info "Creating proot login wrapper..."
cat > "$HOME/ubuntu" << 'WRAPPER'
#!/data/data/com.termux/files/usr/bin/bash
# Co-LAB: Login to Ubuntu proot with shared storage mounted
#
# Bind mounts:
#   /sdcard           → /mnt/sdcard       (Android shared storage)
#   ~/colab-workspace → /root/workspace    (Project workspaces)
#   ~/.colab          → /root/.colab       (Co-LAB config)

EXTRA_ARGS=""
if [ -d "$HOME/storage/shared" ]; then
    EXTRA_ARGS="--bind $HOME/storage/shared:/mnt/sdcard"
fi

proot-distro login ubuntu \
    --bind "$HOME/colab-workspace:/root/workspace" \
    --bind "$HOME/.colab:/root/.colab" \
    $EXTRA_ARGS \
    -- "$@"
WRAPPER
chmod +x "$HOME/ubuntu"
log_ok "Login wrapper created at ~/ubuntu"

# ── Step 4: Bootstrap Ubuntu environment ──
log_info "Bootstrapping Ubuntu environment inside proot..."
proot-distro login ubuntu -- bash -c '
set -euo pipefail

echo "[INFO]  Updating apt repositories..."
apt update -y && apt upgrade -y

echo "[INFO]  Installing development toolchain..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    tmux \
    htop \
    jq \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release

# Install Node.js 20 LTS via NodeSource
echo "[INFO]  Installing Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo "[INFO]  Node.js version: $(node -v)"
echo "[INFO]  npm version: $(npm -v)"

# Install Claude Code globally
echo "[INFO]  Installing Claude Code..."
npm install -g @anthropic-ai/claude-code 2>/dev/null || {
    echo "[WARN]  Claude Code install failed — may need manual retry"
}

# Configure npm for lower memory usage on mobile
echo "[INFO]  Configuring npm for mobile..."
npm config set fund false
npm config set audit false
npm config set update-notifier false

# Set up workspace directory structure
echo "[INFO]  Creating workspace structure..."
mkdir -p /root/workspace
mkdir -p /root/.colab/logs
mkdir -p /root/.colab/config
mkdir -p /root/.colab/claude-instances

# Increase file descriptor limit
echo "[INFO]  Configuring system limits..."
echo "ulimit -n 65536" >> /root/.bashrc

# Set NODE_OPTIONS for memory-constrained environments
echo "[INFO]  Configuring Node.js memory limits..."
echo "export NODE_OPTIONS=\"--max-old-space-size=512\"" >> /root/.bashrc

# Set Claude Code config directory
echo "export CLAUDE_CONFIG_DIR=/root/.colab/config" >> /root/.bashrc

echo "[OK]    Ubuntu bootstrap complete!"
'

log_ok "Ubuntu environment bootstrapped"

echo ""
log_ok "Phase 1 complete!"
echo ""
echo "┌───────────────────────────────────────────────────────┐"
echo "│  Next steps:                                          │"
echo "│  1. Enter Ubuntu:  ~/ubuntu                           │"
echo "│  2. Run:           bash /root/workspace/co-lab_mobile │"
echo "│                    /mobile/02-setup-project.sh        │"
echo "│                                                       │"
echo "│  Quick access: ~/ubuntu                               │"
echo "│  (This runs proot with storage bind mounts)           │"
echo "└───────────────────────────────────────────────────────┘"
echo ""
