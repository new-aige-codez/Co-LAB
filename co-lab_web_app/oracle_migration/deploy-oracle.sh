#!/bin/bash
#
# Co-LAB Oracle Cloud Deployment Script
#
# Usage: ./deploy-oracle.sh [command]
#
# Commands:
#   setup     - First-time setup (install Node.js, dependencies, build, start)
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
APP_DIR="/home/ubuntu/co-lab"
SERVICE_NAME="co-lab"
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

    # Install npm dependencies (includes SWC)
    log_info "Installing root dependencies..."
    npm install

    log_info "Installing web dependencies..."
    cd web && npm install && cd ..

    # Create directories
    mkdir -p logs
    mkdir -p data

    # Check for .env file
    if [ ! -f .env ]; then
        log_warn "No .env file found!"
        log_info "Creating .env from example..."
        cp .env.example .env

        # Generate real secrets
        JWT_SECRET=$(openssl rand -hex 32)
        ENCRYPTION_KEY=$(openssl rand -hex 32)
        sed -i "s/dev-jwt-secret-change-in-production-32bytes/$JWT_SECRET/" .env
        sed -i "s/your-jwt-secret-here-change-in-production/$JWT_SECRET/" .env
        sed -i "s/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/$ENCRYPTION_KEY/" .env
        sed -i "s/your-encryption-key-here-change-in-production/$ENCRYPTION_KEY/" .env
        sed -i "s/NODE_ENV=development/NODE_ENV=production/" .env

        log_success "Generated production secrets in .env"
    fi

    log_success "Application setup complete"
}

# Build application
build_app() {
    log_info "Building application..."

    cd "$APP_DIR"

    # Build server with SWC (fast, low-memory)
    log_info "Building server with SWC..."
    npx swc src -d dist --strip-leading-paths

    # Build web app with Vite
    log_info "Building web app with Vite..."
    cd web && npm run build && cd ..

    log_success "Build complete"
}

# Install systemd service
install_service() {
    log_info "Installing systemd service..."

    # Copy service file
    sudo cp "$APP_DIR/oracle_migration/co-lab.service" /etc/systemd/system/co-lab.service
    sudo systemctl daemon-reload
    sudo systemctl enable co-lab

    log_success "systemd service installed and enabled"
}

# Configure Nginx
setup_nginx() {
    log_info "Configuring Nginx..."

    # Create nginx config for Co-LAB
    sudo tee /etc/nginx/sites-available/co-lab > /dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve built React app directly (no upstream needed)
    root /home/ubuntu/co-lab/web/dist;
    index index.html;

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # WebSocket proxy (critical for real-time)
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # SPA fallback — serves index.html for client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/co-lab /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx

    log_success "Nginx configured"
}

# Open firewall ports
setup_firewall() {
    log_info "Opening firewall ports..."

    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
    sudo netfilter-persistent save 2>/dev/null || true

    log_success "Firewall ports opened (80, 443)"
}

# Start services
start_services() {
    log_info "Starting Co-LAB..."

    sudo systemctl start co-lab

    # Wait for startup
    sleep 3

    if sudo systemctl is-active --quiet co-lab; then
        log_success "Co-LAB is running"
    else
        log_error "Co-LAB failed to start. Check logs: journalctl -u co-lab -n 50"
        sudo journalctl -u co-lab -n 20 --no-pager
    fi
}

# Stop services
stop_services() {
    log_info "Stopping Co-LAB..."
    sudo systemctl stop co-lab || true
    log_success "Co-LAB stopped"
}

# Restart services
restart_services() {
    log_info "Restarting Co-LAB..."
    sudo systemctl restart co-lab
    sleep 3
    if sudo systemctl is-active --quiet co-lab; then
        log_success "Co-LAB restarted"
    else
        log_error "Restart failed. Check: journalctl -u co-lab -n 50"
    fi
}

# Show logs
show_logs() {
    sudo journalctl -u co-lab -f -n 100
}

# Show status
show_status() {
    sudo systemctl status co-lab --no-pager || true

    echo ""
    log_info "Health checks:"

    # Check API
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "API: http://localhost:3001 - OK"
    else
        log_error "API: http://localhost:3001 - FAILED"
    fi

    # Check Nginx
    if curl -s http://localhost > /dev/null 2>&1; then
        log_success "Nginx: http://localhost - OK"
    else
        log_error "Nginx: http://localhost - FAILED"
    fi

    echo ""
    log_info "Memory usage:"
    free -h
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
    setup_app
    build_app
    install_service
    setup_nginx
    setup_firewall
    start_services

    echo ""
    log_success "==================================="
    log_success "Co-LAB is now running!"
    log_success "==================================="
    echo ""
    log_info "Service management:"
    echo "  Status:   sudo systemctl status co-lab"
    echo "  Logs:     journalctl -u co-lab -f"
    echo "  Restart:  sudo systemctl restart co-lab"
    echo ""
    log_info "Access the Web UI at: http://<YOUR_PUBLIC_IP>"
    echo ""
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
