// Endpoint de diagnóstico del Chatbot (Vercel Serverless)
// Versión: 5.0.0

module.exports = function handler(req, res) {
    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const grokKey = process.env.GROK_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';

    const hasGrok = grokKey.trim().length > 0;
    const hasGemini = geminiKey.trim().length > 0;

    res.status(200).json({
        grokConfigured: hasGrok,
        geminiConfigured: hasGemini,
        primaryEngine: hasGemini ? 'Gemini 2.5 Pro GA' : hasGrok ? 'Grok (xAI) - grok-3-mini' : 'Respuestas locales',
        fallbackEngine: hasGrok ? 'Grok (xAI) - grok-3-mini' : 'Respuestas locales',
        status: hasGemini && hasGrok
            ? '✅ Ambos motores activos (Gemini 2.5 Pro principal, Grok respaldo)'
            : hasGemini
                ? '⚠️ Solo Gemini 2.5 Pro disponible'
                : hasGrok
                    ? '⚠️ Solo Grok disponible'
                    : '❌ Sin APIs configuradas',
        version: '5.0.0'
    });
};
