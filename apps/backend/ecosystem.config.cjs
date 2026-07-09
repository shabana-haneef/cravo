module.exports = {
  apps: [{
    name: 'cravo-backend',
    script: './src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    // Zero Downtime Deployments
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
