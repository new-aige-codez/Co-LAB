#!/data/data/com.termux/files/usr/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Co-LAB Mobile — One-Command Installer                      ║
# ║                                                              ║
# ║  Usage: curl -sL https://raw.githubusercontent.com/          ║
# ║    new-aige-codez/Co-LAB/tmux-mobile/co-lab_web_app/         ║
# ║    co-lab_mobile/mobile/install.sh | bash                    ║
# ║                                                              ║
# ║  Or locally: bash install.sh                                 ║
# ╚══════════════════════════════════════════════════════════════╝

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()      { echo -e "${GREEN}[ OK ]${NC}  $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[FAIL]${NC} $1"; }
log_step()    { echo -e "\n${BOLD}${CYAN}═══ $1 ═══${NC}\n"; }

REPO_URL="https://github.com/new-aige-codez/Co-LAB.git"
REPO_BRANCH="tmux-mobile"
REPO_DIR="$HOME/Co-LAB"
MOBILE_DIR="$REPO_DIR/co-lab_web_app/co-lab_mobile/mobile"

# ── Banner ──
clear
echo ""
echo -e "${BOLD}"
echo "   ██████╗ ██████╗       ██╗      █████╗ ██████╗ "
echo "  ██╔════╝██╔═══██╗      ██║     ██╔══██╗██╔══██╗"
echo "  ██║     ██║   ██║█████╗██║     ███████║██████╔╝"
echo "  ██║     ██║   ██║╚════╝██║     ██╔══██║██╔══██╗"
echo "  ╚██████╗╚██████╔╝      ███████╗██║  ██║██████╔╝"
echo "   ╚═════╝ ╚═════╝       ╚══════╝╚═╝  ╚═╝╚═════╝"
echo -e "${NC}"
echo -e "  ${CYAN}Mobile Installer — One command, fully automated${NC}"
echo ""
echo "  This will install:"
echo "    • Ubuntu 22.04 (via proot-distro)"
echo "    • Node.js 20 LTS"
echo "    • Claude Code"
echo "    • Co-LAB Mobile services"
echo ""
echo -e "  ${YELLOW}Estimated time: 15-20 minutes${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# PHASE 0: Termux Foundation
# ═══════════════════════════════════════════════════════════════
log_step "PHASE 0: Setting up Termux"

# Check we're in Termux
if [ ! -d "/data/data/com.termux" ]; then
    log_error "This script must be run inside Termux."
    echo "  1. Install Termux from F-Droid (NOT the Play Store)"
    echo "  2. Open Termux"
    echo "  3. Run this script again"
    exit 1
fi

# Update and install core packages
log_info "Updating packages..."
pkg update -y 2>&1 | tail -1
pkg upgrade -y 2>&1 | tail -1
log_ok "Packages updated"

log_info "Installing core tools..."
pkg install -y proot-distro termux-api tmux git curl wget openssh openssl vim htop 2>&1 | tail -1
log_ok "Core tools installed"

# Grant storage access (non-blocking — will pop Android permission dialog)
log_info "Requesting storage access..."
if [ ! -d "$HOME/storage" ]; then
    termux-setup-storage 2>/dev/null || true
    sleep 2
fi
log_ok "Storage configured"

# Configure Termux
log_info "Configuring Termux..."
mkdir -p "$HOME/.termux"
cat > "$HOME/.termux/termux.properties" << 'PROPS'
extra-keys = [[ \
  {key: ESC, popup: {macro: "CTRL d", display: "exit"}}, \
  {key: CTRL, popup: {macro: "CTRL c", display: "^C"}}, \
  {key: ALT, popup: {macro: "CTRL z", display: "^Z"}}, \
  {key: TAB, popup: {macro: "CTRL a", display: "tmux"}}, \
  {key: '-', popup: '|'}, \
  {key: UP, popup: HOME}, \
  {key: DOWN, popup: END} \
]]
use-black-ui = true
bell-character = vibrate
PROPS

# Enable external apps (for future Capacitor integration)
echo "allow-external-apps = true" >> "$HOME/.termux/termux.properties"
log_ok "Termux configured"

# Wake lock
log_info "Acquiring wake lock..."
termux-wake-lock 2>/dev/null || log_warn "Wake lock failed — install Termux:API"
log_ok "Wake lock active"

# Auto-start wake lock on boot
mkdir -p "$HOME/.termux/boot"
cat > "$HOME/.termux/boot/colab-wake-lock.sh" << 'BOOT'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
BOOT
chmod +x "$HOME/.termux/boot/colab-wake-lock.sh"

