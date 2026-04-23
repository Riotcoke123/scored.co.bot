module.exports = {
  apps: [
    {
      name: "spictank-backup-bot",
      script: "./bot.js",
      // Ensures the bot restarts if it crashes
      autorestart: true,
      // Watches for file changes to restart (optional, set to false for production)
      watch: false,
      // Maximum memory before PM2 restarts the bot
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      // Logs are stored in the default PM2 location (~/.pm2/logs)
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true
    },
  ],
};