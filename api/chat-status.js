// Vercel Serverless Function - Status del Chatbot

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const apiKeyLength = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0;

    res.status(200).json({
        geminiConfigured: hasApiKey,
        apiKeyLength: apiKeyLength,
        status: hasApiKey ? '✅ Gemini AI activo' : '⚠️ Usando respuestas locales (configura GEMINI_API_KEY)',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
}
