#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Co-LAB Mobile — Start All Services                         ║
# ║  Creates a tmux session with all Co-LAB services running    ║
# ╚══════════════════════════════════════════════════════════════╝

set -euo pipefail

COLAB_HOME="${COLAB_HOME:-/root/.colab}"
WORKSPACE="${COLAB_WORKSPACE:-/root/workspace}"
SESSION="colab"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }

# ── Source environment ──
if [ -f "$COLAB_HOME/config/.env" ]; then
    set -a; source "$COLAB_HOME/config/.env"; set +a
fi

# ── Check for existing session ──
if tmux has-session -t "$SESSION" 2>/dev/null; then
    log_warn "Co-LAB session already running!"
    echo "  Use: tmux attach -t $SESSION"
    echo "  Or:  colab-stop && colab-start"
    exit 0
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Starting Co-LAB Mobile Services               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════
# Window 0: Infrastructure services
# ═══════════════════════════════════════════════════════════
log_info "Creating tmux session: $SESSION"
tmux new-session -d -s "$SESSION" -n "infra" -x 120 -y 40

# Pane 0: Co-LAB Backend API (if project is cloned locally)
if [ -d "$WORKSPACE/co-lab" ] && [ -f "$WORKSPACE/co-lab/dist/index.js" ]; then
    log_info "Starting Co-LAB backend API..."
    tmux send-keys -t "$SESSION:infra.0" \
        "cd $WORKSPACE/co-lab && node --max-old-space-size=256 dist/index.js 2>&1 | tee $COLAB_HOME/logs/api.log" Enter
else
    log_info "No local Co-LAB backend found — pane 0 available for manual use"
    tmux send-keys -t "$SESSION:infra.0" \
        "echo '── Co-LAB Backend ── (start manually or connect to cloud)'" Enter
fi

# Pane 1: Cloud Bridge Client
tmux split-window -t "$SESSION:infra" -v
if [ -f "$COLAB_HOME/bridge/bridge-client.js" ] && [ -n "${CLOUD_BRIDGE_URL:-}" ]; then
    log_info "Starting cloud bridge client..."
    tmux send-keys -t "$SESSION:infra.1" \
        "cd $COLAB_HOME/bridge && node bridge-client.js 2>&1 | tee $COLAB_HOME/logs/bridge.log" Enter
else
    log_info "Cloud bridge not configured — pane 1 available for manual use"
    tmux send-keys -t "$SESSION:infra.1" \
        "echo '── Cloud Bridge ── (set CLOUD_BRIDGE_URL in .env to enable)'" Enter
fi

# Pane 2: System monitor
tmux split-window -t "$SESSION:infra" -v
tmux send-keys -t "$SESSION:infra.2" "htop -t" Enter
log_info "System monitor started"

# Balance panes
tmux select-layout -t "$SESSION:infra" even-vertical

# ═══════════════════════════════════════════════════════════
# Window 1: Claude Code Instances
# ═══════════════════════════════════════════════════════════
log_info "Setting up Claude Code instances..."
tmux new-window -t "$SESSION" -n "claude"

MAX_INSTANCES="${MAX_CLAUDE_INSTANCES:-2}"

# Instance 1
tmux send-keys -t "$SESSION:claude.0" \
    "cd $WORKSPACE && export CLAUDE_CONFIG_DIR=$COLAB_HOME/claude-instances/instance-1 && echo '── Claude Code Instance 1 ──' && echo 'Type: cc1  or  claude --dangerously-skip-permissions'" Enter

# Instance 2 (if configured for multiple)
if [ "$MAX_INSTANCES" -ge 2 ]; then
    tmux split-window -t "$SESSION:claude" -h
    tmux send-keys -t "$SESSION:claude.1" \
        "cd $WORKSPACE && export CLAUDE_CONFIG_DIR=$COLAB_HOME/claude-instances/instance-2 && echo '── Claude Code Instance 2 ──' && echo 'Type: cc2  or  claude --dangerously-skip-permissions'" Enter
fi

# ═══════════════════════════════════════════════════════════
# Window 2: Workspace (general purpose)
# ═══════════════════════════════════════════════════════════
log_info "Setting up workspace window..."
tmux new-window -t "$SESSION" -n "work"
tmux send-keys -t "$SESSION:work" "cd $WORKSPACE && echo '── Workspace ── Ready for development'" Enter

# ═══════════════════════════════════════════════════════════
# Window 3: Logs
# ═══════════════════════════════════════════════════════════
log_info "Setting up logs window..."
tmux new-window -t "$SESSION" -n "logs"
tmux send-keys -t "$SESSION:logs" \
    "echo '── Logs ── Watching Co-LAB logs...' && tail -f $COLAB_HOME/logs/*.log 2>/dev/null || echo 'No log files yet'" Enter

# ═══════════════════════════════════════════════════════════
# Select the Claude window by default
# ═══════════════════════════════════════════════════════════
tmux select-window -t "$SESSION:claude"

echo ""
log_ok "Co-LAB Mobile is running!"
echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│  tmux session: $SESSION                          │"
echo "│                                                 │"
echo "│  Windows:                                       │"
echo "│    0: infra   — Backend + Bridge + Monitor      │"
echo "│    1: claude  — Claude Code instances           │"
echo "│    2: work    — General workspace               │"
echo "│    3: logs    — Log viewer                      │"
echo "│                                                 │"
echo "│  Controls:                                      │"
echo "│    Ctrl+B, 0-3  — Switch windows                │"
echo "│    Ctrl+B, d    — Detach (keeps running)        │"
echo "│    tmux a        — Re-attach                    │"
echo "│    colab-status  — Check service status         │"
echo "│    colab-stop    — Stop everything              │"
echo "└─────────────────────────────────────────────────┘"
echo ""

# Attach to the session
tmux attach -t "$SESSION"
