const config = require('../tools/config.js');
const fs = require('fs');
const path = require('path');

async function fetchData(){
    const url = config.remoteok.startUrl;
    const retryCount = config.shared.retries;
    const delay = config.shared.requestDelay;
    const timeout = config.shared.timeout;
    let rawjobData = [];
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const response = await fetch(url,{ headers: config.remoteok.headers,  method: 'GET', signal: AbortSignal.timeout(timeout) });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const time = new Date().toISOString();
            const rawList = Array.isArray(data) ? data.slice(1) : []; // Remove the first element which is metadata
            rawjobData = rawList.map(job => ({
                ...job,
                source_url: job.url||url,
                scraped_at: time,
            }));
            console.log(`Fetched ${rawjobData.length} jobs from RemoteOK at ${time}`);
            break; // Exit the loop if the request was successful
        } catch (error) {
            const islastAttempt = attempt === retryCount;
            console.error('There was a problem fetching the data:', error);
            if (!islastAttempt) {
                console.log(`Retrying... (${attempt}/${retryCount})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            else {
                throw new Error('Max retries reached for RemoteOK. Exiting.');
            }
        }
    }
    const outputPath = config.remoteok.outputPath;
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(rawjobData, null, 2));
    return rawjobData;
}
if (require.main === module) {fetchData().catch((error) => { console.error('Scraper failed:', error.message); });}
module.exports = { fetchData };
