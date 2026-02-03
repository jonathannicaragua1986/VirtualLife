// Vercel Serverless Function para el Chatbot con Gemini AI

const BUSINESS_CONTEXT = `
Eres María, una agente de servicio al cliente de VIRTUAL LIFE, un centro de realidad virtual.

INFORMACIÓN DEL NEGOCIO:
- Nombre: Virtual Life - Centro de Realidad Virtual
- WhatsApp: +505 7779-143

HORARIOS:
- Lunes a Jueves: 12:00 pm a 10:00 pm
- Viernes: 12:00 pm a 12:00 am
- Sábado: 10:00 am a 1:00 am
- Domingo: 10:00 am a 11:00 pm

PRECIOS:
- 30 minutos: $15,000 por persona
- 1 hora: $25,000 por persona (el más popular)
- 1 hora y media: $35,000 por persona
- Todos incluyen instructor y acceso a +50 juegos

JUEGOS POPULARES:
- Beat Saber (música y ritmo)
- Arizona Sunshine 2 (zombies)
- Phasmophobia (terror, mayores de 14)
- Gorilla Tag (viral, grupos)
- Batman VR (nuevo 2025)

TU PERSONALIDAD (María):
- Eres amable, cálida y profesional
- Hablas de forma natural
- Respondes en español
- No uses muchos emojis
- Respuestas cortas (2-3 oraciones)
- NO reveles que eres IA
`;

function getFallbackResponse(message) {
    const text = (message || '').toLowerCase();

    if (text.match(/hola|buenos|buenas|hey|hi/)) {
        return 'Hola! Soy María de Virtual Life. En qué te puedo ayudar?';
    }
    if (text.match(/precio|costo|cuanto|cuánto/)) {
        return 'Nuestros precios: 30 min ($15,000), 1 hora ($25,000) o 1.5 horas ($35,000). Todo incluye instructor y +50 juegos.';
    }
    if (text.match(/horario|hora|abre|cierra/)) {
        return 'Abrimos Lun-Jue 12pm-10pm, Viernes 12pm-12am, Sábado 10am-1am, Domingo 10am-11pm.';
    }
    if (text.match(/reserv|turno|cita/)) {
        return 'Para reservar te puedo pasar con mi compañero Carlos por WhatsApp. Te parece?';
    }
    if (text.match(/juego|game/)) {
        return 'Tenemos +50 juegos: Beat Saber, Arizona Sunshine 2, Phasmophobia, Gorilla Tag, Batman VR y más.';
    }

    return 'Claro, cuéntame más. Puedo ayudarte con precios, horarios, juegos o reservaciones.';
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
            return res.status(200).json({
                response: getFallbackResponse(message),
                source: 'local'
            });
        }

        const conversationHistory = (history || [])
            .filter(msg => msg.type === 'user' || msg.type === 'bot')
            .map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
            contents: [
                { role: 'user', parts: [{ text: BUSINESS_CONTEXT }] },
                { role: 'model', parts: [{ text: 'Entendido! Soy María de Virtual Life.' }] },
                ...conversationHistory,
                { role: 'user', parts: [{ text: message }] }
            ],
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 300,
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({
                response: getFallbackResponse(message),
                source: 'local-error'
            });
        }

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return res.status(200).json({
                response: data.candidates[0].content.parts[0].text,
                source: 'gemini'
            });
        }

        return res.status(200).json({
            response: getFallbackResponse(message),
            source: 'local-no-response'
        });

    } catch (error) {
        return res.status(200).json({
            response: getFallbackResponse(req.body?.message || ''),
            source: 'error'
        });
    }
};
