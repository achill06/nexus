const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

async function callOpenRouter(prompt) {
  const response =
    await client.chat.completions.create({
      model: 'qwen/qwen3.8-flash',
      temperature: 0.2,
      max_tokens: 60,
      extra_body: {
        models: ['qwen/qwen3-32b','meta-llama/llama-3.3-70b-instruct'],
      },
      messages: [{role: 'user',content: prompt,},],
    });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('callOpenRouter: failed to get response content');
  }
  return content;
}

module.exports = { callOpenRouter };