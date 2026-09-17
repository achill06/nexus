const { callLLM } = require('../extraction/llm-client');

const MAX_RESUME_CHARS = 4000;

function formatSkills(skills) {
  if (!Array.isArray(skills) || skills.length === 0) return 'not specified';
  return skills.join(', ');
}

function buildJustificationPrompt(resumeText, listing) {
  const trimmedResume =
    resumeText.length > MAX_RESUME_CHARS ? `${resumeText.slice(0, MAX_RESUME_CHARS)}...`: resumeText;

  return `You are matching a candidate's resume to a job/internship listing.

RESUME:
${trimmedResume}

LISTING:
Title: ${listing.title}
Company: ${listing.company}
Location: ${listing.location}
Remote: ${listing.remote_ok}
Required skills: ${formatSkills(listing.required_skills)}
Experience level: ${listing.experience_level}

Write exactly one sentence (max 25 words) explaining why this listing is a good match for
this specific candidate, referencing something concrete from their resume. Plain text only,
no markdown, no quotation marks, no preamble like "This listing is a good match because" —
start directly with the reasoning.`;
}

async function generateJustification(resumeText, listing) {
  const prompt = buildJustificationPrompt(resumeText, listing);
  const rawText = await callLLM(prompt);
  return rawText.replace(/\s+/g, ' ').trim();
}

module.exports = { generateJustification, buildJustificationPrompt };