#!/bin/bash
#
# Mission Control Oracle Cloud Deployment Script
#
# Usage: ./deploy-oracle.sh [command]
#
# Commands:
#   setup     - First-time setup (clone, install, build, start)
#   deploy    - Deploy latest code (git pull, build, restart)
#   start     - Start services
#   stop      - Stop services
#   restart   - Restart services
#   logs      - Show logs
#   status    - Show status
#   build     - Build the application
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/ubuntu/mission-control"
SERVICE_NAME="mission-control"
REPO_URL="https://github.com/new-aige-codez/Co-LAB.git"
BRANCH="merger-plan"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Install pnpm if not present
install_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        log_info "Installing pnpm..."
        npm install -g pnpm
        log_success "pnpm installed"
    fi
}

# Build application
build_app() {
    log_info "Building application..."

    cd "$APP_DIR"

    # Install dependencies
    log_info "Installing dependencies..."
    pnpm install

    # Build Next.js (no standalone - uses pnpm start for production)
    log_info "Building Next.js..."
    pnpm build

    log_success "Build complete"
}

# Install systemd service
install_service() {
    log_info "Installing systemd service..."

    # Copy service file
    sudo cp "$APP_DIR/oracle-deployment/mission-control.service" /etc/systemd/system/mission-control.service
    sudo systemctl daemon-reload
    sudo systemctl enable mission-control

    log_success "systemd service installed and enabled"
}

# Setup environment
setup_env() {
    log_info "Setting up environment..."

    cd "$APP_DIR"

    if [ ! -f .env ]; then
        log_warn "No .env file found!"

        # Generate secrets
        JWT_SECRET=$(openssl rand -hex 32)
        BACKDOOR_SECRET=$(openssl rand -hex 16)

        cat > .env << EOF
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
ADMIN_BACKDOOR_SECRET=$BACKDOOR_SECRET
EOF

        log_success "Created .env with generated secrets"
    else
        log_info ".env file already exists"
    fi
}

# Initialize database
init_database() {
    log_info "Initializing database..."

    cd "$APP_DIR"

    # Ensure data directory exists
    mkdir -p data/db

    # Run database migrations (if drizzle is set up)
    # pnpm db:push || log_warn "Database push failed - may already be initialized"

    log_success "Database initialized"
}

# Start services
start_services() {
    log_info "Starting Mission Control..."

    sudo systemctl start mission-control

    # Wait for startup
    sleep 5

    if sudo systemctl is-active --quiet mission-control; then
        log_success "Mission Control is running on port 3000"
    else
        log_error "Mission Control failed to start. Check logs: journalctl -u mission-control -n 50"
        sudo journalctl -u mission-control -n 20 --no-pager
    fi
}

# Stop services
stop_services() {
    log_info "Stopping Mission Control..."
    sudo systemctl stop mission-control || true
    log_success "Mission Control stopped"
}

# Restart services
restart_services() {
    log_info "Restarting Mission Control..."
    sudo systemctl restart mission-control
    sleep 5
    if sudo systemctl is-active --quiet mission-control; then
        log_success "Mission Control restarted"
    else
        log_error "Restart failed. Check: journalctl -u mission-control -n 50"
    fi
}

# Show logs
show_logs() {
    sudo journalctl -u mission-control -f -n 100
}

# Show status
show_status() {
    sudo systemctl status mission-control --no-pager || true

    echo ""
    log_info "Health checks:"

    # Check API
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "API: http://localhost:3000 - OK"
    else
        log_error "API: http://localhost:3000 - FAILED"
    fi

    echo ""
    log_info "Access Mission Control at: http://129.159.38.45:3000"
    echo ""
    log_info "Memory usage:"
    free -h
}

# Full setup (first time)
full_setup() {
    log_info "Starting full setup for Oracle Cloud..."

    # Clone repository
    if [ ! -d "$APP_DIR" ]; then
        log_info "Cloning repository..."
        git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    else
        log_info "Repository already cloned"
    fi

    cd "$APP_DIR"

    install_pnpm
    setup_env
    init_database
    build_app
    install_service
    start_services

    echo ""
    log_success "==================================="
    log_success "Mission Control is now running!"
    log_success "==================================="
    echo ""
    log_info "Access at: http://129.159.38.45:3000"
    show_status
}

# Deploy latest code
deploy() {
    log_info "Deploying latest code..."

    cd "$APP_DIR"

    # Pull latest changes
    git fetch origin
    git pull origin "$BRANCH" || git pull origin main || git pull origin master

    # Rebuild
    build_app

    # Restart
    restart_services

    log_success "Deployment complete!"
    show_status
}

# Main command handler
case "${1:-}" in
    setup)
        full_setup
        ;;
    deploy)
        deploy
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    build)
        build_app
        ;;
    *)
        echo "Mission Control Oracle Cloud Deployment"
        echo ""
        echo "Usage: $0 {setup|deploy|start|stop|restart|logs|status|build}"
        echo ""
        echo "Commands:"
        echo "  setup   - First-time setup (clone, install, build, start)"
        echo "  deploy  - Deploy latest code from git"
        echo "  start   - Start services"
        echo "  stop    - Stop services"
        echo "  restart - Restart services"
        echo "  logs    - Show application logs"
        echo "  status  - Show service status"
        echo "  build   - Build the application"
        exit 1
        ;;
esac
