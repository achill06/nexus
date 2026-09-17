function cleanHTML(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanListing(listing) {
  if (typeof listing !== 'object' || listing === null) return listing;
  const cleaned = { ...listing };
  if (cleaned.description && typeof cleaned.description === 'string') {
    cleaned.description = cleanHTML(cleaned.description);
  }
  return cleaned;
}

function buildExtractionPrompt(rawListing) {
  const listing = cleanListing(rawListing);
  const rawDataJson = JSON.stringify(listing, null, 2);

  return `You are a strict data extraction system. Parse the following raw job/internship listing and return a single JSON object strictly matching the schema below.

### SCHEMA & EXTRACTION RULES

Extract a JSON object with these exact keys:

1. "title": (string) Position title.
2. "company": (string) Hiring company or organization.
3. "location": (string) Location stated in the post, or "Not specified" if not provided.
4. "remote_ok": (string) Must be EXACTLY one of: "yes", "no", or "not_specified".
   - "yes": If explicitly described as remote, work-from-home, or location-independent.
   - "no": If explicitly described as strictly on-site or in-person.
   - "not_specified": If remote status is not mentioned at all. Do NOT guess.
5. "experience_level": (string) Must be EXACTLY one of: "intern", "entry", "mid", "senior".
   - Default to "intern" if the listing is an internship, co-op, or targets a student.
   - Otherwise, select the best fitting tier based on required experience.
6. "stipend": (string or null) Pay, stipend, or salary mentioned (e.g., "$35/hr", "₹30,000/month", "$100k-$120k").
   - Must be null if no pay or compensation is mentioned anywhere in the post.
   - Do NOT output string literals like "N/A", "unpaid", or "not specified".
7. "deadline": (string or null) Application deadline date if explicitly specified.
   - Must be null if no deadline is stated.
   - Do NOT guess or convert relative phrases (e.g., "apply ASAP", "rolling basis") into precise dates.
8. "required_skills": (array of strings) Technical skills, programming languages, frameworks, or domain tools mentioned (e.g., ["JavaScript", "React", "Python"]).
   - Output an empty array [] if no specific skills are found.

### STRICT OUTPUT FORMAT

- Respond ONLY with the JSON object.
- Do NOT wrap the response in markdown code blocks or fences (do NOT use \`\`\` or \`\`\`json).
- Do NOT include intro text, comments, or explanations.

### RAW LISTING DATA

${rawDataJson}`;
}

module.exports = { buildExtractionPrompt };