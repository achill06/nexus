const OpenAI = require('openai');
const config = require('../tools/config');

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error) {
  const status = error?.status ?? error?.response?.status;
  return !status || status === 429 || status >= 500;
}

async function callOpenRouter(prompt) {
  let lastError;

  for (let attempt = 1; attempt <= config.shared.retries; attempt += 1) {
    try {
      const response = await client.chat.completions.create({
        model: 'qwen/qwen3-32b',
        temperature: 0.2,
        max_tokens: 100,
        extra_body: {
          models: ['meta-llama/llama-3.3-70b-instruct'],
        },
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.choices?.[0]?.message?.content;
      console.log(`OpenRouter: model=${response.model}, finish_reason=${response.choices?.[0]?.finish_reason}, content=${JSON.stringify(content)}`);
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('callOpenRouter: failed to get response content');
      }
      return content.trim();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === config.shared.retries) {break;}
      const backoffMs = 500 * 2 ** (attempt - 1);
      console.warn(`OpenRouter: attempt ${attempt} failed (status=${error.status ?? 'network'}, ${error.message})`,error);
      await sleep(backoffMs);
    }
  }
  throw new Error(`callOpenRouter: all ${config.shared.retries} attempts failed: ${lastError.message}`);
}

module.exports = { callOpenRouter };