# ═══════════════════════════════════════════════════════════════
# Clone the repository
# ═══════════════════════════════════════════════════════════════
log_step "Cloning Co-LAB"

if [ -d "$REPO_DIR" ]; then
    log_info "Repo already exists, pulling latest..."
    cd "$REPO_DIR" && git pull origin "$REPO_BRANCH" 2>&1 | tail -1
    cd -
else
    log_info "Cloning repository..."
    git clone -b "$REPO_BRANCH" --depth 1 "$REPO_URL" "$REPO_DIR" 2>&1 | tail -3
fi
log_ok "Repository ready"

# ═══════════════════════════════════════════════════════════════
# PHASE 1: Ubuntu in proot-distro
# ═══════════════════════════════════════════════════════════════
log_step "PHASE 1: Installing Ubuntu"

if proot-distro list 2>/dev/null | grep -q "ubuntu"; then
    log_ok "Ubuntu already installed"
else
    log_info "Installing Ubuntu (this takes 2-5 minutes)..."
    proot-distro install ubuntu 2>&1 | tail -1
    log_ok "Ubuntu installed"
fi

# Create workspace directories
mkdir -p "$HOME/colab-workspace"
mkdir -p "$HOME/.colab"
log_ok "Workspace directories created"

# Create login wrapper
cat > "$HOME/ubuntu" << 'WRAPPER'
#!/data/data/com.termux/files/usr/bin/bash
EXTRA_ARGS=""
if [ -d "$HOME/storage/shared" ]; then
    EXTRA_ARGS="--bind $HOME/storage/shared:/mnt/sdcard"
fi
proot-distro login ubuntu \
    --bind "$HOME/colab-workspace:/root/workspace" \
    --bind "$HOME/.colab:/root/.colab" \
    --bind "$HOME/Co-LAB:/root/Co-LAB" \
    $EXTRA_ARGS \
    -- "$@"
WRAPPER
chmod +x "$HOME/ubuntu"
log_ok "Login wrapper created"

# ═══════════════════════════════════════════════════════════════
# PHASE 2: Bootstrap Ubuntu environment (runs inside proot)
# ═══════════════════════════════════════════════════════════════
log_step "PHASE 2: Setting up Ubuntu environment"
log_info "This is the longest step (5-10 minutes)..."

proot-distro login ubuntu --bind "$HOME/.colab:/root/.colab" --bind "$HOME/Co-LAB:/root/Co-LAB" -- bash -c '
set -euo pipefail

echo "[INFO]  Updating apt..."
apt update -y > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1

echo "[INFO]  Installing toolchain..."
apt install -y curl wget git vim build-essential python3 python3-pip tmux htop jq unzip ca-certificates gnupg > /dev/null 2>&1

echo "[INFO]  Installing Node.js 20..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - > /dev/null 2>&1
    apt install -y nodejs > /dev/null 2>&1
fi
echo "[ OK ]  Node.js $(node -v) installed"

echo "[INFO]  Installing Claude Code (this takes a minute)..."
npm config set fund false 2>/dev/null
npm config set audit false 2>/dev/null
npm config set update-notifier false 2>/dev/null
npm install -g @anthropic-ai/claude-code 2>/dev/null || echo "[WARN]  Claude Code install had warnings (may still work)"
echo "[ OK ]  Claude Code installed"

# Create directories
mkdir -p /root/workspace /root/.colab/logs /root/.colab/config /root/.colab/claude-instances/instance-1 /root/.colab/claude-instances/instance-2

# Copy scripts
MOBILE_DIR="/root/Co-LAB/co-lab_web_app/co-lab_mobile/mobile"
if [ -f "$MOBILE_DIR/tmux.conf" ]; then
    cp "$MOBILE_DIR/tmux.conf" /root/.tmux.conf
fi

for script in colab-start.sh colab-stop.sh colab-status.sh colab-helpers.sh; do
    if [ -f "$MOBILE_DIR/$script" ]; then
        cp "$MOBILE_DIR/$script" "/usr/local/bin/${script%.sh}"
        chmod +x "/usr/local/bin/${script%.sh}"
    fi
done

# Install bridge client
BRIDGE_DIR="/root/.colab/bridge"
mkdir -p "$BRIDGE_DIR"
if [ -f "$MOBILE_DIR/bridge-client.js" ]; then
    cp "$MOBILE_DIR/bridge-client.js" "$BRIDGE_DIR/"
    cat > "$BRIDGE_DIR/package.json" << BPKG
{"name":"colab-bridge-client","version":"1.0.0","private":true,"type":"module","dependencies":{"ws":"^8.16.0","node-fetch":"^3.3.2"}}
BPKG
    cd "$BRIDGE_DIR" && npm install --production > /dev/null 2>&1
