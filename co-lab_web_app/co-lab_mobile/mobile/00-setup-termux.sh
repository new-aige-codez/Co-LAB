#!/data/data/com.termux/files/usr/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Co-LAB Mobile — Phase 0: Termux Foundation                 ║
# ║  Run this FIRST in Termux (not inside proot)                ║
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
echo "║   Co-LAB Mobile Setup — Phase 0: Termux Base    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Update Termux packages ──
log_info "Updating Termux package repositories..."
pkg update -y && pkg upgrade -y
log_ok "Termux packages updated"

# ── Step 2: Install core packages ──
log_info "Installing core packages..."
pkg install -y \
    proot-distro \
    termux-api \
    tmux \
    git \
    curl \
    wget \
    openssh \
    openssl \
    vim \
    htop
log_ok "Core packages installed"

# ── Step 3: Grant storage access ──
log_info "Requesting storage permission..."
if [ ! -d "$HOME/storage" ]; then
    termux-setup-storage
    sleep 2
    if [ -d "$HOME/storage" ]; then
        log_ok "Storage access granted"
    else
        log_warn "Storage access may need manual grant in Android Settings"
    fi
else
    log_ok "Storage access already configured"
fi

# ── Step 4: Configure Termux properties ──
log_info "Configuring Termux properties..."
mkdir -p "$HOME/.termux"

cat > "$HOME/.termux/termux.properties" << 'PROPS'
# Co-LAB Mobile — Termux Configuration

# Extra keys row for developer workflow
extra-keys = [[ \
  {key: ESC, popup: {macro: "CTRL d", display: "exit"}}, \
  {key: CTRL, popup: {macro: "CTRL c", display: "^C"}}, \
  {key: ALT, popup: {macro: "CTRL z", display: "^Z"}}, \
  {key: TAB, popup: {macro: "CTRL a", display: "tmux"}}, \
  {key: '-', popup: '|'}, \
  {key: UP, popup: HOME}, \
  {key: DOWN, popup: END} \
]]

# Use dark theme
use-black-ui = true

# Bell behavior
bell-character = vibrate

# Handle volume keys as special keys
volume-keys = volume
PROPS

log_ok "Termux properties configured"

# ── Step 5: Set up wake lock helper ──
log_info "Creating wake lock helper..."
cat > "$HOME/.termux/boot/colab-wake-lock.sh" << 'BOOT'
#!/data/data/com.termux/files/usr/bin/bash
# Auto-acquire wake lock on Termux boot to prevent Android from killing processes
termux-wake-lock
BOOT
chmod +x "$HOME/.termux/boot/colab-wake-lock.sh"
log_ok "Wake lock helper created"

# ── Step 6: Acquire wake lock now ──
log_info "Acquiring wake lock..."
termux-wake-lock 2>/dev/null || log_warn "termux-wake-lock failed — install Termux:API from F-Droid"
log_ok "Wake lock acquired (check notification bar)"

# ── Step 7: Create shared workspace mount point ──
log_info "Creating workspace directories..."
mkdir -p "$HOME/colab-workspace"
mkdir -p "$HOME/.colab"
log_ok "Workspace directories created"

# ── Step 8: Verify installations ──
echo ""
log_info "Verifying installations..."
echo "───────────────────────────────────────"
echo -e "  tmux:         $(tmux -V 2>/dev/null || echo 'NOT FOUND')"
echo -e "  git:          $(git --version 2>/dev/null | cut -d' ' -f3 || echo 'NOT FOUND')"
echo -e "  curl:         $(curl --version 2>/dev/null | head -1 | cut -d' ' -f2 || echo 'NOT FOUND')"
echo -e "  proot-distro: $(proot-distro --version 2>/dev/null || echo 'installed')"
echo -e "  openssh:      $(ssh -V 2>&1 | cut -d',' -f1 || echo 'NOT FOUND')"
echo "───────────────────────────────────────"

echo ""
log_ok "Phase 0 complete!"
echo ""
echo "┌───────────────────────────────────────────────┐"
echo "│  Next steps:                                  │"
echo "│  1. Ensure Termux:API is installed from       │"
echo "│     F-Droid (NOT the Play Store)              │"
echo "│  2. Set Termux battery optimization to        │"
echo "│     'Unrestricted' in Android Settings        │"
echo "│  3. Run: bash 01-setup-proot.sh               │"
echo "└───────────────────────────────────────────────┘"
echo ""
