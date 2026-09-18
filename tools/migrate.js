const { pool } = require('./db-connection.js');
async function initDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS raw_listings (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        natural_key TEXT NOT NULL,
        company TEXT,
        role_title TEXT,
        source_url TEXT,
        scraped_at TIMESTAMPTZ NOT NULL,
        raw_fields JSONB,
        extraction_status TEXT NOT NULL DEFAULT 'pending',
        extracted_at TIMESTAMPTZ,
        UNIQUE (source, natural_key)
        );
    `;
    const createStructuredListingsQuery = `
        CREATE TABLE IF NOT EXISTS structured_listings (
        id SERIAL PRIMARY KEY,
        raw_listing_id INTEGER NOT NULL UNIQUE REFERENCES raw_listings(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        remote_ok TEXT NOT NULL,
        stipend TEXT,
        required_skills TEXT[] NOT NULL DEFAULT '{}',
        experience_level TEXT NOT NULL,
        deadline TEXT,
        extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        embedding VECTOR(768)
        );
    `;
    const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `;
    const createResumesTableQuery = `
        CREATE TABLE IF NOT EXISTS resumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resume_data TEXT NOT NULL,
        embedding VECTOR(768),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `;
    const createShortlistTableQuery = `
        CREATE TABLE IF NOT EXISTS shortlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        structured_listing_id INTEGER NOT NULL REFERENCES structured_listings(id) ON DELETE CASCADE,
        match_score REAL,
        justification TEXT,
        saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, structured_listing_id)
        );
    `;
    const createMatchJustificationsQuery = `
        CREATE TABLE IF NOT EXISTS match_justifications (
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        structured_listing_id INTEGER NOT NULL REFERENCES structured_listings(id) ON DELETE CASCADE,
        justification TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (resume_id, structured_listing_id)
    );
  `;

    try{
        console.log('Initializing database...');
        await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('pgvector extension enabled.');
        await pool.query(createTableQuery);
        console.log('Raw listings table initialized successfully.');
        await pool.query(createStructuredListingsQuery);
        console.log('Structured listings table initialized successfully.');
        await pool.query(createUsersTableQuery);
        console.log('Users table initialized successfully.');
        await pool.query(createResumesTableQuery);
        console.log('Resumes table initialized successfully.');
        await pool.query(createShortlistTableQuery);
        console.log('Shortlist table initialized successfully.');
        await pool.query(createMatchJustificationsQuery);
        console.log('Match justifications table initialized successfully.');
        console.log('Database initialized successfully.');
    }
    catch (error) {
        console.error('Error initializing database:', error);
    }
    finally {
        console.log('Closing database connection...');
        await pool.end();
    }
}
initDatabase();