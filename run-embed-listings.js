const {pool} = require('./tools/db-connection.js');
const {embedText} = require('./matching/embeddings.js');
const {saveListingEmbedding} = require('./tools/embeddings-db.js');

async function runEmbedListings(){
    const result = await pool.query('SELECT id, title, company, location, required_skills, experience_level FROM structured_listings WHERE embedding IS NULL');
    const pending = result.rows;
    console.log(`Found ${pending.length} listings to embed.`);

    let succeeded = 0;
    let failed = 0;
    for (const listing of pending) {
        try {
            const textToEmbed = `${listing.title} ${listing.company} ${listing.location} ${listing.required_skills} ${listing.experience_level}`;
            const embedding = await embedText(textToEmbed);
            await saveListingEmbedding(listing.id, embedding);
            succeeded++;
            console.log(`[${succeeded + failed}/${pending.length}] Embedded: ${listing.title}`);
        } catch (error) {
            failed++;
            console.error(`[${succeeded + failed}/${pending.length}] Failed listing ${listing.id}:`, error.message);
        }
    }

    console.log(`Done. Succeeded: ${succeeded}, Failed: ${failed}`);
    await pool.end();
}

runEmbedListings().catch(error => {
    console.error('Error running embedding process:', error);
});