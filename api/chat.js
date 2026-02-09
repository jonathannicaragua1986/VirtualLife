// Vercel Serverless Function para el Chatbot con Gemini AI
// Usa la SDK oficial de Google para mejor integración

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Contexto del negocio - instrucciones del sistema para María
const SYSTEM_INSTRUCTION = `
Eres María, una agente de servicio al cliente de VIRTUAL LIFE, un centro de realidad virtual.

INFORMACIÓN DEL NEGOCIO:
- Nombre: Virtual Life - Centro de Realidad Virtual
- WhatsApp: +505 7779-143

HORARIOS:
- Lunes a Jueves: 12:00 pm a 10:00 pm
- Viernes: 12:00 pm a 12:00 am (medianoche)
- Sábado: 10:00 am a 1:00 am
- Domingo: 10:00 am a 11:00 pm

PRECIOS:
- 30 minutos: $15,000 por persona
- 1 hora: $25,000 por persona (el más popular)
- 1 hora y media: $35,000 por persona
- Todos incluyen instructor y acceso a +50 juegos

PAQUETES DE CUMPLEAÑOS:
- Pack Estándar: $18,000/niño (1 hora de juego + sala privada para pastel)
- Pack VIP: $28,000/niño (1.5 horas + torneo + pizza + regalo para cumpleañero)

JUEGOS POPULARES:
- Beat Saber (música y ritmo)
- Arizona Sunshine 2 (zombies, cooperativo)
- Phasmophobia (terror, solo mayores de 14 años)
- Gorilla Tag (viral, divertido para grupos)
- Batman VR (nuevo exclusivo 2025)
- Superhot VR, Among Us VR, Job Simulator y +50 títulos más

TECNOLOGÍA:
- Cascos Meta Quest 3 (última generación)
- 100% inalámbricos (sin cables)
- Resolución 4K+
- Arena Free Roam de 200m²
- Hasta 10 jugadores simultáneos

EDAD MÍNIMA:
- Recomendado desde 8 años
- Juegos de terror: solo mayores de 14 años

TU PERSONALIDAD (María):
- Eres amable, cálida y profesional
- Hablas de forma natural, como una persona real
- Usas un tono conversacional y cercano
- Te encanta tu trabajo y la realidad virtual
- Respondes siempre en español
- No uses emojis excesivos (máximo 1-2 por mensaje)
- Mantén respuestas cortas y directas (máximo 2-3 oraciones por idea)
- Si no sabes algo, ofrece pasar al cliente por WhatsApp con tu compañero Carlos
- NUNCA reveles que eres una IA o chatbot. Eres María, una persona real.

INSTRUCCIONES:
1. Responde de forma natural y conversacional
2. Si preguntan sobre reservar, ofrece conectarlos por WhatsApp
3. Si tienen quejas, muestra empatía y ofrece soluciones
4. Siempre cierra con una pregunta o invitación a continuar la conversación
5. NO uses formato markdown (ni asteriscos, ni negritas, ni listas con guiones). Escribe texto plano natural.
`;

// Respuestas fallback cuando no hay API key o hay error
function getFallbackResponse(message) {
    const text = (message || '').toLowerCase();

    if (text.match(/hola|buenos|buenas|hey|hi/)) {
        return '¡Hola! Soy María de Virtual Life. ¿En qué te puedo ayudar hoy?';
    }
    if (text.match(/precio|costo|cuanto|cuánto/)) {
        return 'Nuestros precios son: 30 min ($15,000), 1 hora ($25,000) o 1.5 horas ($35,000). Todo incluye instructor y +50 juegos. ¿Para cuántas personas sería?';
    }
    if (text.match(/horario|hora|abre|cierra/)) {
        return 'Abrimos Lun-Jue 12pm-10pm, Viernes 12pm-12am, Sábado 10am-1am, Domingo 10am-11pm. ¿Cuándo te gustaría venir?';
    }
    if (text.match(/reserv|turno|cita/)) {
        return 'Para reservar te puedo pasar con mi compañero Carlos por WhatsApp. ¿Te parece bien?';
    }
    if (text.match(/juego|game/)) {
        return 'Tenemos +50 juegos: Beat Saber, Arizona Sunshine 2, Phasmophobia, Gorilla Tag, Batman VR y más. ¿Qué tipo de experiencia buscas?';
    }
    if (text.match(/gracias|thank/)) {
        return '¡Con mucho gusto! ¿Hay algo más en lo que te pueda ayudar?';
    }

    return 'Claro, cuéntame más sobre lo que necesitas. Puedo ayudarte con precios, horarios, juegos o reservaciones.';
}

module.exports = async function handler(req, res) {
    // Cabeceras CORS
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
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // Si no hay API key, usar respuestas locales
        if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
            console.log('[Chat] Sin API key, usando respuestas locales');
            return res.status(200).json({
                response: getFallbackResponse(message),
                source: 'local'
            });
        }

        // Inicializar el cliente de Gemini con la SDK oficial
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 400,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
        });

        // Construir historial de conversación
        const conversationHistory = (history || [])
            .filter(msg => msg.type === 'user' || msg.type === 'bot')
            .map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        // Iniciar chat con historial
        const chat = model.startChat({
            history: conversationHistory,
        });

        // Enviar mensaje y obtener respuesta
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        console.log(`[Chat] Gemini respondió: ${responseText.substring(0, 80)}...`);

        return res.status(200).json({
            response: responseText,
            source: 'gemini'
        });

    } catch (error) {
        console.error('[Chat] Error:', error.message);
        console.error('[Chat] Stack:', error.stack);

        // Intentar extraer información útil del error
        let errorDetail = error.message || 'Error desconocido';

        return res.status(200).json({
            response: getFallbackResponse(req.body?.message || ''),
            source: 'error',
            debug: {
                error: errorDetail,
                timestamp: new Date().toISOString()
            }
        });
    }
};
