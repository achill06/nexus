const { pool } = require('./db-connection.js');

async function addToShortlist(userId, listingId, matchScore, justification) {
  const result = await pool.query(
    `INSERT INTO shortlist (user_id, structured_listing_id, match_score, justification)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, structured_listing_id) DO UPDATE SET
       match_score = EXCLUDED.match_score,
       justification = EXCLUDED.justification,
       saved_at = NOW()
     RETURNING *`,
    [userId, listingId, matchScore, justification]
  );
  return result.rows[0];
}

async function removeFromShortlist(userId, listingId) {
  const result = await pool.query(
    `DELETE FROM shortlist WHERE user_id = $1 AND structured_listing_id = $2 RETURNING id`,
    [userId, listingId]
  );
  return result.rows.length > 0;
}

async function getShortlist(userId) {
  const result = await pool.query(
    `SELECT s.id AS shortlist_id, s.match_score, s.justification, s.saved_at,
            l.id AS listing_id, l.title, l.company, l.location, l.remote_ok,
            l.stipend, l.required_skills, l.experience_level, l.deadline
     FROM shortlist s
     JOIN structured_listings l ON l.id = s.structured_listing_id
     WHERE s.user_id = $1
     ORDER BY s.saved_at DESC`,
    [userId]
  );
  return result.rows;
}

module.exports = { addToShortlist, removeFromShortlist, getShortlist };