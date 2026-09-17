const { pool } = require('./db-connection.js');
const pgvector = require('pgvector');

async function saveListingEmbedding(listingId, embedding) {
  await pool.query(
    'UPDATE structured_listings SET embedding = $1 WHERE id = $2',
    [pgvector.toSql(embedding), listingId]
  );
}

async function saveResumeEmbedding(resumeId, embedding) {
  await pool.query(
    'UPDATE resumes SET embedding = $1 WHERE id = $2',
    [pgvector.toSql(embedding), resumeId]
  );
}

async function findTopMatches(resumeEmbedding, userId, limit = 10) {
  const result = await pool.query(
    `SELECT id, title, company, location, remote_ok, stipend, required_skills, experience_level, deadline,
            1 - (embedding <=> $1) AS similarity
     FROM structured_listings
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [pgvector.toSql(resumeEmbedding), limit]
  );
  return result.rows;
}

module.exports = { saveListingEmbedding, saveResumeEmbedding, findTopMatches };