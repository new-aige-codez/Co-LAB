// PM2 Ecosystem Configuration for Co-LAB
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'co-lab',
      script: 'dist/web/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      // Logging
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    // Optional: Run the Telegram bot separately
    // {
    //   name: 'mission-control-bot',
    //   script: 'dist/bot.js',
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '200M',
    // },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/mission-control.git',
      path: '/var/www/mission-control',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git -y',
    },
  },
};
