const { pool } = require('./db-connection.js');
const pgvector = require('pgvector');

async function replaceResume(userId, resumeText) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM resumes WHERE user_id = $1', [userId]);
    const result = await client.query(
      `INSERT INTO resumes (user_id, resume_data) VALUES ($1, $2) RETURNING id`,
      [userId, resumeText]
    );
    await client.query('COMMIT');
    return result.rows[0].id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getLatestResume(userId) {
  const result = await pool.query(
    `SELECT id, resume_data, embedding FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0){return null;}

  const row = result.rows[0];
  return {
    id: row.id,
    resumeData: row.resume_data,
    embedding: row.embedding ? pgvector.fromSql(row.embedding) : null,
  };
}

module.exports = { replaceResume, getLatestResume };