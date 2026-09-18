const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

async function callOpenRouter(prompt) {
  const response =
    await client.chat.completions.create({
      model: 'qwen/qwen3-32b',
      temperature: 0.2,
      max_tokens: 100,
      extra_body: {
        models: ['meta-llama/llama-3.3-70b-instruct'],
      },
      messages: [{role: 'user',content: prompt,},],
    });

  const content = response.choices?.[0]?.message?.content;
  console.log(`OpenRouter: model=${response.model}, finish_reason=${response.choices?.[0]?.finish_reason}, content=${JSON.stringify(content)}`);
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('callOpenRouter: failed to get response content');
  }
  return content.trim();
}

module.exports = { callOpenRouter };