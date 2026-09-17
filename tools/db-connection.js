const { Pool } = require('pg');
const config = require('./config.js');

const pool = new Pool({
  connectionString: config.postgres.connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = { pool };