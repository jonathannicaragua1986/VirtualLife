// Vercel Serverless Function - Wrapper para el Servicio de Chat
// (Delega toda la lógica a services/chatService.js para evitar duplicación)
// Versión: 4.0.0

const { processChatMessage } = require('../services/chatService');

// Rate limiting simple para serverless
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 20; // 20 mensajes por minuto

function checkRateLimit(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    // Protección de memoria
    if (rateLimitMap.size > 5000) rateLimitMap.clear();

    if (!record || (now - record.start) > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return true;
    }
    if (record.count >= RATE_LIMIT_MAX) return false;
    record.count++;
    return true;
}

module.exports = async function handler(req, res) {
    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        // Rate limiting
        const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
        if (!checkRateLimit(clientIP)) {
            return res.status(429).json({
                response: 'Estoy recibiendo muchos mensajes. Esperá un momentito y volvé a intentar. 😊',
                source: 'rate-limit'
            });
        }

        const { message, history } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }

        // Sanitizar entrada
        const sanitizedMessage = message.trim().substring(0, 1000);
        const chatHistory = Array.isArray(history) ? history.slice(-20) : [];

        // Procesar mensaje delegando al servicio centralizado
        const result = await processChatMessage(sanitizedMessage, chatHistory, process.env);

        // SIN delay artificial - el frontend maneja la UX
        return res.status(200).json({
            response: result.response,
            source: result.source
        });

    } catch (error) {
        console.error('[Vercel Chat] Error crítico:', error.message);
        return res.status(200).json({
            response: 'Lo siento, tuve un problema técnico. ¿Me podrías repetir eso?',
            source: 'error'
        });
    }
};
