#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Co-LAB Mobile — Service Status                             ║
# ╚══════════════════════════════════════════════════════════════╝

COLAB_HOME="${COLAB_HOME:-/root/.colab}"
SESSION="colab"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

status_dot() {
    if [ "$1" = "running" ]; then
        echo -e "${GREEN}●${NC}"
    elif [ "$1" = "warn" ]; then
        echo -e "${YELLOW}●${NC}"
    else
        echo -e "${RED}●${NC}"
    fi
}

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Co-LAB Mobile — System Status                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── tmux Session ──
echo -e "${BOLD}tmux Session${NC}"
if tmux has-session -t "$SESSION" 2>/dev/null; then
    WINDOW_COUNT=$(tmux list-windows -t "$SESSION" 2>/dev/null | wc -l)
    PANE_COUNT=$(tmux list-panes -t "$SESSION" -a 2>/dev/null | wc -l)
    echo -e "  $(status_dot running) Session '$SESSION' — $WINDOW_COUNT windows, $PANE_COUNT panes"
    echo ""

    # List windows
    echo -e "  ${CYAN}Windows:${NC}"
    tmux list-windows -t "$SESSION" -F "    #I: #W (#{window_panes} panes) #{?window_active,[active],}" 2>/dev/null
else
    echo -e "  $(status_dot stopped) No active session"
fi
echo ""

# ── Processes ──
echo -e "${BOLD}Processes${NC}"

# Claude Code
CLAUDE_COUNT=$(pgrep -fc "claude" 2>/dev/null || echo "0")
if [ "$CLAUDE_COUNT" -gt 0 ]; then
    echo -e "  $(status_dot running) Claude Code — $CLAUDE_COUNT instance(s)"
else
    echo -e "  $(status_dot stopped) Claude Code — not running"
fi

# Node.js (backend)
NODE_COUNT=$(pgrep -fc "node.*index.js" 2>/dev/null || echo "0")
if [ "$NODE_COUNT" -gt 0 ]; then
    echo -e "  $(status_dot running) Co-LAB Backend — $NODE_COUNT process(es)"
else
    echo -e "  $(status_dot stopped) Co-LAB Backend — not running"
fi

# Bridge client
BRIDGE_COUNT=$(pgrep -fc "bridge-client" 2>/dev/null || echo "0")
if [ "$BRIDGE_COUNT" -gt 0 ]; then
    echo -e "  $(status_dot running) Cloud Bridge — connected"
else
    echo -e "  $(status_dot stopped) Cloud Bridge — not connected"
fi
echo ""

# ── System Resources ──
echo -e "${BOLD}System Resources${NC}"

# Memory
if command -v free &>/dev/null; then
    MEM_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
    MEM_USED=$(free -m | awk '/Mem:/ {print $3}')
    MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
    MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))

    if [ "$MEM_PCT" -gt 85 ]; then
        MEM_STATUS="warn"
    else
        MEM_STATUS="running"
    fi
    echo -e "  $(status_dot $MEM_STATUS) Memory: ${MEM_USED}MB / ${MEM_TOTAL}MB (${MEM_PCT}%) — ${MEM_AVAIL}MB available"
fi

# Disk
if command -v df &>/dev/null; then
    DISK_AVAIL=$(df -h /root 2>/dev/null | awk 'NR==2 {print $4}')
    DISK_PCT=$(df /root 2>/dev/null | awk 'NR==2 {print $5}' | tr -d '%')

    if [ "${DISK_PCT:-0}" -gt 85 ]; then
        DISK_STATUS="warn"
    else
        DISK_STATUS="running"
    fi
    echo -e "  $(status_dot $DISK_STATUS) Disk: $DISK_AVAIL free (${DISK_PCT}% used)"
fi

# CPU load
if [ -f /proc/loadavg ]; then
    LOAD=$(cat /proc/loadavg | awk '{print $1, $2, $3}')
    CORES=$(nproc 2>/dev/null || echo "?")
    echo -e "  $(status_dot running) Load: $LOAD ($CORES cores)"
fi
echo ""

# ── Configuration ──
echo -e "${BOLD}Configuration${NC}"
ENV_FILE="$COLAB_HOME/config/.env"
if [ -f "$ENV_FILE" ]; then
    # Show which keys are configured (not their values)
    HAS_ANTHROPIC=$(grep -c "^ANTHROPIC_API_KEY=." "$ENV_FILE" 2>/dev/null || echo "0")
    HAS_BRIDGE=$(grep -c "^CLOUD_BRIDGE_URL=." "$ENV_FILE" 2>/dev/null || echo "0")
    HAS_GITHUB=$(grep -c "^GITHUB_TOKEN=." "$ENV_FILE" 2>/dev/null || echo "0")

    [ "$HAS_ANTHROPIC" -gt 0 ] && echo -e "  $(status_dot running) Anthropic API key configured" || echo -e "  $(status_dot stopped) Anthropic API key not set"
    [ "$HAS_BRIDGE" -gt 0 ]   && echo -e "  $(status_dot running) Cloud bridge URL configured" || echo -e "  $(status_dot warn) Cloud bridge not configured"
    [ "$HAS_GITHUB" -gt 0 ]   && echo -e "  $(status_dot running) GitHub token configured" || echo -e "  $(status_dot warn) GitHub token not set (optional)"
else
    echo -e "  $(status_dot stopped) No .env file found"
fi
echo ""

# ── Network ──
echo -e "${BOLD}Network${NC}"
# Check if backend port is listening
if command -v ss &>/dev/null; then
    PORT_3001=$(ss -tlnp 2>/dev/null | grep -c ":3001" || echo "0")
    PORT_8080=$(ss -tlnp 2>/dev/null | grep -c ":8080" || echo "0")
elif command -v netstat &>/dev/null; then
    PORT_3001=$(netstat -tlnp 2>/dev/null | grep -c ":3001" || echo "0")
    PORT_8080=$(netstat -tlnp 2>/dev/null | grep -c ":8080" || echo "0")
else
    PORT_3001="?"
    PORT_8080="?"
fi

[ "$PORT_3001" -gt 0 ] 2>/dev/null && echo -e "  $(status_dot running) Port 3001 (API) — listening" || echo -e "  $(status_dot stopped) Port 3001 (API) — not listening"
[ "$PORT_8080" -gt 0 ] 2>/dev/null && echo -e "  $(status_dot running) Port 8080 (LiteLLM) — listening" || echo -e "  $(status_dot stopped) Port 8080 (LiteLLM) — not listening"

# Internet connectivity
if curl -s --connect-timeout 3 https://api.anthropic.com > /dev/null 2>&1; then
    echo -e "  $(status_dot running) Internet — connected"
else
    echo -e "  $(status_dot warn) Internet — unreachable or slow"
fi
echo ""
