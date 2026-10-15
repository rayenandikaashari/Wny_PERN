require('dotenv').config();

module.exports = {
  migrationsTable: 'pgmigrations',
  dir: 'migrations',
  direction: 'up',
  databaseUrl: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  log: console.log,
};
