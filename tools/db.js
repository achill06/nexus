const { pool } = require('./db-connection.js');
const { buildKey } = require('./dedup.js');
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
async function getPreviousRecords(source) {
  const result = await pool.query('SELECT * FROM raw_listings WHERE source = $1', [source]);
  return result.rows.map(row => unsplitRecord(row, source));
}
function splitRecord(record, source) {
    if (source === 'remoteok') {
        const { company, position, source_url, scraped_at, ...rest } = record;
        return {
            company,
            role_title: position,
            source_url,
            scraped_at,
            raw_fields: rest
        };
    }
    if (source === 'github') {
        const { company, job_title, source_url, scraped_at, ...rest } = record;
        return {
            company,
            role_title: job_title,
            source_url,
            scraped_at,
            raw_fields: rest
        };
    }
    throw new Error(`Unknown source: ${source}`);
}

async function insertRecords(source, records){
    for (const record of records) {
        let naturalKey = buildKey(record, source);
        let newRecord = splitRecord(record, source);
        await pool.query(
            'INSERT INTO raw_listings (source, natural_key, company, role_title, source_url, scraped_at, raw_fields, extraction_status) VALUES ($1, $2, $3, $4, $5, $6, $7, \'pending\')',
            [source, naturalKey, newRecord.company, newRecord.role_title, newRecord.source_url, newRecord.scraped_at, JSON.stringify(newRecord.raw_fields)]
        );
    }
}
async function updateRecords(source, records){
    for (const { old, updated } of records) {
        let naturalKey = buildKey(updated, source);
        let newRecord = splitRecord(updated, source);
        await pool.query(
            'UPDATE raw_listings SET company = $1, role_title = $2, source_url = $3, scraped_at = $4, raw_fields = $5, extraction_status = \'pending\' WHERE source = $6 AND natural_key = $7',
            [newRecord.company, newRecord.role_title, newRecord.source_url, newRecord.scraped_at, JSON.stringify(newRecord.raw_fields), source, naturalKey]
        );
    }
}
module.exports = {getPreviousRecords,insertRecords,updateRecords};