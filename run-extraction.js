const { getPendingList, saveExtractionResult } = require('./tools/structured-db.js');
const { extractListing } = require('./extraction/extract.js');

async function runExtraction() {
  const pendingList = await getPendingList();
  console.log(`Found ${pendingList.length} pending listings to extract.`);

  let succeeded = 0;
  let failed = 0;

  for (const listing of pendingList) {
    try {
      const extractionResult = await extractListing(listing);
      await saveExtractionResult(listing.id, extractionResult);

      if (extractionResult.success) {
        succeeded++;
        console.log(`[${succeeded + failed}/${pendingList.length}] Extracted: ${listing.role_title ?? listing.position ?? listing.job_title}`);
      } else {
        failed++;
        console.warn(`[${succeeded + failed}/${pendingList.length}] Failed: ${extractionResult.error}`);
      }
    } catch (error) {
      console.error(`Error processing listing ${listing.id}:`, error.message);
      failed++;
    }
  }
  console.log(`Done. Succeeded: ${succeeded}, Failed: ${failed}`);
}

runExtraction().catch(error => {
  console.error('Error running extraction:', error.message);
});