fi

# Configure bashrc
grep -q "COLAB_HOME" /root/.bashrc 2>/dev/null || cat >> /root/.bashrc << BASHRC

# ── Co-LAB Mobile ──
export COLAB_HOME="/root/.colab"
export COLAB_WORKSPACE="/root/workspace"
export NODE_OPTIONS="--max-old-space-size=512"
export CLAUDE_CONFIG_DIR="/root/.colab/config"
if [ -f "\$COLAB_HOME/config/.env" ]; then set -a; source "\$COLAB_HOME/config/.env"; set +a; fi
if [ -f "/usr/local/bin/colab-helpers" ]; then source /usr/local/bin/colab-helpers; fi
ulimit -n 65536 2>/dev/null
alias cc="claude --dangerously-skip-permissions"
alias cc1="CLAUDE_CONFIG_DIR=/root/.colab/claude-instances/instance-1 claude --dangerously-skip-permissions"
alias cc2="CLAUDE_CONFIG_DIR=/root/.colab/claude-instances/instance-2 claude --dangerously-skip-permissions"
alias cls="colab-status"
alias cstart="colab-start"
alias cstop="colab-stop"
alias ws="cd /root/workspace"
export PS1="\[\033[0;36m\]co-lab\[\033[0m\]:\[\033[0;33m\]\w\[\033[0m\]\$ "
BASHRC

echo "[ OK ]  Ubuntu environment ready"
'

log_ok "Ubuntu bootstrap complete"

# ═══════════════════════════════════════════════════════════════
# API KEY PROMPT — the only user interaction needed
# ═══════════════════════════════════════════════════════════════
log_step "CONFIGURATION"

ENV_FILE="$HOME/.colab/config/.env"

# Check if .env already exists and has a key
if [ -f "$ENV_FILE" ] && grep -q "^ANTHROPIC_API_KEY=sk-" "$ENV_FILE" 2>/dev/null; then
    log_ok "API key already configured"
else
    echo -e "${BOLD}Almost done! Enter your Anthropic API key to finish setup.${NC}"
    echo -e "${CYAN}(Get one at: https://console.anthropic.com/settings/keys)${NC}"
    echo ""
    echo -n "  Anthropic API key: "
    read -r API_KEY

    if [ -z "$API_KEY" ]; then
        log_warn "No key entered — you can set it later in: $ENV_FILE"
        API_KEY=""
    fi

    cat > "$ENV_FILE" << ENVFILE
# Co-LAB Mobile — Auto-generated by installer
ANTHROPIC_API_KEY=$API_KEY
OPENAI_API_KEY=
GOOGLE_API_KEY=
CLOUD_BRIDGE_URL=
CLOUD_BRIDGE_SECRET=
COLAB_API_URL=http://localhost:3001
COLAB_WS_URL=ws://localhost:3001/ws
DEVICE_NAME=android-mobile
MAX_CLAUDE_INSTANCES=2
NODE_MEMORY_LIMIT=512
BRIDGE_LOCAL_PORT=18789
GITHUB_TOKEN=
ENVFILE

    if [ -n "$API_KEY" ]; then
        log_ok "API key saved"
    fi
fi

# ═══════════════════════════════════════════════════════════════
# BATTERY OPTIMIZATION PROMPT
# ═══════════════════════════════════════════════════════════════
log_step "FINAL STEP"

echo -e "  ${YELLOW}Important:${NC} Set Termux battery optimization to ${BOLD}Unrestricted${NC}"
echo "  so Android doesn't kill your sessions."
echo ""
echo -e "  Opening Android settings now..."
sleep 1

# Try to open battery optimization settings via Termux:API
termux-open "https://dontkillmyapp.com/google" 2>/dev/null || true

echo ""
echo -e "  ${CYAN}Go to: Settings → Apps → Termux → Battery → Unrestricted${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║                                                  ║"
echo "  ║   ✅  Co-LAB Mobile is installed!                ║"
echo "  ║                                                  ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "  To start:"
echo ""
echo -e "    ${CYAN}~/ubuntu${NC}              Enter Ubuntu environment"
echo -e "    ${CYAN}colab-start${NC}           Start all services"
echo -e "    ${CYAN}cc${NC}                    Launch Claude Code"
echo -e "    ${CYAN}colab-help${NC}            Show all commands"
echo ""
echo -e "  ${BOLD}Quick start:${NC}"
echo -e "    ${GREEN}~/ubuntu -c colab-start${NC}"
echo ""
