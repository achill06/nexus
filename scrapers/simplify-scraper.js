const config = require('../tools/config.js');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

function parseSimplifyTable(html, sourceUrl, scrapedAt) {
  const $ = cheerio.load(html);
  const rows = [];
  let lastCompany = '';
  let lastCompanyUrl = '';
  $('tbody tr').each((_,tr)=> {
    const tds = $(tr).find('td');
    if(tds.length<4) {return;}
    const col1 = $(tds[0]).text().trim();
    if(col1.startsWith('↳')){}
    else{
        lastCompany = col1;
        lastCompanyUrl = $(tds[0]).find('a').attr('href') || '';
    }
    let jobTitleraw = $(tds[1]).text().trim();
    const flags = {
      no_sponsorship: jobTitleraw.includes('🛂'),
      us_citizens_only: jobTitleraw.includes('🇺🇸'),
      application_closed: jobTitleraw.includes('🔒'),
      is_faang: jobTitleraw.includes('🔥'),
      requires_advanced_degree: jobTitleraw.includes('🎓')
    };
    let jobTitle = jobTitleraw.replace(/🛂|🇺🇸|🔒|🔥|🎓/g, '').replace(/\s+/g, ' ').trim();
    let jobUrl = $(tds[3]).find('a').attr('href') || '';
    let locationHtml = $(tds[2]).html() || '';
    let locations = locationHtml.split(/<br\s*\/?>/i).map(loc => cheerio.load(loc).text().trim()).filter(loc => loc.length > 0);
    if(locations.length==0){locations.push('Unknown');}
    rows.push({
      company: lastCompany,
      company_url: lastCompanyUrl,
      job_title: jobTitle,
      job_url: jobUrl,
      locations: locations,
      flags: flags,
      source_url: sourceUrl,
      scraped_at: scrapedAt
    });
  });
  return rows;
}
async function fetchData(){
    const url = config.github.startUrl;
    const retryCount = config.shared.retries;
    const delay = config.shared.requestDelay;
    const timeout = config.shared.timeout;
    let rawjobData = [];
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const response = await fetch(url,{ headers: config.github.headers,  method: 'GET', signal: AbortSignal.timeout(timeout) });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.text();
            const time = new Date().toISOString();
            rawjobData = parseSimplifyTable(data, url, time);
            if (rawjobData.length === 0) console.warn('Parsed zero rows from GitHub. Selectors may be broken')
            console.log(`Fetched ${rawjobData.length} jobs from GitHub at ${time}`);
            break; // Exit the loop if the request was successful
        } catch (error) {
            const islastAttempt = attempt === retryCount;
            console.error('There was a problem fetching the data:', error);
            if (!islastAttempt) {
                console.log(`Retrying... (${attempt}/${retryCount})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            else {
                throw new Error('Max retries reached for GitHub. Exiting.');
            }
        }
    }
    const outputPath = config.github.outputPath;
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(rawjobData, null, 2));
    return rawjobData;
}
if (require.main === module) {fetchData().catch((error) => { console.error('Scraper failed:', error.message); });}
module.exports = { fetchData, parseSimplifyTable };