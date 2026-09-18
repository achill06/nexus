const { extractTextFromPDF } = require('./pdf-parser');
const { embedText } = require('./embeddings');
const { saveResumeEmbedding, findTopMatches } = require('../tools/embeddings-db');
const { replaceResume, getLatestResume } = require('../tools/resumes-db');
const { generateJustification } = require('./justify-prompt');
const { getCachedJustification, saveCachedJustification } = require('../tools/match-cache-db');

async function processResumeUpload(userId, pdfBuffer) {
  const resumeText = await extractTextFromPDF(pdfBuffer);
  const resumeId = await replaceResume(userId, resumeText);

  const embedding = await embedText(resumeText);
  await saveResumeEmbedding(resumeId, embedding);

  return { resumeId, resumeText };
}

async function getMatchesForUser(userId, limit = 10) {
  const resume = await getLatestResume(userId);
  if (!resume) {
    throw new Error('match: no resume on file for this user');
  }
  if (!resume.embedding) {
    throw new Error('match: resume has not finished embedding yet, try again shortly');
  }

  const listings = await findTopMatches(resume.embedding, userId, limit);

  const matches = [];
  for (const listing of listings) {
    let justification = await getCachedJustification(resume.id, listing.id);
    if (!justification?.trim()) {
      try {
        justification = await generateJustification(resume.resumeData, listing);
      } catch (error) {
        console.error(`match: justification failed for listing ${listing.id}: ${error.message}`);
        justification = null;
      }
      if (justification) {
        await saveCachedJustification(resume.id, listing.id, justification);
      }
    }
    matches.push({ ...listing, justification });
  }

  return matches;
}

module.exports = { processResumeUpload, getMatchesForUser };