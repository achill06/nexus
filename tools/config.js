require('dotenv').config();
module.exports = {
    shared: {
        requestDelay: 1000,
        timeout: 10000,
        retries: 3,
    },
    github: {
        baseSiteUrl: 'https://api.github.com',
        startUrl: 'https://api.github.com/repos/SimplifyJobs/Summer2027-Internships/contents/README.md?ref=dev',
        headers: {
            'User-Agent': 'nexus-scraper/1.0 (student project)',
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3.raw',
        },
        outputPath: './output/simplify.json',
    },
    remoteok: {
        baseSiteUrl: 'https://remoteok.com/api',
        startUrl: 'https://remoteok.com/api',
        headers: {
            'User-Agent': 'nexus-scraper/1.0 (student project)'
        },
        outputPath: './output/remoteok.json',
    },
    postgres: {
        connectionString: process.env.DATABASE_URL,
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: 'qwen/qwen3.8-27b',
        temperature: 0,
        timeout: 30000,
        repairAttempts: 5,
        maxOutputTokens: 600,
    },
    gemini:{
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-3.1-flash-lite',
        temperature: 0,
        timeout: 30000,
        repairAttempts: 5,
        maxOutputTokens: 600,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
    },
    embeddings: {
        provider: 'gemini',
        model: 'gemini-embedding-2',
        dimension: 768,
    },
};

