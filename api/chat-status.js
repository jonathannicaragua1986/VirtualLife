// Endpoint de diagnóstico del Chatbot
module.exports = function handler(req, res) {
    const grokKey = process.env.GROK_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';

    const hasGrok = grokKey.length > 0;
    const hasGemini = geminiKey.length > 0;

    res.status(200).json({
        grokConfigured: hasGrok,
        grokPreview: hasGrok ? grokKey.substring(0, 8) + '...' : 'No configurada',
        geminiConfigured: hasGemini,
        geminiPreview: hasGemini ? geminiKey.substring(0, 8) + '...' : 'No configurada',
        primaryEngine: hasGrok ? 'Grok (xAI) - grok-2-latest' : hasGemini ? 'Gemini - gemini-2.0-flash' : 'Respuestas locales',
        fallbackEngine: hasGemini ? 'Gemini - gemini-2.0-flash' : 'Respuestas locales',
        status: hasGrok ? '✅ Grok AI activo (motor principal)' : hasGemini ? '⚠️ Solo Gemini disponible' : '❌ Sin APIs configuradas'
    });
};
