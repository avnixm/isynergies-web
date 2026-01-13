require('dotenv').config();

module.exports = {
  schema: './backend/db/schema.js',
  out: './backend/db/migrations',
  driver: 'mysql2',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'isynergies_db',
  },
  verbose: true,
  strict: true,
};
