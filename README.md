# NEXUS: Autonomous Career Intelligence Agent

Full-stack pipeline that scrapes job/internship listings, structures them with an LLM,
matches them semantically against a user's resume, and lets users save results to a
personal shortlist. Built for the AI & Software Guild Software Development recruitment.

## Setup

### 1. Postgres

Install locally, create a database and user, enable `pgvector`:

```bash
sudo apt install postgresql postgresql-contrib postgresql-<version>-pgvector
sudo -u postgres psql
```

```sql
CREATE DATABASE nexus;
CREATE USER nexus_user WITH PASSWORD '<your-password>';
GRANT ALL PRIVILEGES ON DATABASE nexus TO nexus_user;
\c nexus
GRANT ALL ON SCHEMA public TO nexus_user;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://nexus_user:<password>@localhost:5432/nexus
GITHUB_TOKEN=<personal access token, no scopes needed, used only to raise the read rate limit on public repo content>
GEMINI_API_KEY=<your Gemini API key>
GROQ_API_KEY=<your Groq API key, used for LLM extraction>
JWT_SECRET=<random 32-byte hex string>
PORT=3000
```

Generate a `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Initialize the schema

```bash
node tools/migrate.js
```

### 5. Run the pipeline

Each script is independently re-runnable and safe to repeat, nothing gets duplicated or reprocessed unnecessarily.

```bash
node run-scrapers.js       # scrapes RemoteOK + GitHub, dedupes, persists
node run-extraction.js     # LLM-structures pending raw listings
node run-embed-listings.js # generates embeddings for structured listings
```

### 6. Start the server

```bash
node server.js
```

### 7. Frontend

See `frontend/README.md` (separate Vite app), or run:

```bash
cd frontend
npm install
npm run dev
```

## Architecture

**Pipeline flow:**

1. **Scrapers** (RemoteOK API, GitHub Contents API) fetch raw listing data.
2. Raw listings are deduplicated by natural key and persisted to **`raw_listings`** (Postgres).
3. **LLM Extraction** (Gemini/Groq, model swapped based on quota availability) structures each raw listing into a fixed schema, validated against Zod with a retry-and-repair loop on malformed output.
4. Valid results are persisted to **`structured_listings`**.
5. **Embeddings** (Gemini `gemini-embedding-001`, 768-dim) are generated for each structured listing and stored in a `pgvector` column.
6. A user uploads a **resume (PDF)**, text is extracted, embedded, and stored per-user.
7. **Cosine similarity** ranks listings against the resume embedding, and a one-line **LLM justification** is generated per top match.
8. Users can save results to a personal **shortlist**.

**Auth & multi-tenancy:** email/password, bcrypt-hashed, JWT-based sessions. Every user-scoped table (`resumes`, `shortlist`) carries a `user_id` foreign key, and every query is explicitly filtered by the authenticated user's ID taken from the verified JWT, never from a client-supplied ID.

## Deduplication strategy

Each source has a **natural key**, a value the source itself treats as unique, rather than a hash of content:

- **RemoteOK**: the job's own numeric `id` field, confirmed unique across a full scrape.
- **GitHub** (Simplify internships repo): the listing's `job_url` (apply link), confirmed unique across all rows in the source README.

On each scraper run, new records are compared against what's already stored by natural key:

- No match found → inserted as new.
- Match found, but content differs (title, location, flags, etc. excluding volatile fields like `scraped_at`) → treated as an edit; the existing row is updated in place and its `extraction_status` is reset to `'pending'` so it gets re-extracted.
- Match found, content identical → skipped.

This also serves as basic change detection for free. A `UNIQUE (source, natural_key)` constraint on `raw_listings` enforces this at the database level as a safety net against application-level bugs.

## What's unfinished

- **The Agent (tool-calling chat interface)**: not implemented. Planned approach: an Express route accepting a chat message, using an LLM's function-calling API with at least three tools (e.g. `getShortlistedListings`, `getUpcomingDeadlines`, `getSkillFrequency`), each backed by a parameterized query scoped to the authenticated user, never a raw dump of rows into the prompt.
- **Video Briefing**: not implemented. Planned approach: an LLM-written 60–90s script from the user's top 3 matches, sent to a video/TTS API, with a `briefings` table tracking job status (`queued`/`processing`/`done`/`failed`) polled asynchronously by the frontend rather than blocking a request thread.
- **Justification generation is sequential, not parallel**: a deliberate choice after hitting daily/per-minute token quota limits during development on multiple free-tier LLM providers. Parallelizing would very likely retrigger those limits. This makes `GET /matching/matches` noticeably slow (multiple seconds for 10 results) but reliable.
- **No scheduled/cron re-scraping**: the pipeline is manually triggered via the three `run-*.js` scripts; no automation wraps them yet.
- **No cost dashboard**: token/cost tracking per feature isn't implemented.
- **Extraction coverage is not 100%**: [insert your final `structured_listings` count here] out of 1683 total scraped listings were successfully extracted. The remainder hit LLM provider quota exhaustion during development across several free-tier models and providers tried in sequence (Gemini, then several Groq models). All un-extracted rows remain correctly marked `'pending'` and will be picked up by a future `run-extraction.js` run with available quota.