const { ListingSchema } = require('./schema');
const { callLLM } = require('./llm-client');
const { buildExtractionPrompt } = require('./prompt');
const config = require('../tools/config');

const MAX_REPAIR_ATTEMPTS = config.groq.repairAttempts;

function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    return JSON.parse(fenced[1].trim());
  }

  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('No JSON object found in response');
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function describeZodError(zodError) {
  return zodError.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

function buildRepairPrompt(originalPrompt, badResponse, errorMessage) {
  return `Your previous response did not satisfy the required format.

Error: ${errorMessage}

Your previous response was:
${badResponse}

Reply again with ONLY corrected JSON matching the schema exactly no prose, no markdown fences.

Original instructions:
${originalPrompt}`;
}

async function extractListing(rawListing) {
  const originalPrompt = buildExtractionPrompt(rawListing);
  let currentPrompt = originalPrompt;
  let lastRawResponse = null;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
    let rawResponse;
    try {
      rawResponse = await callLLM(currentPrompt);
    } catch (error) {
      return { success: false, error: `LLM call failed: ${error.message}`, lastRawResponse: null, attempts: attempt };
    }

    lastRawResponse = rawResponse;

    let parsed;
    try {
      parsed = extractJSON(rawResponse);
    } catch (error) {
      lastError = `Invalid JSON: ${error.message}`;
      console.warn(`extractListing: attempt ${attempt} failed (${lastError}), retrying...`);
      currentPrompt = buildRepairPrompt(originalPrompt, rawResponse, lastError);
      continue;
    }

    const result = ListingSchema.safeParse(parsed);
    if (result.success) {
      return { success: true, data: result.data, attempts: attempt };
    }

    lastError = `Schema validation failed: ${describeZodError(result.error)}`;
    console.warn(`extractListing: attempt ${attempt} failed (${lastError}), retrying...`);
    currentPrompt = buildRepairPrompt(originalPrompt, rawResponse, lastError);
  }

  return {
    success: false,
    error: `Gave up after ${MAX_REPAIR_ATTEMPTS} attempts: ${lastError}`,
    lastRawResponse,
    attempts: MAX_REPAIR_ATTEMPTS,
  };
}

module.exports = { extractListing };