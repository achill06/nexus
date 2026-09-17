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
    `SELECT l.id, l.title, l.company, l.location, l.remote_ok, l.stipend,
            l.required_skills, l.experience_level, l.deadline,
            COALESCE(
              r.raw_fields->>'apply_url',
              r.raw_fields->>'job_url',
              r.raw_fields->>'url',
              r.source_url
            ) AS apply_url,
            1 - (l.embedding <=> $1) AS similarity
     FROM structured_listings l
     LEFT JOIN raw_listings r ON r.id = l.raw_listing_id
     WHERE l.embedding IS NOT NULL
     ORDER BY l.embedding <=> $1
     LIMIT $2`,
    [pgvector.toSql(resumeEmbedding), limit]
  );
  return result.rows;
}

module.exports = { saveListingEmbedding, saveResumeEmbedding, findTopMatches };