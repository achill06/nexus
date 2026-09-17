const { GoogleGenAI } = require('@google/genai');
const config = require('../tools/config');
const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

const MODEL = config.embeddings.model;
const DIMENSION = config.embeddings.dimension;
const MAX_RETRIES = config.shared.retries;
const TIMEOUT_MS = config.gemini.timeout;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Embedding request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function isRetryable(error) {
  const status = error?.status ?? error?.response?.status;
  if (status === 429) return true;
  if (status >= 500) return true;
  if (!status) return true;
  return false;
}

async function embedText(text) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.embedContent({
          model: MODEL,
          contents: text,
          config: { outputDimensionality: DIMENSION },
        }),
        TIMEOUT_MS
      );

      const vector = response.embeddings?.[0]?.values;
      if (!vector) {
        throw new Error('Embedding response had no vector');
      }
      return vector;
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === MAX_RETRIES) break;
      const backoffMs = 500 * 2 ** (attempt - 1);
      console.warn(`embeddings: attempt ${attempt} failed (${error.message}), retrying in ${backoffMs}ms`);
      await sleep(backoffMs);
    }
  }

  throw new Error(`embeddings: all ${MAX_RETRIES} attempts failed: ${lastError.message}`);
}

module.exports = { embedText };