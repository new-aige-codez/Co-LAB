#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Co-LAB Mobile — Shell Helper Functions                     ║
# ║  Sourced automatically from .bashrc                         ║
# ╚══════════════════════════════════════════════════════════════╝

COLAB_HOME="${COLAB_HOME:-/root/.colab}"
COLAB_WORKSPACE="${COLAB_WORKSPACE:-/root/workspace}"

# ── Cloud Bridge Helpers ──

# Offload a task to the cloud bridge
cloud-run() {
    local endpoint="$1"
    shift
    local data="$*"

    if [ -z "${CLOUD_BRIDGE_URL:-}" ]; then
        echo "[ERROR] CLOUD_BRIDGE_URL not set in .env"
        return 1
    fi

    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${CLOUD_BRIDGE_SECRET:-}" \
        -d "$data" \
        "${CLOUD_BRIDGE_URL}${endpoint}"
}

# Scrape a URL via cloud (handles JS rendering)
cloud-scrape() {
    local url="$1"
    cloud-run "/api/browser/scrape" "{\"url\": \"$url\"}"
}

# Take a screenshot via cloud
cloud-screenshot() {
    local url="$1"
    local output="${2:-screenshot.png}"
    cloud-run "/api/browser/screenshot" "{\"url\": \"$url\"}" | base64 -d > "$output"
    echo "Screenshot saved: $output"
}

# Run npm build on cloud (offload heavy builds)
cloud-build() {
    local project_path="$1"
    echo "[INFO] Offloading npm build to cloud..."
    cloud-run "/api/build/npm" "{\"projectPath\": \"$project_path\"}"
}

# Check cloud bridge health
cloud-health() {
    if [ -z "${CLOUD_BRIDGE_URL:-}" ]; then
        echo "[ERROR] CLOUD_BRIDGE_URL not set"
        return 1
    fi
    curl -s "${CLOUD_BRIDGE_URL}/health" | jq . 2>/dev/null || curl -s "${CLOUD_BRIDGE_URL}/health"
}

# ── Claude Code Helpers ──

# Start Claude Code with instance isolation
claude-instance() {
    local instance="${1:-1}"
    local workspace="${2:-$COLAB_WORKSPACE}"

    export CLAUDE_CONFIG_DIR="$COLAB_HOME/claude-instances/instance-$instance"
    echo "[INFO] Claude instance $instance (config: $CLAUDE_CONFIG_DIR)"
    cd "$workspace"
    claude --dangerously-skip-permissions
}

# Quick Claude Code task (non-interactive, single prompt)
claude-task() {
    local prompt="$*"
    if [ -z "$prompt" ]; then
        echo "Usage: claude-task 'your prompt here'"
        return 1
    fi
    echo "$prompt" | claude --dangerously-skip-permissions --print 2>/dev/null || \
    claude --dangerously-skip-permissions -p "$prompt"
}

# ── Clipboard Bridge ──
# Bridges tmux clipboard with Android system clipboard via Termux:API

clip-copy() {
    # Copy stdin or argument to Android clipboard
    if [ -n "$*" ]; then
        echo "$*" | termux-clipboard-set 2>/dev/null || {
            # Fallback: copy to tmux buffer
            echo "$*" | tmux load-buffer -
            echo "[INFO] Copied to tmux buffer (Termux:API not available)"
        }
    else
        termux-clipboard-set 2>/dev/null || tmux load-buffer -
    fi
}

clip-paste() {
    # Paste from Android clipboard
    termux-clipboard-get 2>/dev/null || {
        # Fallback: paste from tmux buffer
        tmux save-buffer -
    }
}

# ── Notification Bridge ──

notify() {
    local title="${1:-Co-LAB}"
    local message="${2:-Task complete}"

    # Try Termux:API native notification first
    termux-notification \
        --title "$title" \
        --content "$message" \
        --id "colab-notify" \
        --priority "high" \
        --vibrate "200,100,200" \
        --led-color "FF6600" \
        2>/dev/null || {
        echo "[NOTIFY] $title: $message"
    }
}

# Notify when a long-running command finishes
# Usage: long-command ; alert "Build finished"
alert() {
    local message="${1:-Command finished}"
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        notify "✅ Co-LAB" "$message"
    else
        notify "❌ Co-LAB" "$message (exit code: $exit_code)"
    fi
}

# ── File Transfer Helpers ──

# Push file to Android shared storage (visible in Files app)
push-to-android() {
    local file="$1"
    local dest="/mnt/sdcard/CoLab/"
    mkdir -p "$dest"
    cp "$file" "$dest"
    echo "[OK] Copied to Android storage: $dest$(basename $file)"
}

# Pull file from Android shared storage
pull-from-android() {
    local file="$1"
    cp "/mnt/sdcard/$file" .
    echo "[OK] Pulled from Android storage: $file"
}

# ── Memory Management ──

# Show memory usage of Co-LAB processes
colab-mem() {
    echo "── Co-LAB Process Memory Usage ──"
    ps aux 2>/dev/null | head -1
    ps aux 2>/dev/null | grep -E "(claude|node|python)" | grep -v grep
    echo ""
    echo "── Total ──"
    free -h 2>/dev/null
}

# Kill the heaviest node process (emergency memory release)
colab-emergency-gc() {
    echo "[WARN] Emergency: killing heaviest Node.js process..."
    local pid=$(ps aux 2>/dev/null | grep node | grep -v grep | sort -k4 -rn | head -1 | awk '{print $2}')
    if [ -n "$pid" ]; then
        kill "$pid"
        echo "[OK] Killed PID $pid"
    else
        echo "[INFO] No Node.js processes found"
    fi
}

# ── Quick Navigation ──

# Jump to project directory
proj() {
    local project="${1:-}"
    if [ -z "$project" ]; then
        ls -la "$COLAB_WORKSPACE"
    else
        cd "$COLAB_WORKSPACE/$project" 2>/dev/null || echo "[ERROR] Project not found: $project"
    fi
}

# ── Info ──

colab-help() {
    echo ""
    echo "╔══════════════════════════════════════════════════╗"
    echo "║   Co-LAB Mobile — Available Commands            ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo ""
    echo "  Service Management:"
    echo "    colab-start      Start all services"
    echo "    colab-stop       Stop all services"
    echo "    colab-status     System status"
    echo ""
    echo "  Claude Code:"
    echo "    cc               Claude Code (quick)"
    echo "    cc1, cc2         Isolated instances"
    echo "    claude-task '…'  Single prompt, non-interactive"
    echo ""
    echo "  Cloud Bridge:"
    echo "    cloud-health     Check bridge connection"
    echo "    cloud-scrape     Scrape URL via cloud"
    echo "    cloud-screenshot Take screenshot via cloud"
    echo "    cloud-build      Offload npm build to cloud"
    echo ""
    echo "  Clipboard:"
    echo "    clip-copy        Copy to Android clipboard"
    echo "    clip-paste       Paste from Android clipboard"
    echo ""
    echo "  Notifications:"
    echo "    notify 'title' 'msg'   Send Android notification"
    echo "    command ; alert 'msg'  Notify when command finishes"
    echo ""
    echo "  Files:"
    echo "    push-to-android file   Copy to shared storage"
    echo "    pull-from-android file Copy from shared storage"
    echo "    proj [name]            Navigate projects"
    echo ""
    echo "  System:"
    echo "    colab-mem              Process memory usage"
    echo "    colab-emergency-gc     Kill heaviest Node process"
    echo "    colab-help             Show this help"
    echo ""
}
