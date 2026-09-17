const { pool } = require('./db-connection.js');;
function unsplitRecord(row, source) {
  const roleFieldName = source === 'remoteok' ? 'position' : 'job_title';
  return {
    company: row.company,
    [roleFieldName]: row.role_title,
    source_url: row.source_url,
    scraped_at: row.scraped_at,
    ...row.raw_fields
  };
}
async function getPendingList() {
  const result = await pool.query("SELECT * FROM raw_listings WHERE extraction_status = 'pending'");
  return result.rows.map(row => ({
    ...unsplitRecord(row, row.source),
    id: row.id,
  }));
}
async function saveExtractionResult(rawListingId, extractionResult) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (extractionResult.success) {
      const { title, company, location, remote_ok, stipend, required_skills, experience_level, deadline } = extractionResult.data;
      await client.query(
        `INSERT INTO structured_listings (raw_listing_id, title, company, location, remote_ok, stipend, required_skills, experience_level, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (raw_listing_id) DO UPDATE SET
           title = EXCLUDED.title, company = EXCLUDED.company, location = EXCLUDED.location,
           remote_ok = EXCLUDED.remote_ok, stipend = EXCLUDED.stipend, required_skills = EXCLUDED.required_skills,
           experience_level = EXCLUDED.experience_level, deadline = EXCLUDED.deadline, extracted_at = NOW()`,
        [rawListingId, title, company, location, remote_ok, stipend, required_skills, experience_level, deadline]
      );
      await client.query(
        `UPDATE raw_listings SET extraction_status = 'extracted', extracted_at = NOW() WHERE id = $1`,
        [rawListingId]
      );
    } else {
      const isInfraFailure = extractionResult.error.startsWith('LLM call failed:');
      if (isInfraFailure) {
        console.warn(`Listing ${rawListingId}: infra failure, leaving as 'pending' for retry — ${extractionResult.error}`);
      } else {
        await client.query(
          `UPDATE raw_listings SET extraction_status = 'failed' WHERE id = $1`,
          [rawListingId]
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
module.exports = {unsplitRecord, getPendingList, saveExtractionResult};