const { pool } = require('./db-connection');

async function getCachedJustification(resumeId, listingId) {
  const result = await pool.query(
    `
    SELECT justification
    FROM match_justifications
    WHERE resume_id=$1
      AND structured_listing_id=$2
    `,
    [resumeId, listingId]
  );

  return result.rows[0]?.justification;
}

async function saveCachedJustification(resumeId, listingId, justification) {
  await pool.query(
    `
    INSERT INTO match_justifications
      (resume_id, structured_listing_id, justification)
    VALUES ($1,$2,$3)
    ON CONFLICT (resume_id, structured_listing_id)
    DO UPDATE SET
      justification=EXCLUDED.justification,
      created_at=NOW()
    `,
    [resumeId, listingId, justification]
  );
}
module.exports = {getCachedJustification,saveCachedJustification};