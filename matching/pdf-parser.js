const { PDFParse } = require('pdf-parse');

const MIN_TEXT_LENGTH = 50;

async function extractTextFromPDF(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('pdf-parser: no file data received');
  }

  const parser = new PDFParse({ data: buffer });
  let result;
  try {
    result = await parser.getText({ pageJoiner: '\n' });
  } catch (error) {
    throw new Error(`pdf-parser: failed to parse PDF (${error.message})`);
  } finally {
    await parser.destroy();
  }

  const cleaned = normalizeText(result.text);

  if (cleaned.length < MIN_TEXT_LENGTH) {
    throw new Error(
      'pdf-parser: extracted text is too short, this PDF may be scanned/image-based, which is not supported'
    );
  }

  return cleaned;
}

function normalizeText(rawText) {
  return rawText.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { extractTextFromPDF };