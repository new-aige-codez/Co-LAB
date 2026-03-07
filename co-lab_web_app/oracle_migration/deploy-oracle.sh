#!/bin/bash
#
# Co-LAB Oracle Cloud Deployment Script
#
# Usage: ./deploy-oracle.sh [command]
#
# Commands:
#   setup     - First-time setup (install Node.js, PM2, dependencies)
#   deploy    - Deploy latest code (git pull, build, restart)
#   start     - Start services with PM2
#   stop      - Stop services
#   restart   - Restart services
#   logs      - Show logs
#   status    - Show status
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="co-lab"
APP_DIR="/home/ubuntu/co-lab"
NODE_VERSION="20"

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

# Check if running on Ubuntu
check_os() {
    if [ ! -f /etc/os-release ]; then
        log_error "This script is designed for Ubuntu/Debian"
        exit 1
    fi
}

# Install Node.js
install_nodejs() {
    log_info "Installing Node.js $NODE_VERSION..."

    if command -v node &> /dev/null; then
        CURRENT_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_VERSION" -ge "$NODE_VERSION" ]; then
            log_success "Node.js $CURRENT_VERSION already installed"
            return
        fi
    fi

    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
    sudo apt install -y nodejs

    log_success "Node.js $(node -v) installed"
}

# Install PM2
install_pm2() {
    log_info "Installing PM2..."

    if command -v pm2 &> /dev/null; then
        log_success "PM2 already installed"
        return
    fi

    sudo npm install -g pm2
    log_success "PM2 installed"
}

# Install system dependencies
install_dependencies() {
    log_info "Installing system dependencies..."

    sudo apt update
    sudo apt install -y \
        build-essential \
        python3 \
        git \
        curl \
        wget \
        sqlite3 \
        nginx

    log_success "System dependencies installed"
}

# Setup application
setup_app() {
    log_info "Setting up application..."

    cd "$APP_DIR"

    # Install npm dependencies
    log_info "Installing root dependencies..."
    npm install

    log_info "Installing web dependencies..."
    cd web && npm install && cd ..

    # Create logs directory
    mkdir -p logs

    # Create store directory
    mkdir -p store/memory/enterprise

    # Check for .env file
    if [ ! -f .env ]; then
        log_warn "No .env file found!"
        log_info "Creating .env from example..."
        cp .env.example .env
        log_warn "Please edit .env with your credentials:"
        log_warn "  nano $APP_DIR/.env"
    fi

    log_success "Application setup complete"
}

# Build application
build_app() {
    log_info "Building application..."

    cd "$APP_DIR"

    # Build TypeScript
    npm run build

    # Build web app (optional - can run dev mode)
    cd web && npm run build && cd ..

    log_success "Build complete"
}

# Start services
start_services() {
    log_info "Starting services..."

    cd "$APP_DIR"

    # Start with PM2
    pm2 start ecosystem.config.js

    # Save PM2 configuration
    pm2 save

    # Setup startup script
    pm2 startup | tail -n 1 | bash || true

    log_success "Services started"
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    pm2 stop $APP_NAME || true
    log_success "Services stopped"
}

# Restart services
restart_services() {
    log_info "Restarting services..."
    pm2 restart $APP_NAME || start_services
    log_success "Services restarted"
}

# Show logs
show_logs() {
    pm2 logs $APP_NAME --lines 100
}

# Show status
show_status() {
    pm2 status

    echo ""
    log_info "Health checks:"

    # Check API
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "API: http://localhost:3001 - OK"
    else
        log_error "API: http://localhost:3001 - FAILED"
    fi

    # Check Web UI
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "Web UI: http://localhost:3000 - OK"
    else
        log_warn "Web UI: http://localhost:3000 - Not running or in dev mode"
    fi
}

# Deploy latest code
deploy() {
    log_info "Deploying latest code..."

    cd "$APP_DIR"

    # Pull latest changes
    git fetch origin
    git pull origin main || git pull origin master

    # Install new dependencies
    npm install
    cd web && npm install && cd ..

    # Rebuild
    build_app

    # Restart
    restart_services

    log_success "Deployment complete!"
    show_status
}

# Full setup (first time)
full_setup() {
    log_info "Starting full setup for Oracle Cloud..."

    check_os
    install_dependencies
    install_nodejs
    install_pm2
    setup_app
    build_app
    start_services

    echo ""
    log_success "==================================="
    log_success "Co-LAB is now running!"
    log_success "==================================="
    echo ""
    log_info "Next steps:"
    echo "  1. Edit .env: nano $APP_DIR/.env"
    echo "  2. Restart: pm2 restart $APP_NAME"
    echo "  3. View logs: pm2 logs $APP_NAME"
    echo ""
    log_info "Access the Web UI at: http://<YOUR_PUBLIC_IP>"
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
        echo "Co-LAB Oracle Cloud Deployment"
        echo ""
        echo "Usage: $0 {setup|deploy|start|stop|restart|logs|status|build}"
        echo ""
        echo "Commands:"
        echo "  setup   - First-time setup (install everything)"
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
