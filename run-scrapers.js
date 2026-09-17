const { fetchData } = require('./scrapers/remoteok-scraper.js');
const { fetchData: fetchGithubData } = require('./scrapers/simplify-scraper.js');
const { insertRecords, getPreviousRecords, updateRecords } = require('./tools/db.js');
const { compareRecords } = require('./tools/dedup.js');
async function runScraper() {
    let remoteokData=null;
    let githubData=null;
    try {
        remoteokData = await fetchData();
    } catch (error) {
        console.error('Error fetching data from RemoteOK:', error.message);
    }
    try {
        githubData = await fetchGithubData();
    } catch (error) {
        console.error('Error fetching data from GitHub:', error.message);
    }
    if (remoteokData) {
        const previousRemoteokRecords = await getPreviousRecords('remoteok');
        const { toInsert: toInsertRemoteok, toUpdate: toUpdateRemoteok } = compareRecords(remoteokData, previousRemoteokRecords, 'remoteok');
        if (toInsertRemoteok.length > 0) {
            await insertRecords('remoteok', toInsertRemoteok);
            console.log(`Inserted ${toInsertRemoteok.length} new RemoteOK records.`);
        }
        if (toUpdateRemoteok.length > 0) {
            await updateRecords('remoteok', toUpdateRemoteok);
            console.log(`Updated ${toUpdateRemoteok.length} existing RemoteOK records.`);
        }
    }else{console.warn('No data fetched from RemoteOK. Skipping database operations for RemoteOK.');}
    if (githubData) {
        const previousGithubRecords = await getPreviousRecords('github');
        const { toInsert: toInsertGithub, toUpdate: toUpdateGithub } = compareRecords(githubData, previousGithubRecords, 'github');
        if (toInsertGithub.length > 0) {
            await insertRecords('github', toInsertGithub);
            console.log(`Inserted ${toInsertGithub.length} new GitHub records.`);
        }
        if (toUpdateGithub.length > 0) {
            await updateRecords('github', toUpdateGithub);
            console.log(`Updated ${toUpdateGithub.length} existing GitHub records.`);
        }
    }else{console.warn('No data fetched from GitHub. Skipping database operations for GitHub.');}
}

runScraper().catch(error => {
    console.error('Error running scraper:', error.message);
});