#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Co-LAB Mobile — Stop All Services                          ║
# ╚══════════════════════════════════════════════════════════════╝

SESSION="colab"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Stopping Co-LAB Mobile Services               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Kill the tmux session ──
if tmux has-session -t "$SESSION" 2>/dev/null; then
    log_info "Killing tmux session: $SESSION"
    tmux kill-session -t "$SESSION"
    log_ok "Session killed"
else
    log_info "No active Co-LAB session found"
fi

# ── Kill any orphaned Co-LAB processes ──
log_info "Checking for orphaned processes..."

# Kill Node.js processes related to Co-LAB
COLAB_PIDS=$(pgrep -f "co-lab|colab|bridge-client|bridge-server" 2>/dev/null || true)
if [ -n "$COLAB_PIDS" ]; then
    log_info "Stopping orphaned processes: $COLAB_PIDS"
    kill $COLAB_PIDS 2>/dev/null || true
    sleep 1
    # Force kill if still running
    kill -9 $COLAB_PIDS 2>/dev/null || true
    log_ok "Orphaned processes stopped"
else
    log_ok "No orphaned processes"
fi

# ── Clean up stale log files (optional) ──
COLAB_HOME="${COLAB_HOME:-/root/.colab}"
if [ -d "$COLAB_HOME/logs" ]; then
    # Truncate (not delete) log files to free space while preserving filenames
    for logfile in "$COLAB_HOME/logs"/*.log; do
        if [ -f "$logfile" ]; then
            > "$logfile"
        fi
    done
    log_ok "Log files truncated"
fi

echo ""
log_ok "Co-LAB Mobile stopped"
echo ""
