// Vercel Serverless Function - Diagnóstico del Chatbot

module.exports = function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const apiKeyLength = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0;
    const apiKeyPreview = process.env.GEMINI_API_KEY
        ? process.env.GEMINI_API_KEY.substring(0, 6) + '...'
        : 'No configurada';

    res.status(200).json({
        geminiConfigured: hasApiKey,
        apiKeyLength: apiKeyLength,
        apiKeyPreview: apiKeyPreview,
        model: 'gemini-2.0-flash',
        sdk: '@google/generative-ai (SDK oficial)',
        status: hasApiKey
            ? '✅ Gemini AI activo - Modelo gemini-2.0-flash'
            : '⚠️ Usando respuestas locales (configura GEMINI_API_KEY en las variables de entorno)',
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
};
